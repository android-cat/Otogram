package auth

import (
	"fmt"
	"net/http"
	"os"
)

func HandleSpotifyLogin(w http.ResponseWriter, r *http.Request) {
	clientID := os.Getenv("SPOTIFY_CLIENT_ID")
	redirectURI := os.Getenv("SPOTIFY_REDIRECT_URI")
	scope := "user-read-private user-read-email"
	
	url := fmt.Sprintf("https://accounts.spotify.com/authorize?response_type=code&client_id=%s&scope=%s&redirect_uri=%s", clientID, scope, redirectURI)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func HandleSpotifyCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Code not found", http.StatusBadRequest)
		return
	}
	
	// Exchange code for token (simplified for now)
	// In a real app, you would exchange code for token, get user info, and create session
	
	fmt.Fprintf(w, "Login successful! Code: %s", code)
}
