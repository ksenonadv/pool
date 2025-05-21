import { IsNotEmpty, MinLength } from 'class-validator';

/**
 * Data Transfer Object for updating a user's avatar.
 */
export class ChangeAvatarDto {
    /**
     * The new avatar image (base64 encoded string).
     * Must not be empty.
     */
    @IsNotEmpty()
    avatar: string;
}

/**
 * Data Transfer Object for updating a user's username.
 */
export class ChangeNameDto {
    /**
     * The new username.
     * Must not be empty.
     */
    @IsNotEmpty()
    username: string;
}

/**
 * Data Transfer Object for changing a user's password.
 */
export class ChangePasswordDto {
    /**
     * The user's current password for verification.
     * Must not be empty.
     */
    @IsNotEmpty()
    currentPassword: string;

    /**
     * The new password to set.
     * Must be at least 6 characters long.
     */
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}