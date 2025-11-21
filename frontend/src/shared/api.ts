const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export async function fetchJson<T>(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`)
    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
    }
    return res.json() as Promise<T>
}
