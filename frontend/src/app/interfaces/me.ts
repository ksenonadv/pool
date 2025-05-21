/**
 * Interface representing the current user's profile data.
 * 
 * This is the data returned by the /user/me API endpoint and
 * represents the minimal user information needed across the application.
 */
export type Me = {
    /**
     * Unique identifier for the user (UUID format)
     */
    userId: string;
    
    /**
     * User's display name
     */
    username: string;
    
    /**
     * URL to the user's avatar image
     */
    avatar: string;
    
    /**
     * Discord ID for users who authenticated via OAuth
     * Will be undefined for standard username/password accounts
     */
    discordId?: string;
}