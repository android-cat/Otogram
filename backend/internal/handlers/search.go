package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"backend/internal/utils"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

func SearchPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	currentUserID, _ := utils.GetCurrentUserID(r)
	searchType := r.URL.Query().Get("type")

	var whereClause string
	switch searchType {
	case "title":
		whereClause = "p.title ILIKE '%' || $2 || '%'"
	case "comment":
		whereClause = "p.comment ILIKE '%' || $2 || '%'"
	case "tag":
		whereClause = "$2 = ANY(p.tags)"
	default: // "all" or empty
		whereClause = "p.comment ILIKE '%' || $2 || '%' OR p.title ILIKE '%' || $2 || '%' OR $2 = ANY(p.tags)"
	}

	sqlQuery := database.BuildPostQuery(whereClause)
	rows, err := database.DB.Query(sqlQuery, currentUserID, query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	posts := utils.ScanPostRows(rows)
	json.NewEncoder(w).Encode(posts)
}

func SearchUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

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
