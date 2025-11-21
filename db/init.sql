CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    spotify_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    song_id TEXT NOT NULL, -- Changed to TEXT to support long URLs
    song_type VARCHAR(50) NOT NULL CHECK (song_type IN ('spotify', 'youtube', 'other')), -- Added 'other'
    comment TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, spotify_id, display_name, profile_image) 
VALUES (1, 'demo_user', 'Demo User', '')
ON CONFLICT (id) DO NOTHING;
