import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangeAvatarDto {

    @IsNotEmpty()
    avatar: string;
}

export class ChangeNameDto {
    @IsNotEmpty()
    username: string;
}

export class ChangePasswordDto {

    @IsNotEmpty()
    currentPassword: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;
}