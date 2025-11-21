package auth

import (
	"context"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/spotify"
)

func GetSpotifyOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("SPOTIFY_CLIENT_ID"),
		ClientSecret: os.Getenv("SPOTIFY_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("SPOTIFY_REDIRECT_URI"),
		Scopes:       []string{"user-read-private", "user-read-email"},
		Endpoint:     spotify.Endpoint,
	}
}

func GetTwitterOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("TWITTER_CLIENT_ID"),
		ClientSecret: os.Getenv("TWITTER_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("TWITTER_REDIRECT_URI"),
		Scopes:       []string{"tweet.read", "users.read"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://twitter.com/i/oauth2/authorize",
			TokenURL: "https://api.twitter.com/2/oauth2/token",
		},
	}
}

var oauthStateString = generateRandomSecret(16)

func ExchangeCodeForToken(config *oauth2.Config, code string) (*oauth2.Token, error) {
	return config.Exchange(context.Background(), code)
}
