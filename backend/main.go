package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/andybalholm/cascadia"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
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

var gameIdToPDF = make(map[string]string)

func main() {
	router := mux.NewRouter()

	router.HandleFunc("/games", getGamesHandler).Methods("GET")
	router.HandleFunc("/games/{game_id}/rules", getRulesHandler).Methods("GET")

	fmt.Printf("port running on http://localhost:8081/\n")
	if err := http.ListenAndServe("0.0.0.0:8081", handlers.CORS()(router)); err != nil {
		log.Fatal(err)
	}
}

type GameResult struct {
	Id   string `json:"id"`
	Name string `json:"name"`
	Link string `json:"link"`
}

func getGamesHandler(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
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

	selector, err := cascadia.Compile("a.dark-link")
	if err != nil {
		http.Error(w, "Failed to compile CSS selector", http.StatusInternalServerError)
		return
	}

	nodes := cascadia.QueryAll(root, selector)

	for _, node := range nodes {
		name := getTextContent(node)
		href := getAttr(node, "href")
		if href == "" {
			continue
		}
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

			gameIdToPDF[id] = href

			results = append(results, GameResult{
				Id:   id,
				Name: strings.TrimSpace(name),
				Link: href,
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	enc.Encode(results)
}

func getRulesHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameId := vars["game_id"]
	link, ok := gameIdToPDF[gameId]
	if !ok {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	resp, err := http.Get(link)
	if err != nil {
		http.Error(w, "Failed to fetch PDF", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s.pdf\"", gameId))
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, resp.Body)
}
