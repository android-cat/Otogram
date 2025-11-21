package auth

import (
	"crypto/rand"
	"encoding/base64"
	"os"

	"github.com/gorilla/sessions"
)

var Store *sessions.CookieStore

func InitSessionStore() {
	secret := os.Getenv("SESSION_SECRET")
	if secret == "" {
		// Generate a random secret if not provided
		secret = generateRandomSecret(32)
	}
	Store = sessions.NewCookieStore([]byte(secret))
	Store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // 7 days
		HttpOnly: false,         // Set to false to allow JavaScript access for debugging
		Secure:   false,         // Set to true in production with HTTPS
		SameSite: 2,             // SameSite=Lax (2) - allows cookies on redirects
		Domain:   "",            // Empty - use default (request host)
	}
}

func generateRandomSecret(length int) string {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		panic("Failed to generate random secret")
	}
	return base64.URLEncoding.EncodeToString(bytes)
}

func GetSessionCookieName() string {
	name := os.Getenv("SESSION_COOKIE_NAME")
	if name == "" {
		return "otogram_session"
	}
	return name
}
