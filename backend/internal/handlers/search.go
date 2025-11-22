package handlers

import (
	"backend/internal/auth"
	"backend/internal/database"
	"backend/internal/models"
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

	// Get current user ID if logged in
	var currentUserID int
	var isLoggedIn bool
	session, err := auth.Store.Get(r, auth.GetSessionCookieName())
	if err == nil {
		if id, ok := session.Values["user_id"].(int); ok {
			currentUserID = id
			isLoggedIn = true
		}
	}

	searchType := r.URL.Query().Get("type") // all, title, comment, tag

	var sqlQuery string
	
	switch searchType {
	case "title":
		sqlQuery = `
			SELECT p.id, p.user_id, p.title, p.song_id, p.song_type, p.comment, p.tags, p.created_at,
			       u.id, u.display_name, u.profile_image, u.bio,
			       COALESCE((SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id), 0) as like_count,
			       COALESCE((SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id), 0) as reply_count,
			       CASE WHEN $1 > 0 THEN COALESCE((SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1)), false) ELSE false END as liked_by_current_user
			FROM posts p
			LEFT JOIN users u ON p.user_id = u.id
			WHERE p.title ILIKE '%' || $2 || '%'
			ORDER BY p.created_at DESC
		`
	case "comment":
		sqlQuery = `
			SELECT p.id, p.user_id, p.title, p.song_id, p.song_type, p.comment, p.tags, p.created_at,
			       u.id, u.display_name, u.profile_image, u.bio,
			       COALESCE((SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id), 0) as like_count,
			       COALESCE((SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id), 0) as reply_count,
			       CASE WHEN $1 > 0 THEN COALESCE((SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1)), false) ELSE false END as liked_by_current_user
			FROM posts p
			LEFT JOIN users u ON p.user_id = u.id
			WHERE p.comment ILIKE '%' || $2 || '%'
			ORDER BY p.created_at DESC
		`
	case "tag":
		sqlQuery = `
			SELECT p.id, p.user_id, p.title, p.song_id, p.song_type, p.comment, p.tags, p.created_at,
			       u.id, u.display_name, u.profile_image, u.bio,
			       COALESCE((SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id), 0) as like_count,
			       COALESCE((SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id), 0) as reply_count,
			       CASE WHEN $1 > 0 THEN COALESCE((SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1)), false) ELSE false END as liked_by_current_user
			FROM posts p
			LEFT JOIN users u ON p.user_id = u.id
			WHERE $2 = ANY(p.tags)
			ORDER BY p.created_at DESC
		`
	default: // "all" or empty
		sqlQuery = `
			SELECT p.id, p.user_id, p.title, p.song_id, p.song_type, p.comment, p.tags, p.created_at,
			       u.id, u.display_name, u.profile_image, u.bio,
			       COALESCE((SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id), 0) as like_count,
			       COALESCE((SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id), 0) as reply_count,
			       CASE WHEN $1 > 0 THEN COALESCE((SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1)), false) ELSE false END as liked_by_current_user
			FROM posts p
			LEFT JOIN users u ON p.user_id = u.id
			WHERE p.comment ILIKE '%' || $2 || '%' 
			   OR p.title ILIKE '%' || $2 || '%'
			   OR $2 = ANY(p.tags)
			ORDER BY p.created_at DESC
		`
	}

	var rows *sql.Rows
	if isLoggedIn {
		rows, err = database.DB.Query(sqlQuery, currentUserID, query)
	} else {
		rows, err = database.DB.Query(sqlQuery, 0, query)
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
		err := rows.Scan(&p.ID, &p.UserID, &p.Title, &p.SongID, &p.SongType, &p.Comment, &p.Tags, &p.CreatedAt, 
			&u.ID, &u.DisplayName, &u.ProfileImage, &u.Bio,
			&p.LikeCount, &p.ReplyCount, &p.LikedByCurrentUser)
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
