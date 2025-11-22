CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    oauth_id VARCHAR(255) NOT NULL,
    oauth_provider VARCHAR(50) NOT NULL DEFAULT 'spotify',
    display_name VARCHAR(255),
    profile_image TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(oauth_id, oauth_provider)
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    song_id TEXT NOT NULL,
    song_type VARCHAR(50) NOT NULL CHECK (song_type IN ('spotify', 'youtube', 'applemusic', 'other')),
    comment TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider)
);

CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS replies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, oauth_id, oauth_provider, display_name, profile_image, bio) 
VALUES (1, 'demo_user', 'demo', 'Demo User', 'https://via.placeholder.com/150', '音楽が大好きです！')
ON CONFLICT (oauth_id, oauth_provider) DO NOTHING;

-- Reset the sequence to start from 2
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
