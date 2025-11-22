"use client";

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PostCard } from '@/entities/post/ui/PostCard'
import { usePosts } from '@/widgets/feed/hooks/usePosts'
import { useAuth } from '@/shared/contexts/AuthContext'
import { UserProfile } from '@/entities/user/types'
import { API_BASE_URL, DEFAULT_AVATAR_URL } from '@/shared/config'

function UsersFeedContent() {
    const { posts, loading: postsLoading, error, filterByUser } = usePosts()
    const { currentUser, refreshUser } = useAuth()
    const searchParams = useSearchParams()
    const userIdParam = searchParams.get('user_id')
    const userId = userIdParam ? parseInt(userIdParam) : currentUser?.id || 1
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        display_name: '',
        profile_image: '',
        bio: ''
    })
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        filterByUser(userId)
        
        // ユーザープロフィール情報を取得
        if (currentUser && userId === currentUser.id) {
            setUserProfile(currentUser)
            setEditForm({
                display_name: currentUser.display_name || '',
                profile_image: currentUser.profile_image || '',
                bio: currentUser.bio || ''
            })
        } else {
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('画像ファイルのみアップロード可能です')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('ファイルサイズは5MB以下にしてください')
            return
        }

        setUploading(true)

        const formData = new FormData()
        formData.append('image', file)

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            })

            if (!response.ok) throw new Error('Failed to upload image')

            const data = await response.json()
            setEditForm(prev => ({ ...prev, profile_image: data.url }))
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('画像のアップロードに失敗しました')
        } finally {
            setUploading(false)
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editForm.display_name.trim()) {
            alert('Display name is required')
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editForm)
            })

            if (!response.ok) throw new Error('Failed to update profile')

            await refreshUser()
            setIsEditing(false)
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        if (currentUser) {
            setEditForm({
                display_name: currentUser.display_name || '',
                profile_image: currentUser.profile_image || '',
                bio: currentUser.bio || ''
            })
        }
    }

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
                                <img
                                    src={isEditing ? (editForm.profile_image || DEFAULT_AVATAR_URL) : (displayUser.profile_image || DEFAULT_AVATAR_URL)}
                                    alt={isEditing ? "Preview" : displayUser.display_name}
                                    className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-800 shadow-lg object-cover"
                                />
                                
                                {isOwnProfile && !isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="ml-auto mb-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                            
                            {isEditing ? (
                                <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Display Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.display_name}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                                            required
                                            maxLength={50}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Profile Image</label>
                                        <div className="space-y-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 disabled:opacity-50"
                                            />
                                            {uploading && (
                                                <p className="text-sm text-primary">アップロード中...</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Bio
                                            <span className="text-gray-500 text-xs ml-2">
                                                {editForm.bio.length}/200
                                            </span>
                                        </label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                            placeholder="Tell us about yourself..."
                                            rows={3}
                                            maxLength={200}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                        />
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            disabled={saving}
                                            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50 font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <h1 className="text-3xl font-bold">{displayUser.display_name}</h1>
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
                            )}
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
