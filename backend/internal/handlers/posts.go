package handlers

import (
	"database/sql"
	"backend/internal/auth"
	"backend/internal/database"
	"backend/internal/models"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
)

func GetPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	baseQuery := `
		SELECT p.id, p.user_id, p.title, p.song_id, p.song_type, p.comment, p.tags, p.created_at,
		       u.id, u.display_name, u.profile_image, u.bio
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
	`

	var rows *sql.Rows
	var err error

	userIDParam := r.URL.Query().Get("user_id")
	if userIDParam != "" {
		userID, convErr := strconv.Atoi(userIDParam)
		if convErr != nil {
			http.Error(w, "invalid user_id", http.StatusBadRequest)
			return
		}

		rows, err = database.DB.Query(baseQuery+" WHERE p.user_id = $1 ORDER BY p.created_at DESC", userID)
	} else {
		rows, err = database.DB.Query(baseQuery+" ORDER BY p.created_at DESC")
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var p models.Post
		var u models.User
		
		err := rows.Scan(&p.ID, &p.UserID, &p.Title, &p.SongID, &p.SongType, &p.Comment, &p.Tags, &p.CreatedAt, &u.ID, &u.DisplayName, &u.ProfileImage, &u.Bio)
		if err != nil {
			log.Println("Error scanning row:", err)
			continue
		}
		p.User = &u
		posts = append(posts, p)
	}

	json.NewEncoder(w).Encode(posts)
}

func CreatePost(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Parse request body
	var request struct {
		models.Post
		PostToTwitter bool `json:"post_to_twitter"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get user from session
	session, err := auth.Store.Get(r, auth.GetSessionCookieName())
	if err != nil {
		log.Println("Session error:", err)
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	userID, ok := session.Values["user_id"].(int)
	if !ok {
		log.Println("No user_id in session")
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}

	// Validation
	if len(request.Tags) > 10 {
		http.Error(w, "Too many tags (max 10)", http.StatusBadRequest)
		return
	}

	// Insert post into database
	err = database.DB.QueryRow(`
		INSERT INTO posts (user_id, title, song_id, song_type, comment, tags)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`, userID, request.Title, request.SongID, request.SongType, request.Comment, request.Tags).Scan(&request.Post.ID, &request.Post.CreatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Post to Twitter if requested
	if request.PostToTwitter {
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "http://127.0.0.1:3000"
		}
		postURL := frontendURL + "/?post_id=" + strconv.Itoa(request.Post.ID)
		
		go func() {
			if err := PostToTwitter(userID, request.Comment, postURL); err != nil {
				log.Printf("Failed to post to Twitter: %v", err)
			} else {
				log.Printf("Successfully posted to Twitter for post ID %d", request.Post.ID)
			}
		}()
	}

	request.Post.UserID = userID
	json.NewEncoder(w).Encode(request.Post)
}

