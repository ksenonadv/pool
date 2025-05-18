import { IsNotEmpty, MinLength } from "class-validator";

export class AuthDto {

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  password: string;
}

export class SignUpDto {

  @MinLength(3)
  username: string;

  @MinLength(6)
  password: string;
}