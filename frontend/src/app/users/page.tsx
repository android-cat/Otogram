"use client";

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PostCard } from '@/entities/post/ui/PostCard'
import { usePosts } from '@/widgets/feed/hooks/usePosts'
import { useAuth } from '@/shared/contexts/AuthContext'
import { UserProfile } from '@/entities/user/types'

function UsersFeedContent() {
    const { posts, loading: postsLoading, error, filterByUser } = usePosts()
    const { currentUser } = useAuth()
    const searchParams = useSearchParams()
    const userIdParam = searchParams.get('user_id')
    const userId = userIdParam ? parseInt(userIdParam) : currentUser?.id || 1
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

    useEffect(() => {
        filterByUser(userId)
        
        // ユーザープロフィール情報を取得（デモ用に簡易実装）
        if (currentUser && userId === currentUser.id) {
            setUserProfile({
                ...currentUser,
                bio: '音楽が大好きです！みなさんのおすすめも教えてください 🎵',
            })
        } else {
            // 他のユーザーの場合は投稿から情報を取得
            setUserProfile(null)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, currentUser])

    // 投稿からユーザー情報を抽出
    const displayUser = userProfile || (posts.length > 0 ? {
        id: posts[0].user?.id || userId,
        display_name: posts[0].user?.display_name || 'Unknown User',
        profile_image: posts[0].user?.profile_image || '',
        bio: undefined,
    } : null)

    const isOwnProfile = currentUser?.id === userId

    return (
        <main className="flex min-h-screen flex-col items-center p-8 pt-24">
            <div className="w-full max-w-3xl space-y-6">
                {/* Back Navigation */}
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-sm text-primary hover:underline flex items-center gap-1">
                        ← Back to Feed
                    </Link>
                </div>

                {/* User Profile Header */}
                {displayUser && (
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg overflow-hidden">
                        {/* Cover/Banner */}
                        <div className="h-32 bg-gradient-brand"></div>
                        
                        {/* Profile Info */}
                        <div className="px-6 pb-6">
                            <div className="flex items-end gap-4 -mt-16 mb-4">
                                {displayUser.profile_image ? (
                                    <img
                                        src={displayUser.profile_image}
                                        alt={displayUser.display_name}
                                        className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-800 shadow-lg"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-800 bg-gray-300 dark:bg-zinc-600 shadow-lg"></div>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <h1 className="text-3xl font-bold">{displayUser.display_name}</h1>
                                    {isOwnProfile && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">@you</p>
                                    )}
                                </div>
                                
                                {displayUser.bio && (
                                    <p className="text-gray-700 dark:text-gray-300">{displayUser.bio}</p>
                                )}
                                
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{posts.length}</span> Posts
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Posts Section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold px-2">Posts</h2>
                    {error && <p className="text-red-500 text-sm px-2">{error}</p>}
                    {postsLoading && posts.length === 0 ? (
                        <p className="text-gray-500 px-2">Loading posts...</p>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg">No posts yet</p>
                            {isOwnProfile && (
                                <p className="text-sm mt-2">Start sharing your favorite music!</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}

export default function UsersFeedPage() {
    return (
        <Suspense fallback={
            <main className="flex min-h-screen flex-col items-center justify-center p-8">
                <p className="text-gray-500">Loading...</p>
            </main>
        }>
            <UsersFeedContent />
        </Suspense>
    )
}
