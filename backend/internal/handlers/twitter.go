package handlers

import (
	"backend/internal/auth"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

// PostToTwitter posts a tweet with comment and URL
func PostToTwitter(userID int, comment, postURL string) error {
	// Get OAuth token
	token, err := auth.GetOAuthToken(userID, "twitter")
	if err != nil {
		return fmt.Errorf("no Twitter token found: %w", err)
	}

	// Prepare tweet text
	tweetText := comment
	if len(tweetText) > 250 { // Leave room for URL
		tweetText = tweetText[:250] + "..."
	}
	tweetText += "\n" + postURL

	// Twitter API v2 endpoint
	apiURL := "https://api.twitter.com/2/tweets"

	requestBody := map[string]interface{}{
		"text": tweetText,
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to post tweet: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		var errorResponse map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errorResponse)
		log.Printf("Twitter API error: %v", errorResponse)
		return fmt.Errorf("twitter API returned status %d", resp.StatusCode)
	}

	return nil
}

// CheckTwitterConnection checks if user has Twitter token
func CheckTwitterConnection(w http.ResponseWriter, r *http.Request) {
	session, err := auth.Store.Get(r, auth.GetSessionCookieName())
	if err != nil {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	userID, ok := session.Values["user_id"].(int)
	if !ok {
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}

	token, err := auth.GetOAuthToken(userID, "twitter")
	connected := err == nil && token != nil

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{
		"connected": connected,
	})
}

// DisconnectTwitter removes Twitter OAuth token
func DisconnectTwitter(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	session, err := auth.Store.Get(r, auth.GetSessionCookieName())
	if err != nil {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	userID, ok := session.Values["user_id"].(int)
	if !ok {
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}

	if err := auth.DeleteOAuthToken(userID, "twitter"); err != nil {
		log.Println("Failed to delete Twitter token:", err)
		http.Error(w, "Failed to disconnect", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Twitter disconnected successfully",
	})
}
