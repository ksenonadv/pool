import { MinLength } from "class-validator";

export class AuthDto {
  username: string;
  password: string;
}

export class SignUpDto {

  @MinLength(3)
  username: string;

  @MinLength(6)
  password: string;
}