package database

const (
	// PostSelectFields defines the standard fields to select for posts
	PostSelectFields = `
		p.id, p.user_id, p.title, p.song_id, p.song_type, p.comment, p.tags, p.created_at,
		u.id, u.display_name, u.profile_image, u.bio,
		COALESCE((SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id), 0) as like_count,
		COALESCE((SELECT COUNT(*) FROM replies r WHERE r.post_id = p.id), 0) as reply_count,
		CASE WHEN $1 > 0 THEN COALESCE((SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1)), false) ELSE false END as liked_by_current_user
	`

	// PostFromClause defines the standard FROM and JOIN clauses for posts
	PostFromClause = `
		FROM posts p
		LEFT JOIN users u ON p.user_id = u.id
	`

	// PostOrderBy defines the standard ORDER BY clause for posts
	PostOrderBy = `ORDER BY p.created_at DESC`
)

// BuildPostQuery constructs a complete post query with optional WHERE clause
func BuildPostQuery(whereClause string) string {
	query := "SELECT " + PostSelectFields + " " + PostFromClause
	if whereClause != "" {
		query += " WHERE " + whereClause
	}
	query += " " + PostOrderBy
	return query
}
