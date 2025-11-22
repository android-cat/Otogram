"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Post } from '@/shared/types';
import { PostCard } from '@/entities/post/ui/PostCard';
import { CreatePostForm } from '@/features/create-post/ui/CreatePostForm';
import { SearchBar } from '@/features/search-post/ui/SearchBar';
import { API_BASE_URL } from '@/shared/config';

export default function Home() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('all');
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [activeSearch, setActiveSearch] = useState(''); // 実際に検索実行されたワード
    const [activeSearchType, setActiveSearchType] = useState('all'); // 実際に検索実行されたタイプ

    const { currentUser } = useAuth();

    const fetchPosts = async (query: string = '', type: string = 'all') => {
        if (query) {
            setIsSearching(true);
        } else {
            setLoading(true);
        }
        
        try {
            const endpoint = query
                ? `${API_BASE_URL}/api/search/posts?q=${encodeURIComponent(query)}&type=${type}`
                : `${API_BASE_URL}/api/posts`;

            const res = await fetch(endpoint, {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setPosts(data || []);
        } catch (error) {
            console.error(error);
            setPosts([]);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveSearch(searchQuery);
        setActiveSearchType(searchType);
        fetchPosts(searchQuery, searchType);
    };

    const handlePostCreated = () => {
        setIsFormOpen(false);
        setActiveSearch('');
        setActiveSearchType('all');
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
                    searchType={searchType}
                    setSearchType={setSearchType}
                    onSearch={handleSearch}
                    isSearching={isSearching}
                />

                <div className="w-full mb-8">
                    {!isFormOpen ? (
                        <button
                            onClick={() => currentUser ? setIsFormOpen(true) : null}
                            disabled={!currentUser}
                            className={`w-full py-3 font-bold rounded-xl transition shadow-lg ${currentUser
                                ? 'bg-gradient-brand text-white hover:opacity-90'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-500'
                                }`}
                        >
                            {currentUser ? '+ Share a Song' : 'Login to Share a Song'}
                        </button>
                    ) : (
                        <CreatePostForm
                            onPostCreated={handlePostCreated}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    )}
                </div>

                {activeSearch && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <p className="text-blue-800 dark:text-blue-200 font-medium">
                                Showing results for <span className="font-bold">"{activeSearch}"</span>
                                {activeSearchType !== 'all' && <span className="text-sm ml-1">(in {activeSearchType})</span>}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSearchType('all');
                                setActiveSearch('');
                                setActiveSearchType('all');
                                fetchPosts();
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                        >
                            Clear search
                        </button>
                    </div>
                )}

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
