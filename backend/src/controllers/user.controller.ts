import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { UsersService } from 'src/services/users.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ChangeAvatarDto, ChangeNameDto, ChangePasswordDto } from 'src/dto/user.dto';

/**
 * Controller for handling user-related HTTP requests.
 * 
 * Provides endpoints for retrieving and updating user profile data.
 * All endpoints are protected with AccessTokenGuard to ensure authentication.
 */
@Controller('user')
export class UserController {

    constructor(
        private readonly userService: UsersService
    ) { /* */ }

    /**
     * Retrieves the current authenticated user's information.
     * 
     * Returns a simplified user object with essential profile information.
     * 
     * @param req - The request object containing user authentication data
     * @returns User profile data (id, username, avatar, discordId)
     */
    @UseGuards(AccessTokenGuard)
    @Get('me')
    async getMe(@Req() req: Request) {

        const user = await this.userService.findById(
            req.user.userId
        );

        const { username, avatar, discordId } = user;

        return {
            userId: req.user.userId,
            username,
            avatar,
            discordId
        };
    }

    /**
     * Updates the user's avatar image.
     * 
     * Uploads the provided base64 image to Imgur and updates the user's
     * profile with the resulting image URL.
     * 
     * @param body - DTO containing the avatar image as base64
     * @param req - The request object containing user authentication data
     * @returns Object containing the new avatar URL
     * @throws BadRequestException if avatar is missing or invalid
     * @throws InternalServerErrorException if upload to Imgur fails
     */
    @Patch('avatar')
    @UseGuards(AccessTokenGuard)
    async changeAvatar(@Body() body: ChangeAvatarDto, @Req() req: Request) {
        if (!body.avatar) {
            throw new BadRequestException('Avatar is required.');
        }

        // Remove data URL prefix if present
        const base64 = body.avatar.replace(/^data:image\/[a-z]+;base64,/, '');

        try {
            const imgurResponse = await fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: base64,
                    type: 'base64'
                }),
            });

            const response = await imgurResponse.json();

            if (!response.success) {
                throw new BadRequestException(
                    response.data.error
                );
            }

            const imageUrl = response.data.link;

            await this.userService.update(req.user.userId, {
                avatar: imageUrl
            });

            return { avatar: imageUrl };
        } catch (error) {
            throw new InternalServerErrorException('Failed to upload avatar.');
        }
    }

    /**
     * Updates the user's username.
     * 
     * Validates that the username is available before updating.
     * 
     * @param body - DTO containing the new username
     * @param req - The request object containing user authentication data
     * @returns Object containing the new username
     * @throws BadRequestException if username is missing, already in use, or user not found
     */
    @Patch('username')
    @UseGuards(AccessTokenGuard)
    async changeUsername(@Body() body: ChangeNameDto, @Req() req: Request) {
        
        if (!body.username) {
            throw new BadRequestException(
                'Username is required.'
            );
        }

        const existing = await this.userService.findByUsername(
            body.username
        );

        if (existing) {
            throw new BadRequestException(
                'Username is already in use.'
            );
        }

        const user = await this.userService.findById(
            req.user.userId
        );

        if (!user) {
            throw new BadRequestException(
                'User not found.'
            );
        }

        await this.userService.update(user.id, {
            username: body.username
        });

        return { 
            username: body.username 
        };
    }

    /**
     * Updates the user's password.
     * 
     * Verifies the current password before changing to the new password.
     * 
     * @param body - DTO containing current and new password
     * @param req - The request object containing user authentication data
     * @throws BadRequestException if passwords are missing or validation fails
     */
    @Patch('password')
    @UseGuards(AccessTokenGuard)
    async changePassword(@Body() body: ChangePasswordDto, @Req() req: Request) {
        
        if (!body.currentPassword || !body.password) {
            throw new BadRequestException(
                'Current password and new password are required.'
            );
        }

        await this.userService.changePassword(
            req.user.userId, 
            body
        );

        return;
    }

}