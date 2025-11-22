import React, { useState } from 'react';
import Link from 'next/link';
import { Post } from '@/shared/types';
import { useAuth } from '@/shared/contexts/AuthContext';
import { API_BASE_URL, DEFAULT_AVATAR_URL } from '@/shared/config';
import { ReplyModal } from '@/features/reply/ui/ReplyModal';
import { ReplyList } from '@/features/reply/ui/ReplyList';
import SpotifyPlayer from '@/shared/ui/SpotifyPlayer';
import YouTubePlayer from '@/shared/ui/YouTubePlayer';
import AppleMusicPlayer from '@/shared/ui/AppleMusicPlayer';

interface PostCardProps {
    post: Post;
    onTagClick?: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onTagClick }) => {
    const { currentUser } = useAuth();
    const [isLiked, setIsLiked] = useState(post.liked_by_current_user);
    const [likeCount, setLikeCount] = useState(post.like_count);
    const [replyCount, setReplyCount] = useState(post.reply_count);
    const [showReplies, setShowReplies] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [refreshRepliesTrigger, setRefreshRepliesTrigger] = useState(0);

    const handleLike = async () => {
        if (!currentUser) return;

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${post.id}/like`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) {
                // Revert if failed
                setIsLiked(!newIsLiked);
                setLikeCount(prev => !newIsLiked ? prev + 1 : prev - 1);
            }
        } catch (error) {
            console.error('Failed to toggle like', error);
            setIsLiked(!newIsLiked);
            setLikeCount(prev => !newIsLiked ? prev + 1 : prev - 1);
        }
    };

    const handleReplyCreated = () => {
        setReplyCount(prev => prev + 1);
        setRefreshRepliesTrigger(prev => prev + 1);
        setShowReplies(true); // Auto expand replies
    };

    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md">
            <Link href={`/users?user_id=${post.user?.id}`} className="flex items-center mb-4 hover:opacity-80 transition">
                <img 
                    src={post.user?.profile_image || DEFAULT_AVATAR_URL} 
                    alt={post.user?.display_name || 'User'} 
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <div>
                    <p className="font-semibold">{post.user?.display_name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
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
                        <button
                            key={i}
                            onClick={() => onTagClick?.(tag)}
                            className="px-2 py-1 bg-gray-200 dark:bg-zinc-700 rounded-full text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-600 transition cursor-pointer"
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center space-x-6 mt-6 pt-4 border-t border-gray-100 dark:border-zinc-700">
                <button
                    onClick={handleLike}
                    disabled={!currentUser}
                    className={`flex items-center space-x-2 transition ${isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                        } ${!currentUser && 'opacity-50 cursor-not-allowed'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="font-medium">{likeCount}</span>
                </button>

                <button
                    onClick={() => setShowReplies(!showReplies)}
                    className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium">{replyCount}</span>
                </button>

                <button
                    onClick={() => setShowReplyModal(true)}
                    disabled={!currentUser}
                    className={`text-sm font-bold text-gray-500 hover:text-brand-end transition ${!currentUser && 'opacity-50 cursor-not-allowed'}`}
                >
                    Reply
                </button>
            </div>

            {showReplies && (
                <ReplyList postId={post.id} refreshTrigger={refreshRepliesTrigger} />
            )}

            {showReplyModal && (
                <ReplyModal
                    postId={post.id}
                    onClose={() => setShowReplyModal(false)}
                    onReplyCreated={handleReplyCreated}
                />
            )}
        </div>
    );
};
