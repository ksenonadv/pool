import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenGuard } from 'src/guards/accessToken.guard';
import { UsersService } from 'src/services/users.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ChangeAvatarDto, ChangeNameDto, ChangePasswordDto } from 'src/dto/user.dto';

@Controller('user')
export class UserController {

    constructor(
        private readonly userService: UsersService
    ) { /* */ }

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