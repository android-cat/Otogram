export interface User {
    id: number;
    display_name: string;
    profile_image: string;
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
}
