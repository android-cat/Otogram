package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"backend/internal/auth"
	"backend/internal/database"
	"backend/internal/handlers"
	"backend/internal/middleware"
)

func main() {
	database.InitDB()
	auth.InitSessionStore()

	mux := http.NewServeMux()

	// Auth routes
	mux.HandleFunc("/auth/spotify", auth.HandleSpotifyLogin)
	mux.HandleFunc("/auth/spotify/callback", auth.HandleSpotifyCallback)
	mux.HandleFunc("/auth/twitter", auth.HandleTwitterLogin)
	mux.HandleFunc("/auth/twitter/callback", auth.HandleTwitterCallback)
	mux.HandleFunc("/auth/logout", auth.HandleLogout)
	mux.HandleFunc("/auth/me", auth.HandleGetCurrentUser)
	mux.HandleFunc("/auth/profile", auth.HandleUpdateProfile)
	
	// Upload routes
	mux.HandleFunc("/api/upload/image", handlers.UploadImage)
	
	// Twitter integration routes
	mux.HandleFunc("/api/twitter/check", handlers.CheckTwitterConnection)
	mux.HandleFunc("/api/twitter/disconnect", handlers.DisconnectTwitter)
	
	// Static file serving for uploads
	fs := http.FileServer(http.Dir("./uploads"))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fs))
	
	// API routes
	mux.HandleFunc("/api/posts", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			handlers.GetPosts(w, r)
		case "POST":
			handlers.CreatePost(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/posts/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.HasSuffix(path, "/like") && r.Method == "POST":
			handlers.ToggleLike(w, r)
		case strings.HasSuffix(path, "/reply") && r.Method == "POST":
			handlers.CreateReply(w, r)
		case strings.HasSuffix(path, "/replies") && r.Method == "GET":
			handlers.GetReplies(w, r)
		default:
			http.NotFound(w, r)
		}
	})

	mux.HandleFunc("/api/search/posts", handlers.SearchPosts)
	mux.HandleFunc("/api/search/users", handlers.SearchUsers)

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "OK")
	})

	fmt.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", middleware.CORS(mux)); err != nil {
		log.Fatal(err)
	}
}
