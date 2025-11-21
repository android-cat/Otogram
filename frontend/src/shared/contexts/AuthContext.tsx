"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@/shared/types'
import { API_BASE_URL } from '@/shared/config'

interface AuthContextValue {
    currentUser: User | null
    isLoading: boolean
    login: (provider: 'spotify' | 'twitter') => void
    logout: () => void
    refreshUser: () => Promise<void>
    needsProfileSetup: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [needsProfileSetup, setNeedsProfileSetup] = useState(false)

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                credentials: 'include',
            })
            if (res.ok) {
                const user = await res.json()
                setCurrentUser(user)
                // Check if user needs to complete profile setup
                setNeedsProfileSetup(!user.display_name || user.display_name.trim() === '')
            } else {
                setCurrentUser(null)
                setNeedsProfileSetup(false)
            }
        } catch (error) {
            console.error('Failed to fetch current user', error)
            setCurrentUser(null)
            setNeedsProfileSetup(false)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // Add a delay to allow cookies to be set after OAuth redirect
        // Check if we're just coming back from OAuth (has referrer from backend)
        const isOAuthReturn = document.referrer.includes('localhost:8080')
        const delay = isOAuthReturn ? 500 : 100
        
        const timer = setTimeout(() => {
            fetchCurrentUser()
        }, delay)
        
        return () => clearTimeout(timer)
    }, [])

    const login = (provider: 'spotify' | 'twitter') => {
        window.location.href = `${API_BASE_URL}/auth/${provider}`
    }

    const logout = async () => {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            })
            setCurrentUser(null)
        } catch (error) {
            console.error('Failed to logout', error)
        }
    }

    const refreshUser = async () => {
        await fetchCurrentUser()
    }

    return (
        <AuthContext.Provider value={{ currentUser, isLoading, login, logout, refreshUser, needsProfileSetup }}>
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
