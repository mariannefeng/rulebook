package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/andybalholm/cascadia"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
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

type ServerDeps struct {
	S3Client *s3.Client
	Bucket   string
}

type GameResult struct {
	Id       string `json:"id"`
	Name     string `json:"name"`
	Link     string `json:"link"`
	Language string `json:"language"`
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
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

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountId))
	})

	deps := &ServerDeps{
		S3Client: client,
		Bucket:   r2Bucket,
	}

	router := mux.NewRouter()

	router.HandleFunc("/games/languages", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]string{"en", "fr"})
	}).Methods("GET")

	router.HandleFunc("/games", deps.getGamesHandler).Methods("GET")
	router.HandleFunc("/games/{game_id}/rules", deps.getRulesHandler).Methods("GET")

	fmt.Printf("port running on http://localhost:8081/\n")
	if err := http.ListenAndServe("0.0.0.0:8081", handlers.CORS()(router)); err != nil {
		log.Fatal(err)
	}
}

func (d *ServerDeps) getGamesHandler(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	language := r.URL.Query().Get("language")

	if language == "" {
		language = "en"
	}

	if search == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("[]"))
		return
	}

	url := fmt.Sprintf("https://en.1jour-1jeu.com/rules/search?q=%s", search)
	resp, err := http.Get(url)
	if err != nil {
		http.Error(w, "Error fetching search results", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	root, err := html.Parse(resp.Body)
	if err != nil {
		http.Error(w, "Failed to parse HTML", http.StatusInternalServerError)
		return
	}

	var results []GameResult

	colCenterSelector, err := cascadia.Compile("div.col-center")
	if err != nil {
		http.Error(w, "Failed to compile CSS selector", http.StatusInternalServerError)
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
				http.Error(w, "Failed to compile CSS selector", http.StatusInternalServerError)
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

	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	enc.Encode(results)
}

func (d *ServerDeps) getRulesHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameId := vars["game_id"]
	language := r.URL.Query().Get("language")
	if language == "" {
		language = "en"
	}

	filename := fmt.Sprintf("%s-%s.pdf", gameId, language)

	// Safely access nested map
	gameIdLower := strings.ToLower(gameId)
	langMap, exists := gameIdToLinks[gameIdLower]
	var href string
	var ok bool
	if exists {
		href, ok = langMap[language]
	}

	getResp, err := d.S3Client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(d.Bucket),
		Key:    aws.String(filename),
	})

	// object doesn't exist in s3
	if err != nil {
		if !ok || href == "" {
			http.Error(w, "Game/PDF not found in memory map or storage", http.StatusNotFound)
			return
		}

		resp, err := http.Get(href)
		if err != nil {
			fmt.Printf("Failed to download PDF: %v\n", err)
			return
		}

		pdfData, err := io.ReadAll(resp.Body)
		resp.Body.Close() // Close immediately after reading
		if err != nil {
			http.Error(w, "Failed to read PDF", http.StatusInternalServerError)
			return
		}

		go func(gameId, language, filename string, pdfData []byte) {
			_, uploadErr := d.S3Client.PutObject(context.TODO(), &s3.PutObjectInput{
				Bucket:      aws.String(d.Bucket),
				Key:         aws.String(filename),
				Body:        bytes.NewReader(pdfData),
				ContentType: aws.String("application/pdf"),
				ACL:         types.ObjectCannedACLPublicRead, // Or omit if not needed
			})
			if uploadErr != nil {
				fmt.Printf("Failed to upload PDF to R2: %v\n", uploadErr)
				return
			}

			fmt.Printf("Background PDF upload complete for %s\n", filename)
		}(gameId, language, filename, pdfData)

		// Serve the PDF immediately
		w.Header().Set("Content-Type", "application/pdf")
		w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", filename))
		w.WriteHeader(http.StatusOK)
		w.Write(pdfData)

		return
	}

	defer getResp.Body.Close()
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", filename))
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, getResp.Body)
}
