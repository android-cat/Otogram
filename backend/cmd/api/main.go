package main

import (
	"fmt"
	"log"
	"net/http"

	"backend/internal/auth"
	"backend/internal/database"
	"backend/internal/handlers"
)

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func main() {
	database.InitDB()

	http.HandleFunc("/auth/spotify", enableCORS(auth.HandleSpotifyLogin))
	http.HandleFunc("/auth/spotify/callback", enableCORS(auth.HandleSpotifyCallback))
	
	http.HandleFunc("/api/posts", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			handlers.GetPosts(w, r)
		} else if r.Method == "POST" {
			handlers.CreatePost(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))

	http.HandleFunc("/api/search/posts", enableCORS(handlers.SearchPosts))
	http.HandleFunc("/api/search/users", enableCORS(handlers.SearchUsers))

	http.HandleFunc("/health", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "OK")
	}))

	fmt.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
