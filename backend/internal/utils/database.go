package utils

import (
	"backend/internal/models"
	"database/sql"
	"log"
)

// ScanPostRows extracts post data from SQL rows
func ScanPostRows(rows *sql.Rows) []models.Post {
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
	return posts
}
