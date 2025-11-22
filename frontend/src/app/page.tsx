"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/shared/contexts/AuthContext';
import { PostCard } from '@/entities/post/ui/PostCard';
import { CreatePostForm } from '@/features/create-post/ui/CreatePostForm';
import { SearchBar } from '@/features/search-post/ui/SearchBar';
import { SearchResultBanner } from '@/features/search-post/ui/SearchResultBanner';
import { useSearch } from '@/features/search-post/hooks/useSearch';

export default function Home() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { currentUser } = useAuth();
    const {
        posts,
        loading,
        isSearching,
        searchQuery,
        searchType,
        activeSearch,
        activeSearchType,
        setSearchQuery,
        setSearchType,
        handleSearch,
        clearSearch,
        searchByTag,
        refreshPosts,
    } = useSearch();

    useEffect(() => {
        refreshPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePostCreated = () => {
        setIsFormOpen(false);
        refreshPosts();
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
                    <SearchResultBanner
                        searchQuery={activeSearch}
                        searchType={activeSearchType}
                        onClear={clearSearch}
                    />
                )}

                {loading ? (
                    <p className="text-center text-gray-500">Loading...</p>
                ) : posts.length === 0 ? (
                    <p className="text-center text-gray-500">No posts found.</p>
                ) : (
                    posts.map((post) => (
                        <PostCard key={post.id} post={post} onTagClick={searchByTag} />
                    ))
                )}
            </div>
        </main>
    );
}
