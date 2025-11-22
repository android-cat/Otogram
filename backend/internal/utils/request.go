package utils

import (
	"backend/internal/auth"
	"net/http"
	"strconv"
	"strings"
)

// GetCurrentUserID retrieves the current user ID from session
func GetCurrentUserID(r *http.Request) (int, bool) {
	session, err := auth.Store.Get(r, auth.GetSessionCookieName())
	if err != nil {
		return 0, false
	}
	
	if id, ok := session.Values["user_id"].(int); ok {
		return id, true
	}
	
	return 0, false
}

// ExtractIDFromPath extracts the numeric ID from a URL path
// Example: /api/posts/123/like -> 123
func ExtractIDFromPath(path string, position int) (int, error) {
	parts := strings.Split(path, "/")
	if len(parts) <= position {
		return 0, strconv.ErrSyntax
	}
	return strconv.Atoi(parts[position])
}
