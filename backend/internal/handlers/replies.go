package handlers

import (
	"backend/internal/database"
	"backend/internal/models"
	"backend/internal/utils"
	"encoding/json"
	"net/http"
)

func CreateReply(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := utils.GetCurrentUserID(r)
	if !ok {
		http.Error(w, "Not authenticated", http.StatusUnauthorized)
		return
	}

	postID, err := utils.ExtractIDFromPath(r.URL.Path, 3)
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

	postID, err := utils.ExtractIDFromPath(r.URL.Path, 3)
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
