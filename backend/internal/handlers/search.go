package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

func SearchPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	// Search in comment, title, or tags
	sqlQuery := `
		SELECT p.id, p.user_id, p.title, p.song_id, p.song_type, p.comment, p.tags, p.created_at,
		       u.id, u.display_name, u.profile_image, u.bio
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
		WHERE p.comment ILIKE '%' || $1 || '%' 
		   OR p.title ILIKE '%' || $1 || '%'
		   OR $1 = ANY(p.tags)
		ORDER BY p.created_at DESC
	`

	rows, err := database.DB.Query(sqlQuery, query)
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

func SearchUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	query := r.URL.Query().Get("q")

	var (
		rows *sql.Rows
		err  error
	)

	if query == "" {
		rows, err = database.DB.Query(`
			SELECT id, oauth_id, display_name, profile_image, bio, created_at
			FROM users
			ORDER BY display_name ASC
		`)
	} else {
		rows, err = database.DB.Query(`
			SELECT id, oauth_id, display_name, profile_image, bio, created_at
			FROM users
			WHERE display_name ILIKE '%' || $1 || '%'
			ORDER BY created_at DESC
		`, query)
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.OAuthID, &u.DisplayName, &u.ProfileImage, &u.Bio, &u.CreatedAt)
		if err != nil {
			log.Println("Error scanning row:", err)
			continue
		}
		users = append(users, u)
	}

	json.NewEncoder(w).Encode(users)
}
