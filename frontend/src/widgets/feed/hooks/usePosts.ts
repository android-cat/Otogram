import { useCallback, useState } from 'react'
import { Post } from '@/shared/types'
import { fetchJson } from '@/shared/api'

interface FetchOptions {
    endpoint: string
}

const defaultEndpoint = '/api/posts'

export const usePosts = () => {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [endpoint, setEndpoint] = useState<string>(defaultEndpoint)

    const loadPosts = useCallback(async (endpointToUse: string) => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchJson<Post[]>(endpointToUse)
            setPosts(data || [])
            setEndpoint(endpointToUse)
        } catch (err) {
            console.error(err)
            setError('Failed to load posts')
            setPosts([])
        } finally {
            setLoading(false)
        }
    }, [])

    const filterByUser = useCallback((userId: number) => {
        loadPosts(`${defaultEndpoint}?user_id=${userId}`)
    }, [loadPosts])

    const showAll = useCallback(() => {
        loadPosts(defaultEndpoint)
    }, [loadPosts])

    const refresh = useCallback(() => {
        loadPosts(endpoint)
    }, [loadPosts, endpoint])

    return {
        posts,
        loading,
        error,
        refresh,
        filterByUser,
        showAll,
    }
}
