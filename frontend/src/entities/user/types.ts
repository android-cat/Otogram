export interface UserSummary {
    id: number
    display_name: string
    profile_image: string
}

export interface UserProfile extends UserSummary {
    bio?: string
    created_at?: string
}
