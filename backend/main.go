// @title           Board Game Rulebook API
// @version         1.0
// @description     API for searching and retrieving board game rulebooks
// @host            api.rule-book.org
// @BasePath        /
package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/iris-contrib/middleware/cors"
	"github.com/iris-contrib/swagger"
	"github.com/iris-contrib/swagger/swaggerFiles"
	_ "github.com/mariannefeng/rulebook/backend-go/docs"

	"github.com/andybalholm/cascadia"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/joho/godotenv"
	"github.com/kataras/iris/v12"
	"golang.org/x/net/html"
)

func getTextContent(n *html.Node) string {
	if n.Type == html.TextNode {
		return n.Data
	}
	var text strings.Builder
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		text.WriteString(getTextContent(c))
	}
	return text.String()
}

func getAttr(n *html.Node, key string) string {
	for _, attr := range n.Attr {
		if attr.Key == key {
			return attr.Val
		}
	}
	return ""
}

var gameIdToLinks = make(map[string]map[string]string) // map[gameId][language] = PDF link

type GameResult struct {
	Id       string `json:"id"`
	Name     string `json:"name"`
	Link     string `json:"link"`
	Language string `json:"language"`
}

type LanguagesResponse struct {
	Languages []string `json:"languages"`
}

type GamesResponse struct {
	Results []GameResult `json:"results"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

// pdfContainsJPX reports whether the PDF contains JPEG2000 (JPX) image streams.
// Such PDFs can fail to render in pdf.js due to OpenJPEG decoder issues.
func pdfContainsJPX(pdfData []byte) bool {
	return bytes.Contains(pdfData, []byte("JPXDecode")) || bytes.Contains(pdfData, []byte("/JPX"))
}

// rewritePDFWithGhostscript runs the equivalent of:
//
//	gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dCompatibilityLevel=1.4 \
//	   -dNOPAUSE -dBATCH -dDetectDuplicateImages=true \
//	   -sOutputFile=- -
//
// using the gs binary: PDF bytes in via stdin, rewritten PDF bytes out via stdout.
// No temp files; all in memory. Requires Ghostscript installed (e.g. apt-get install ghostscript).
func rewritePDFWithGhostscript(ctx context.Context, pdfData []byte) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()

	cmd := exec.CommandContext(ctx, "gs",
		"-sDEVICE=pdfwrite",
		"-dPDFSETTINGS=/ebook",
		"-dCompatibilityLevel=1.4",
		"-dNOPAUSE", "-dBATCH",
		"-dDetectDuplicateImages=true",
		"-dQUIET",
		"-sOutputFile=-",
		"-",
	)
	cmd.Stdin = bytes.NewReader(pdfData)
	var out, errOut bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &errOut

	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("gs: %w (stderr: %s)", err, errOut.String())
	}
	return out.Bytes(), nil
}

func main() {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		log.Fatalln("Error loading .env")
	}

	accessKeyId := os.Getenv("R2_ACCESS_KEY_ID")
	accessKeySecret := os.Getenv("R2_ACCESS_KEY_SECRET")
	accountId := os.Getenv("R2_ACCOUNT_ID")
	r2Bucket := os.Getenv("R2_BUCKET")

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyId, accessKeySecret, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		log.Fatal(err)
	}

	app := iris.New()

	// Enable CORS
	crs := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Allow all origins
		AllowCredentials: true,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
	})
	app.UseRouter(crs)

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountId))
	})

	swaggerUI := swagger.Handler(swaggerFiles.Handler,
		swagger.URL("/swagger/swagger.json"),
		swagger.DeepLinking(true),
		swagger.Prefix("/swagger"),
	)

	app.Get("/swagger", swaggerUI)
	app.Get("/swagger/{any:path}", swaggerUI)

	gamesAPI := app.Party("/games")
	{
		gamesAPI.Use(iris.Compression)
		gamesAPI.Use(func(ctx iris.Context) {
			ctx.Values().Set("s3Client", client)
			ctx.Values().Set("bucket", r2Bucket)
			ctx.Next()
		})

		gamesAPI.Get("/", getGames)
		gamesAPI.Get("/{game_id}/rules", getRules)
		gamesAPI.Get("/languages", getLanguages)
	}

	fmt.Printf("port running on http://localhost:8080/\n")
	app.Listen(":8080")
}

// @Summary      Get available languages
// @Description  Returns a list of supported languages for game rulebooks
// @Tags         languages
// @Accept       json
// @Produce      json
// @Success      200  {object}  LanguagesResponse
// @Router       /games/languages [get]
func getLanguages(ctx iris.Context) {
	ctx.JSON(iris.Map{"languages": []string{"en", "fr"}})
}

type GetGamesRequest struct {
	Search   string `url:"search"`
	Language string `url:"language"`
}

// @Summary      Search for games
// @Description  Search for game rulebooks by name. Returns a list of matching games with their PDF links.
// @Tags         games
// @Accept       json
// @Produce      json
// @Param        search    query     string  true   "Search query"
// @Param        language  query     string  false  "Language code (en or fr)" default(en)
// @Success      200       {object}  GamesResponse
// @Failure      400       {object}  ErrorResponse
// @Failure      500       {object}  ErrorResponse
// @Router       /games [get]
func getGames(ctx iris.Context) {
	var queryParams GetGamesRequest
	err := ctx.ReadQuery(&queryParams)
	if err != nil {
		ctx.StopWithJSON(iris.StatusBadRequest, iris.Map{"error": err.Error()})
		return
	}

	search := queryParams.Search
	language := queryParams.Language

	if language == "" {
		language = "en"
	}

	if search == "" {
		ctx.StopWithJSON(iris.StatusBadRequest, iris.Map{"error": "Search is required"})
		return
	}

	url := fmt.Sprintf("https://en.1jour-1jeu.com/rules/search?q=%s", search)
	resp, err := http.Get(url)
	if err != nil {
		ctx.StopWithJSON(iris.StatusInternalServerError, iris.Map{"error": "Error fetching search results"})
		return
	}
	defer resp.Body.Close()

	root, err := html.Parse(resp.Body)
	if err != nil {
		ctx.StopWithJSON(iris.StatusInternalServerError, iris.Map{"error": "Failed to parse HTML"})
		return
	}

	var results []GameResult

	colCenterSelector, err := cascadia.Compile("div.col-center")
	if err != nil {
		ctx.StopWithJSON(iris.StatusInternalServerError, iris.Map{"error": "Failed to compile CSS selector"})
		return
	}

	colCenters := cascadia.QueryAll(root, colCenterSelector)

	for _, colCenter := range colCenters {
		darkLinkSelector, err := cascadia.Compile("a.dark-link")
		if err != nil {
			continue
		}
		aDarkLink := cascadia.Query(colCenter, darkLinkSelector)
		if aDarkLink == nil {
			continue
		}
		name := getTextContent(aDarkLink)
		href := getAttr(aDarkLink, "href")

		if href == "" {
			continue
		}

		// if language is french, get french link instead
		if language == "fr" {
			frenchPDF, err := cascadia.Compile("a[title=\"In French\"]")
			if err != nil {
				ctx.StopWithJSON(iris.StatusInternalServerError, iris.Map{"error": "Failed to compile CSS selector"})
				return
			}

			frenchLink := cascadia.Query(colCenter, frenchPDF)
			if frenchLink == nil {
				continue
			}
			frenchHref := getAttr(frenchLink, "href")
			if frenchHref == "" {
				continue
			}
			href = frenchHref
		}

		if href == "" {
			continue
		}

		// validate pdf link and add to result
		if len(href) >= 4 && href[len(href)-4:] == ".pdf" {
			id := name
			id = strings.ToLower(id)
			id = strings.ReplaceAll(id, " ", "-")
			id = strings.ReplaceAll(id, "-rulebook", "")

			idRunes := []rune{}
			for _, r := range id {
				if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
					idRunes = append(idRunes, r)
				}
			}
			id = string(idRunes)

			if _, ok := gameIdToLinks[id]; !ok {
				gameIdToLinks[id] = make(map[string]string)
			}

			gameIdToLinks[id][language] = href

			results = append(results, GameResult{
				Id:       id,
				Name:     strings.TrimSpace(name),
				Link:     href,
				Language: language,
			})
		}
	}

	ctx.JSON(iris.Map{"results": results})
}

type GetRulesRequest struct {
	Language string `url:"language"`
}

// @Summary      Get game rules PDF
// @Description  Retrieve a PDF rulebook for a specific game. The PDF is served from cache if available, otherwise downloaded and cached.
// @Tags         games
// @Accept       json
// @Produce      application/pdf
// @Param        game_id   path      string  true   "Game ID"
// @Param        language  query     string  false  "Language code (en or fr)" default(en)
// @Success      200       {file}    binary  "PDF file"
// @Failure      400       {object}  ErrorResponse  "Bad request"
// @Failure      404       {object}  ErrorResponse  "Game not found or language not available"
// @Failure      500       {object}  ErrorResponse  "Internal server error"
// @Router       /games/{game_id}/rules [get]
func getRules(ctx iris.Context) {
	gameId := ctx.Params().GetString("game_id")
	if gameId == "" {
		ctx.StopWithJSON(iris.StatusBadRequest, iris.Map{"error": "game_id is required"})
		return
	}

	var queryParams GetRulesRequest
	ctx.ReadQuery(&queryParams)
	language := queryParams.Language
	if language == "" {
		language = "en"
	}

	// Get dependencies from context
	s3Client, ok1 := ctx.Values().Get("s3Client").(*s3.Client)
	bucket, ok2 := ctx.Values().Get("bucket").(string)
	if !ok1 || !ok2 {
		ctx.StopWithJSON(iris.StatusInternalServerError, iris.Map{"error": "Server configuration error"})
		return
	}

	filename := fmt.Sprintf("%s-%s.pdf", gameId, language)
	reqCtx := ctx.Request().Context()

	skipCache := os.Getenv("SKIP_CACHE") == "true"

	if !skipCache {
		fmt.Printf("Checking if PDF exists in S3...\n")

		getResp, err := s3Client.GetObject(reqCtx, &s3.GetObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(filename),
		})

		// pdf exists in s3, serve from s3
		if err == nil && getResp != nil {
			fmt.Printf("PDF exists in S3, serving from S3...\n")
			pdfData, err := io.ReadAll(getResp.Body)
			if err != nil {
				ctx.StopWithJSON(iris.StatusInternalServerError, iris.Map{"error": "Failed to read PDF"})
				return
			}
			defer getResp.Body.Close()

			ctx.ContentType("application/pdf")
			ctx.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", filename))
			ctx.StatusCode(iris.StatusOK)
			ctx.Write(pdfData)
			return
		}
	}

	// Check if game exists in memory map
	gameLinks, ok := gameIdToLinks[gameId]
	if !ok {
		ctx.StopWithJSON(iris.StatusNotFound, iris.Map{"error": "Game not found"})
		return
	}

	href, ok := gameLinks[language]
	if !ok {
		ctx.StopWithJSON(iris.StatusNotFound, iris.Map{"error": "Language not available for this game"})
		return
	}

	// object doesn't exist in s3, download
	resp, err := http.Get(href)
	if err != nil {
		ctx.StopWithJSON(iris.StatusInternalServerError, iris.Map{"error": "Failed to download PDF"})
		return
	}
	defer resp.Body.Close()

	pdfData, err := io.ReadAll(resp.Body)
	if err != nil {
		ctx.StopWithJSON(iris.StatusInternalServerError, iris.Map{"error": "Failed to read PDF"})
		return
	}

	// Upload to S3 in background
	go func(gameId, language, filename string, pdfData []byte) {
		jobContext := context.Background()

		// Re-encode PDF if it contains JPEG2000 (JPX) so it displays in pdf.js before storing in R2
		if pdfContainsJPX(pdfData) {
			fmt.Printf("PDF contains JPX, rewriting...\n")
			rewritten, err := rewritePDFWithGhostscript(jobContext, pdfData)
			if err != nil {
				log.Printf("PDF rewrite (JPX→JPEG) skipped for %s: %v", filename, err)
			} else {
				pdfData = rewritten
			}
		}

		_, uploadErr := s3Client.PutObject(jobContext, &s3.PutObjectInput{
			Bucket:      aws.String(bucket),
			Key:         aws.String(filename),
			Body:        bytes.NewReader(pdfData),
			ContentType: aws.String("application/pdf"),
			ACL:         types.ObjectCannedACLPublicRead,
		})
		if uploadErr != nil {
			fmt.Printf("Failed to upload PDF to R2: %v\n", uploadErr)
			return
		}

		fmt.Printf("Background PDF upload complete for %s\n", filename)
	}(gameId, language, filename, pdfData)

	ctx.ContentType("application/pdf")
	ctx.Header("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", filename))
	ctx.StatusCode(iris.StatusOK)
	ctx.Write(pdfData)
}
