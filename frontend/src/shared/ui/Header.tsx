"use client"

import Link from 'next/link'
import { useAuth } from '@/shared/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DEFAULT_AVATAR_URL } from '@/shared/config'

export const Header = () => {
    const { currentUser, isLoading, logout } = useAuth()
    const router = useRouter()
    const [showMenu, setShowMenu] = useState(false)

    const handleLogout = () => {
        logout()
        setShowMenu(false)
        router.push('/')
    }

    return (
        <header className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-brand">
                    Otogram
                </Link>
                <nav className="flex items-center gap-4">
                    {isLoading ? (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse"></div>
                    ) : currentUser ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="flex items-center gap-2 hover:opacity-80 transition"
                            >
                                <img
                                    src={currentUser.profile_image || DEFAULT_AVATAR_URL}
                                    alt={currentUser.display_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                                <span className="text-sm font-medium">{currentUser.display_name}</span>
                            </button>
                            
                            {showMenu && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 py-1 z-20">
                                        <Link
                                            href="/users"
                                            onClick={() => setShowMenu(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                        >
                                            マイページ
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                        >
                                            ログアウト
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="text-sm text-primary hover:underline font-medium">
                            ログイン
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    )
}
