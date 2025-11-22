import React from 'react'
import { UserSummary } from '../types'
import { DEFAULT_AVATAR_URL } from '@/shared/config'

interface UserFilterProps {
    users: UserSummary[]
    activeUserId?: number | null
    onSelectUser: (userId: number | null) => void
    loading?: boolean
}

export const UserFilter: React.FC<UserFilterProps> = ({ users, activeUserId, onSelectUser, loading }) => {
    return (
        <div className="bg-white/70 dark:bg-zinc-800/70 backdrop-blur-md p-4 rounded-2xl shadow-inner border border-white/30 dark:border-zinc-700 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-200">Users</span>
                {loading && <span className="text-xs text-gray-400">Loading…</span>}
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    className={`px-3 py-1 rounded-full text-sm transition ${
                        activeUserId == null
                            ? 'bg-gradient-brand text-white'
                            : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-200'
                    }`}
                    onClick={() => onSelectUser(null)}
                >
                    All
                </button>
                {users.map((user) => (
                    <button
                        key={user.id}
                        className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 transition ${
                            activeUserId === user.id
                                ? 'bg-gradient-brand text-white'
                                : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-200'
                        }`}
                        onClick={() => onSelectUser(user.id)}
                    >
                        <img 
                            src={user.profile_image || DEFAULT_AVATAR_URL} 
                            alt={user.display_name} 
                            className="w-5 h-5 rounded-full object-cover" 
                        />
                        <span>{user.display_name}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
