"use client"

import { useAuth } from '@/shared/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
    const { login } = useAuth()
    const router = useRouter()
    const [displayName, setDisplayName] = useState('')

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (displayName.trim()) {
            login({
                id: 1,
                display_name: displayName,
                profile_image: 'https://via.placeholder.com/150'
            })
            router.push('/')
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
            <div className="w-full max-w-md bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-brand text-center">
                    ログイン
                </h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">表示名</label>
                        <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="あなたの名前を入力"
                            className="w-full p-3 rounded-lg border dark:bg-zinc-700 dark:border-zinc-600"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-brand text-white font-bold rounded-lg hover:opacity-90 transition"
                    >
                        ログイン
                    </button>
                </form>
            </div>
        </main>
    )
}
