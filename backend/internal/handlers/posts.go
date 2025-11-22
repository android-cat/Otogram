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
	"strings"
)

func GetPosts(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

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

	baseQuery := `
		SELECT p.id, p.user_id, p.title, p.song_id, p.song_type, p.comment, p.tags, p.created_at,
		       u.id, u.display_name, u.profile_image, u.bio,
		       COALESCE((SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id), 0) as like_count,
		       COALESCE((SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id), 0) as reply_count,
		       CASE WHEN $1 > 0 THEN COALESCE((SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1)), false) ELSE false END as liked_by_current_user
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
	`

	var rows *sql.Rows

	userIDParam := r.URL.Query().Get("user_id")
	if userIDParam != "" {
		userID, convErr := strconv.Atoi(userIDParam)
		if convErr != nil {
			http.Error(w, "invalid user_id", http.StatusBadRequest)
			return
		}

		if isLoggedIn {
			rows, err = database.DB.Query(baseQuery+" WHERE p.user_id = $2 ORDER BY p.created_at DESC", currentUserID, userID)
		} else {
			rows, err = database.DB.Query(baseQuery+" WHERE p.user_id = $2 ORDER BY p.created_at DESC", 0, userID)
		}
	} else {
		if isLoggedIn {
			rows, err = database.DB.Query(baseQuery+" ORDER BY p.created_at DESC", currentUserID)
		} else {
			rows, err = database.DB.Query(baseQuery+" ORDER BY p.created_at DESC", 0)
		}
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

func ToggleLike(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Get user from session
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

	// Parse ID from URL path manually for Go 1.21 compatibility
	// Expected path: /api/posts/{id}/like
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	postID, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	// Check if already liked
	var exists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2)", userID, postID).Scan(&exists)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if exists {
		_, err = database.DB.Exec("DELETE FROM likes WHERE user_id = $1 AND post_id = $2", userID, postID)
	} else {
		_, err = database.DB.Exec("INSERT INTO likes (user_id, post_id) VALUES ($1, $2)", userID, postID)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"liked": !exists})
}

func CreateReply(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	session, err := auth.Store.Get(r, auth.GetSessionCookieName())
	if err != nil || session.Values["user_id"] == nil {
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}
	userID := session.Values["user_id"].(int)

	// Expected path: /api/posts/{id}/reply
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	postID, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Content == "" {
		http.Error(w, "Content is required", http.StatusBadRequest)
		return
	}

	var reply models.Reply
	err = database.DB.QueryRow(`
		INSERT INTO replies (user_id, post_id, content)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`, userID, postID, req.Content).Scan(&reply.ID, &reply.CreatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	reply.UserID = userID
	reply.PostID = postID
	reply.Content = req.Content
	
	// Fetch user details for the response
	var user models.User
	err = database.DB.QueryRow("SELECT id, display_name, profile_image FROM users WHERE id = $1", userID).Scan(&user.ID, &user.DisplayName, &user.ProfileImage)
	if err == nil {
		reply.User = &user
	}

	json.NewEncoder(w).Encode(reply)
}

func GetReplies(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Expected path: /api/posts/{id}/replies
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	postID, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	rows, err := database.DB.Query(`
		SELECT r.id, r.user_id, r.post_id, r.content, r.created_at,
		       u.id, u.display_name, u.profile_image
		FROM replies r
		JOIN users u ON r.user_id = u.id
		WHERE r.post_id = $1
		ORDER BY r.created_at ASC
	`, postID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var replies []models.Reply
	for rows.Next() {
		var r models.Reply
		var u models.User
		if err := rows.Scan(&r.ID, &r.UserID, &r.PostID, &r.Content, &r.CreatedAt, &u.ID, &u.DisplayName, &u.ProfileImage); err != nil {
			continue
		}
		r.User = &u
		replies = append(replies, r)
	}

	json.NewEncoder(w).Encode(replies)
}

