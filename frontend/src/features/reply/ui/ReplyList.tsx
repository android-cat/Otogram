import React, { useEffect, useState } from 'react';
import { Reply } from '@/shared/types';
import { API_BASE_URL, DEFAULT_AVATAR_URL } from '@/shared/config';

interface ReplyListProps {
    postId: number;
    refreshTrigger: number; // Used to trigger refresh when a new reply is added
}

export const ReplyList: React.FC<ReplyListProps> = ({ postId, refreshTrigger }) => {
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReplies = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/replies`);
                if (res.ok) {
                    const data = await res.json();
                    setReplies(data || []);
                }
            } catch (error) {
                console.error('Failed to fetch replies', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReplies();
    }, [postId, refreshTrigger]);

    if (loading) {
        return <div className="text-center py-4 text-sm text-gray-500">Loading replies...</div>;
    }

    if (replies.length === 0) {
        return <div className="text-center py-4 text-sm text-gray-500">No replies yet.</div>;
    }

    return (
        <div className="space-y-3 mt-4 border-t border-gray-100 dark:border-zinc-700 pt-4">
            {replies.map((reply) => (
                <div key={reply.id} className="flex space-x-3">
                    <img
                        src={reply.user?.profile_image || DEFAULT_AVATAR_URL}
                        alt={reply.user?.display_name}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 bg-gray-50 dark:bg-zinc-700/50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm dark:text-white">{reply.user?.display_name}</span>
                            <span className="text-xs text-gray-500">
                                {new Date(reply.created_at).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.content}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
