package models

import (
	"time"

	"github.com/lib/pq"
)

type User struct {
	ID            int       `json:"id"`
	OAuthID       string    `json:"oauth_id"`
	OAuthProvider string    `json:"oauth_provider"`
	DisplayName   string    `json:"display_name"`
	ProfileImage  string    `json:"profile_image"`
	Bio           string    `json:"bio"`
	CreatedAt     time.Time `json:"created_at"`
}

type Post struct {
	ID                 int            `json:"id"`
	UserID             int            `json:"user_id"`
	Title              string         `json:"title"`
	SongID             string         `json:"song_id"`   // Stores ID for spotify/youtube, or full URL for other
	SongType           string         `json:"song_type"` // 'spotify', 'youtube', 'applemusic', or 'other'
	Comment            string         `json:"comment"`
	Tags               pq.StringArray `json:"tags"`
	CreatedAt          time.Time      `json:"created_at"`
	User               *User          `json:"user,omitempty"`
	LikeCount          int            `json:"like_count"`
	ReplyCount         int            `json:"reply_count"`
	LikedByCurrentUser bool           `json:"liked_by_current_user"`
}

type Reply struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	PostID    int       `json:"post_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	User      *User     `json:"user,omitempty"`
}
