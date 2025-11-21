import React from 'react';
import Link from 'next/link';
import { Post } from '@/shared/types';
import SpotifyPlayer from '@/shared/ui/SpotifyPlayer';
import YouTubePlayer from '@/shared/ui/YouTubePlayer';
import AppleMusicPlayer from '@/shared/ui/AppleMusicPlayer';

interface PostCardProps {
    post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md">
            <Link href={`/users?user_id=${post.user?.id || 1}`} className="flex items-center mb-4 hover:opacity-80 transition cursor-pointer">
                {post.user?.profile_image ? (
                    <img src={post.user.profile_image} alt={post.user.display_name} className="w-10 h-10 rounded-full mr-3" />
                ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                )}
                <div>
                    <p className="font-semibold">{post.user?.display_name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                </div>
            </Link>

            {post.title && <h3 className="text-xl font-bold mb-2">{post.title}</h3>}

            <p className="mb-4 text-lg">{post.comment}</p>

            {post.song_type === 'spotify' ? (
                <SpotifyPlayer trackId={post.song_id} />
            ) : post.song_type === 'youtube' ? (
                <YouTubePlayer videoId={post.song_id} />
            ) : post.song_type === 'applemusic' ? (
                <AppleMusicPlayer songPath={post.song_id} />
            ) : (
                <a
                    href={post.song_id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg text-blue-500 hover:underline break-all"
                >
                    {post.song_id}
                    <span className="ml-2 text-xs text-gray-500">↗ Opens in new tab</span>
                </a>
            )}

            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-200 dark:bg-zinc-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
