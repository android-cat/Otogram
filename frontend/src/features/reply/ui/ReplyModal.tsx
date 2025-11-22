import React, { useState } from 'react';
import { API_BASE_URL } from '@/shared/config';

interface ReplyModalProps {
    postId: number;
    onClose: () => void;
    onReplyCreated: () => void;
}

export const ReplyModal: React.FC<ReplyModalProps> = ({ postId, onClose, onReplyCreated }) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ content }),
            });

            if (res.ok) {
                onReplyCreated();
                onClose();
            } else {
                alert('Failed to post reply');
            }
        } catch (error) {
            console.error(error);
            alert('Error posting reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl w-full max-w-md p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Reply to Post</h3>
                <form onSubmit={handleSubmit}>
                    <textarea
                        className="w-full p-3 rounded-lg border dark:bg-zinc-700 dark:border-zinc-600 dark:text-white mb-4 focus:ring-2 focus:ring-brand-start outline-none resize-none"
                        rows={4}
                        placeholder="Write your reply..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !content.trim()}
                            className="px-4 py-2 bg-gradient-brand text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                        >
                            {isSubmitting ? 'Posting...' : 'Reply'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
