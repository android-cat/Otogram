import { API_BASE_URL } from './config'

export async function fetchJson<T>(endpoint: string, credentials: RequestCredentials = 'include') {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials,
    })
    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
    }
    return res.json() as Promise<T>
}
