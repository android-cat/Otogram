"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Post } from '@/shared/types';
import { PostCard } from '@/entities/post/ui/PostCard';
import { CreatePostForm } from '@/features/create-post/ui/CreatePostForm';
import { SearchBar } from '@/features/search-post/ui/SearchBar';

export default function Home() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchPosts = async (query: string = '') => {
        setLoading(true);
        try {
            const endpoint = query
                ? `http://localhost:8080/api/search/posts?q=${encodeURIComponent(query)}`
                : 'http://localhost:8080/api/posts';

            const res = await fetch(endpoint);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setPosts(data || []);
        } catch (error) {
            console.error(error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPosts(searchQuery);
    };

    const handlePostCreated = () => {
        setIsFormOpen(false);
        fetchPosts();
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-8 pt-24">
            <div className="w-full max-w-2xl space-y-8">
                <div className="flex justify-end">
                    <Link href="/users" className="text-sm text-primary hover:underline">
                        Browse by user →
                    </Link>
                </div>

                <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onSearch={handleSearch}
                />

                <div className="w-full mb-8">
                    {!isFormOpen ? (
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="w-full py-3 bg-gradient-brand text-white font-bold rounded-xl transition shadow-lg hover:opacity-90"
                        >
                            + Share a Song
                        </button>
                    ) : (
                        <CreatePostForm
                            onPostCreated={handlePostCreated}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    )}
                </div>

                {loading ? (
                    <p className="text-center text-gray-500">Loading...</p>
                ) : posts.length === 0 ? (
                    <p className="text-center text-gray-500">No posts found.</p>
                ) : (
                    posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))
                )}
            </div>
        </main>
    );
}
