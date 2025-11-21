package handlers

import (
	"database/sql"
	"backend/internal/database"
	"backend/internal/models"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

func GetPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	baseQuery := `
		SELECT p.id, p.user_id, p.title, p.song_id, p.song_type, p.comment, p.tags, p.created_at,
		       u.id, u.display_name, u.profile_image
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
		
		err := rows.Scan(&p.ID, &p.UserID, &p.Title, &p.SongID, &p.SongType, &p.Comment, &p.Tags, &p.CreatedAt, &u.ID, &u.DisplayName, &u.ProfileImage)
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

	var p models.Post
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validation
	if len(p.Tags) > 10 {
		http.Error(w, "Too many tags (max 10)", http.StatusBadRequest)
		return
	}

	// Hardcoded user_id for demo
	userID := 1 

	err := database.DB.QueryRow(`
		INSERT INTO posts (user_id, title, song_id, song_type, comment, tags)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`, userID, p.Title, p.SongID, p.SongType, p.Comment, p.Tags).Scan(&p.ID, &p.CreatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(p)
}

