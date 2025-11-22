export interface User {
    id: number;
    display_name: string;
    profile_image: string;
    bio?: string;
}

export interface Post {
    id: number;
    title: string;
    song_id: string;
    song_type: 'spotify' | 'youtube' | 'applemusic' | 'other';
    comment: string;
    tags: string[];
    created_at: string;
    user?: User;
    like_count: number;
    reply_count: number;
    liked_by_current_user: boolean;
}

export interface Reply {
    id: number;
    user_id: number;
    post_id: number;
    content: string;
    created_at: string;
    user?: User;
}
