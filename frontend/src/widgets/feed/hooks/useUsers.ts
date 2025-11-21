import { useEffect, useState } from 'react'
import { UserSummary } from '@/entities/user/types'
import { fetchUsers } from '@/entities/user/api/users'

export const useUsers = () => {
    const [users, setUsers] = useState<UserSummary[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadUsers = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await fetchUsers()
                setUsers(data)
            } catch (err) {
                console.error(err)
                setError('Failed to load users')
                setUsers([])
            } finally {
                setLoading(false)
            }
        }

        loadUsers()
    }, [])

    return { users, loading, error }
}
