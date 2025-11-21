import { fetchJson } from '@/shared/api'
import { UserSummary } from '../types'

export async function fetchUsers(query?: string) {
    const endpoint = query
        ? `/api/search/users?q=${encodeURIComponent(query)}`
        : '/api/search/users'
    return fetchJson<UserSummary[]>(endpoint)
}
