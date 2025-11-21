"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/shared/types'

interface AuthContextValue {
    currentUser: User | null
    isLoading: boolean
    login: (user: User) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // デモ用: ローカルストレージからユーザー情報を取得
        const storedUser = localStorage.getItem('demo_user')
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser))
            } catch (e) {
                console.error('Failed to parse stored user', e)
            }
        } else {
            // デモ用のデフォルトユーザー（ID=1）を設定
            const demoUser: User = {
                id: 1,
                display_name: 'Demo User',
                profile_image: 'https://via.placeholder.com/150'
            }
            setCurrentUser(demoUser)
            localStorage.setItem('demo_user', JSON.stringify(demoUser))
        }
        setIsLoading(false)
    }, [])

    const login = (user: User) => {
        setCurrentUser(user)
        localStorage.setItem('demo_user', JSON.stringify(user))
    }

    const logout = () => {
        setCurrentUser(null)
        localStorage.removeItem('demo_user')
    }

    return (
        <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
