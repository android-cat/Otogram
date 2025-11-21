package handlers

import (
	"backend/internal/auth"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const (
	MaxUploadSize = 5 * 1024 * 1024 // 5MB
	UploadDir     = "./uploads"
)

func init() {
	// Create uploads directory if it doesn't exist
	if err := os.MkdirAll(UploadDir, 0755); err != nil {
		log.Printf("Failed to create uploads directory: %v", err)
	}
}

func UploadImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check authentication
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

	// Parse multipart form
	if err := r.ParseMultipartForm(MaxUploadSize); err != nil {
		http.Error(w, "File too large or invalid", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Failed to get file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type
	contentType := header.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		http.Error(w, "Only image files are allowed", http.StatusBadRequest)
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	randomBytes := make([]byte, 16)
	rand.Read(randomBytes)
	filename := fmt.Sprintf("%d_%s%s", userID, hex.EncodeToString(randomBytes), ext)
	filepath := filepath.Join(UploadDir, filename)

	// Save file
	dst, err := os.Create(filepath)
	if err != nil {
		log.Printf("Failed to create file: %v", err)
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		log.Printf("Failed to copy file: %v", err)
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Return URL
	baseURL := os.Getenv("BACKEND_URL")
	if baseURL == "" {
		baseURL = "http://127.0.0.1:8080"
	}
	imageURL := fmt.Sprintf("%s/uploads/%s", baseURL, filename)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"url": imageURL,
	})
}
