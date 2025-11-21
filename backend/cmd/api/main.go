package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"backend/internal/auth"
	"backend/internal/database"
	"backend/internal/handlers"
)

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := os.Getenv("FRONTEND_URL")
		if origin == "" {
			origin = "http://127.0.0.1:3000"
		}
		
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func enableCORSForFileServer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := os.Getenv("FRONTEND_URL")
		if origin == "" {
			origin = "http://127.0.0.1:3000"
		}
		
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	database.InitDB()
	auth.InitSessionStore()

	// Auth routes
	http.HandleFunc("/auth/spotify", enableCORS(auth.HandleSpotifyLogin))
	http.HandleFunc("/auth/spotify/callback", enableCORS(auth.HandleSpotifyCallback))
	http.HandleFunc("/auth/twitter", enableCORS(auth.HandleTwitterLogin))
	http.HandleFunc("/auth/twitter/callback", enableCORS(auth.HandleTwitterCallback))
	http.HandleFunc("/auth/logout", enableCORS(auth.HandleLogout))
	http.HandleFunc("/auth/me", enableCORS(auth.HandleGetCurrentUser))
	http.HandleFunc("/auth/profile", enableCORS(auth.HandleUpdateProfile))
	
	// Upload routes
	http.HandleFunc("/api/upload/image", enableCORS(handlers.UploadImage))
	
	// Static file serving for uploads
	fs := http.FileServer(http.Dir("./uploads"))
	http.Handle("/uploads/", enableCORSForFileServer(http.StripPrefix("/uploads/", fs)))
	
	// API routes
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
