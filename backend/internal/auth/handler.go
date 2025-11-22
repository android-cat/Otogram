package auth

import (
	"backend/internal/database"
	"backend/internal/models"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"golang.org/x/oauth2"
)

// Spotify Login
func HandleSpotifyLogin(w http.ResponseWriter, r *http.Request) {
	config := GetSpotifyOAuthConfig()
	url := config.AuthCodeURL(oauthStateString, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func HandleSpotifyCallback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	if state != oauthStateString {
		http.Error(w, "Invalid state parameter", http.StatusBadRequest)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Code not found", http.StatusBadRequest)
		return
	}

	config := GetSpotifyOAuthConfig()
	token, err := config.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "Failed to exchange token", http.StatusInternalServerError)
		return
	}

	// Get user info from Spotify
	client := config.Client(context.Background(), token)
	resp, err := client.Get("https://api.spotify.com/v1/me")
	if err != nil {
		http.Error(w, "Failed to get user info", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var spotifyUser struct {
		ID          string `json:"id"`
		DisplayName string `json:"display_name"`
		Images      []struct {
			URL string `json:"url"`
		} `json:"images"`
	}

	if err := json.Unmarshal(body, &spotifyUser); err != nil {
		http.Error(w, "Failed to parse user info", http.StatusInternalServerError)
		return
	}

	// Save or update user in database
	user, err := createOrUpdateUser(spotifyUser.ID, spotifyUser.DisplayName, getProfileImage(spotifyUser.Images), "spotify")
	if err != nil {
		log.Println("Failed to create or update user:", err)
		http.Error(w, "Failed to save user", http.StatusInternalServerError)
		return
	}

	log.Printf("User created/updated: ID=%d, DisplayName=%s", user.ID, user.DisplayName)

	// Create session
	if err := createSession(w, r, user); err != nil {
		log.Println("Failed to create session:", err)
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	// Redirect to frontend
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://127.0.0.1:3000"
	}
	
	redirectURL := frontendURL
	if user.DisplayName == "" {
		redirectURL = frontendURL + "/setup-profile"
	}

	// Manual redirect to ensure Set-Cookie is sent first
	w.Header().Set("Location", redirectURL)
	w.WriteHeader(http.StatusSeeOther)
	log.Printf("Redirecting to: %s", redirectURL)
}

// Twitter/X Login
func HandleTwitterLogin(w http.ResponseWriter, r *http.Request) {
	config := GetTwitterOAuthConfig()
	url := config.AuthCodeURL(oauthStateString, oauth2.AccessTypeOffline, oauth2.SetAuthURLParam("code_challenge", "challenge"), oauth2.SetAuthURLParam("code_challenge_method", "plain"))
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func HandleTwitterCallback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	if state != oauthStateString {
		http.Error(w, "Invalid state parameter", http.StatusBadRequest)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Code not found", http.StatusBadRequest)
		return
	}

	config := GetTwitterOAuthConfig()
	token, err := config.Exchange(context.Background(), code, oauth2.SetAuthURLParam("code_verifier", "challenge"))
	if err != nil {
		log.Println("Failed to exchange token:", err)
		http.Error(w, "Failed to exchange token", http.StatusInternalServerError)
		return
	}

	// Get user info from Twitter
	client := config.Client(context.Background(), token)
	resp, err := client.Get("https://api.twitter.com/2/users/me?user.fields=profile_image_url")
	if err != nil {
		http.Error(w, "Failed to get user info", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var twitterResponse struct {
		Data struct {
			ID              string `json:"id"`
			Name            string `json:"name"`
			Username        string `json:"username"`
			ProfileImageURL string `json:"profile_image_url"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &twitterResponse); err != nil {
		http.Error(w, "Failed to parse user info", http.StatusInternalServerError)
		return
	}

	// Save or update user in database
	user, err := createOrUpdateUser(twitterResponse.Data.ID, twitterResponse.Data.Name, twitterResponse.Data.ProfileImageURL, "twitter")
	if err != nil {
		log.Println("Failed to create or update user:", err)
		http.Error(w, "Failed to save user", http.StatusInternalServerError)
		return
	}

	log.Printf("User created/updated: ID=%d, DisplayName=%s", user.ID, user.DisplayName)

	// Save OAuth token for Twitter
	expiresAt := time.Now().Add(2 * time.Hour) // Twitter tokens typically expire in 2 hours
	if !token.Expiry.IsZero() {
		expiresAt = token.Expiry
	}
	if err := SaveOAuthToken(user.ID, "twitter", token.AccessToken, token.RefreshToken, expiresAt); err != nil {
		log.Println("Warning: Failed to save Twitter OAuth token:", err)
		// Continue anyway as this is not critical for initial login
	}

	// Create session
	if err := createSession(w, r, user); err != nil {
		log.Println("Failed to create session:", err)
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	// Redirect to frontend
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://127.0.0.1:3000"
	}
	
	redirectURL := frontendURL
	if user.DisplayName == "" {
		redirectURL = frontendURL + "/setup-profile"
	}

	// Manual redirect to ensure Set-Cookie is sent first
	w.Header().Set("Location", redirectURL)
	w.WriteHeader(http.StatusSeeOther)
	log.Printf("Redirecting to: %s", redirectURL)
}

// Logout
func HandleLogout(w http.ResponseWriter, r *http.Request) {
	session, _ := Store.Get(r, GetSessionCookieName())
	session.Options.MaxAge = -1
	session.Save(r, w)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

// Get Current User
func HandleGetCurrentUser(w http.ResponseWriter, r *http.Request) {
	session, err := Store.Get(r, GetSessionCookieName())
	if err != nil {
		log.Println("Session error:", err)
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	userID, ok := session.Values["user_id"].(int)
	if !ok {
		log.Println("No user_id in session, session values:", session.Values)
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}

	log.Println("Authenticated user ID:", userID)

	var user models.User
	err = database.DB.QueryRow(`
		SELECT id, oauth_id, oauth_provider, display_name, profile_image, bio, created_at
		FROM users WHERE id = $1
	`, userID).Scan(&user.ID, &user.OAuthID, &user.OAuthProvider, &user.DisplayName, &user.ProfileImage, &user.Bio, &user.CreatedAt)

	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// Helper functions
func createOrUpdateUser(oauthID, displayName, profileImage, provider string) (*models.User, error) {
	var user models.User
	
	// Check if user exists
	err := database.DB.QueryRow(`
		SELECT id, oauth_id, oauth_provider, display_name, profile_image, bio, created_at
		FROM users WHERE oauth_id = $1 AND oauth_provider = $2
	`, oauthID, provider).Scan(&user.ID, &user.OAuthID, &user.OAuthProvider, &user.DisplayName, &user.ProfileImage, &user.Bio, &user.CreatedAt)

	if err != nil {
		// User doesn't exist, create new with empty display_name (force profile setup)
		err = database.DB.QueryRow(`
			INSERT INTO users (oauth_id, oauth_provider, display_name, profile_image, bio, created_at)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id, oauth_id, oauth_provider, display_name, profile_image, bio, created_at
		`, oauthID, provider, "", profileImage, "", time.Now()).Scan(
			&user.ID, &user.OAuthID, &user.OAuthProvider, &user.DisplayName, &user.ProfileImage, &user.Bio, &user.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
	} else {
		// User exists, only update profile_image (keep existing display_name)
		_, err = database.DB.Exec(`
			UPDATE users SET profile_image = $1
			WHERE id = $2
		`, profileImage, user.ID)
		if err != nil {
			return nil, err
		}
		user.ProfileImage = profileImage
	}

	return &user, nil
}

func createSession(w http.ResponseWriter, r *http.Request, user *models.User) error {
	session, err := Store.Get(r, GetSessionCookieName())
	if err != nil {
		log.Println("Error getting session store:", err)
		return err
	}
	session.Values["user_id"] = user.ID
	session.Values["display_name"] = user.DisplayName
	log.Printf("Creating session for user ID: %d, display_name: %s", user.ID, user.DisplayName)
	err = session.Save(r, w)
	if err != nil {
		log.Println("Error saving session:", err)
		return err
	}
	
	// Log the Set-Cookie header to debug
	log.Println("Set-Cookie header:", w.Header().Get("Set-Cookie"))
	log.Println("Session saved successfully")
	return nil
}

func getProfileImage(images []struct {
	URL string `json:"url"`
}) string {
	if len(images) > 0 {
		return images[0].URL
	}
	return ""
}

// Update Profile
func HandleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	session, err := Store.Get(r, GetSessionCookieName())
	if err != nil {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	userID, ok := session.Values["user_id"].(int)
	if !ok {
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}

	var req struct {
		DisplayName  string `json:"display_name"`
		ProfileImage string `json:"profile_image"`
		Bio          string `json:"bio"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Display name is required
	if req.DisplayName == "" {
		http.Error(w, "Display name is required", http.StatusBadRequest)
		return
	}

	// Update user profile
	_, err = database.DB.Exec(`
		UPDATE users SET display_name = $1, profile_image = $2, bio = $3
		WHERE id = $4
	`, req.DisplayName, req.ProfileImage, req.Bio, userID)

	if err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	// Get updated user
	var user models.User
	err = database.DB.QueryRow(`
		SELECT id, oauth_id, oauth_provider, display_name, profile_image, bio, created_at
		FROM users WHERE id = $1
	`, userID).Scan(&user.ID, &user.OAuthID, &user.OAuthProvider, &user.DisplayName, &user.ProfileImage, &user.Bio, &user.CreatedAt)

	if err != nil {
		http.Error(w, "Failed to get user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
