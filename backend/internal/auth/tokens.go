package auth

import (
	"backend/internal/database"
	"time"
)

type OAuthToken struct {
	ID           int
	UserID       int
	Provider     string
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
}

// SaveOAuthToken saves or updates OAuth token for a user
func SaveOAuthToken(userID int, provider, accessToken, refreshToken string, expiresAt time.Time) error {
	_, err := database.DB.Exec(`
		INSERT INTO oauth_tokens (user_id, provider, access_token, refresh_token, expires_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id, provider)
		DO UPDATE SET 
			access_token = EXCLUDED.access_token,
			refresh_token = EXCLUDED.refresh_token,
			expires_at = EXCLUDED.expires_at,
			updated_at = CURRENT_TIMESTAMP
	`, userID, provider, accessToken, refreshToken, expiresAt)
	return err
}

// GetOAuthToken retrieves OAuth token for a user
func GetOAuthToken(userID int, provider string) (*OAuthToken, error) {
	token := &OAuthToken{}
	err := database.DB.QueryRow(`
		SELECT id, user_id, provider, access_token, refresh_token, expires_at
		FROM oauth_tokens
		WHERE user_id = $1 AND provider = $2
	`, userID, provider).Scan(
		&token.ID,
		&token.UserID,
		&token.Provider,
		&token.AccessToken,
		&token.RefreshToken,
		&token.ExpiresAt,
	)
	if err != nil {
		return nil, err
	}
	return token, nil
}

// DeleteOAuthToken removes OAuth token for a user
func DeleteOAuthToken(userID int, provider string) error {
	_, err := database.DB.Exec(`
		DELETE FROM oauth_tokens
		WHERE user_id = $1 AND provider = $2
	`, userID, provider)
	return err
}
