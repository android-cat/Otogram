import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/shared/config';

interface CreatePostFormProps {
    onPostCreated: () => void;
    onCancel: () => void;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated, onCancel }) => {
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostComment, setNewPostComment] = useState('');
    const [newPostTags, setNewPostTags] = useState('');
    const [newPostUrl, setNewPostUrl] = useState('');
    const [postToTwitter, setPostToTwitter] = useState(false);
    const [twitterConnected, setTwitterConnected] = useState(false);

    const parseUrl = (url: string): { type: 'spotify' | 'youtube' | 'applemusic' | 'other', id: string } => {
        // Spotify - handle URLs like open.spotify.com/intl-ja/track/ID or open.spotify.com/track/ID?si=...
        const spotifyMatch = url.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/);
        if (spotifyMatch) {
            return { type: 'spotify', id: spotifyMatch[1] };
        }

        // Apple Music
        const appleMusicMatch = url.match(/music\.apple\.com(\/.+)/);
        if (appleMusicMatch) {
            return { type: 'applemusic', id: appleMusicMatch[1] };
        }

        // YouTube
        const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (youtubeMatch) {
            return { type: 'youtube', id: youtubeMatch[1] };
        }

        // Other
        return { type: 'other', id: url };
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();

        const tagsArray = newPostTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '').slice(0, 10);
        const { type, id } = parseUrl(newPostUrl);

        const newPost = {
            title: newPostTitle,
            comment: newPostComment,
            tags: tagsArray,
            song_id: id,
            song_type: type,
            post_to_twitter: postToTwitter,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(newPost),
            });

            if (res.ok) {
                onPostCreated();
            } else {
                alert('Failed to create post');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating post');
        }
    };

    return (
        <form onSubmit={handleCreatePost} className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md space-y-4 border border-primary">
            <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-brand">New Post</h2>

            <div>
                <label className="block text-sm font-medium mb-1">Song Title</label>
                <input
                    type="text"
                    required
                    className="w-full p-2 rounded border dark:bg-zinc-700 dark:border-zinc-600"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">URL (Spotify / Apple Music / YouTube / Other)</label>
                <input
                    type="url"
                    required
                    placeholder="https://open.spotify.com/track/..."
                    className="w-full p-2 rounded border dark:bg-zinc-700 dark:border-zinc-600"
                    value={newPostUrl}
                    onChange={(e) => setNewPostUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Spotify, Apple Music or YouTube links will show a player. Others will be a direct link.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Comment</label>
                <textarea
                    required
                    className="w-full p-2 rounded border dark:bg-zinc-700 dark:border-zinc-600"
                    rows={3}
                    value={newPostComment}
                    onChange={(e) => setNewPostComment(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated, max 10)</label>
                <input
                    type="text"
                    placeholder="chill, rock, 2024"
                    className="w-full p-2 rounded border dark:bg-zinc-700 dark:border-zinc-600"
                    value={newPostTags}
                    onChange={(e) => setNewPostTags(e.target.value)}
                />
            </div>

            {twitterConnected && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <input
                        type="checkbox"
                        id="postToTwitter"
                        checked={postToTwitter}
                        onChange={(e) => setPostToTwitter(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="postToTwitter" className="text-sm font-medium cursor-pointer">
                        Post to X (Twitter)
                    </label>
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-brand text-white rounded-lg font-bold hover:opacity-90 transition"
                >
                    Post
                </button>
            </div>
        </form>
    );
};
