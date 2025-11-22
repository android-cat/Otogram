package handlers

import (
	"backend/internal/database"
	"backend/internal/utils"
	"encoding/json"
	"net/http"
)

func ToggleLike(w http.ResponseWriter, r *http.Request) {
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
