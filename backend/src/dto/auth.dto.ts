import { IsNotEmpty, MinLength } from "class-validator";

/**
 * Data Transfer Object for user authentication.
 * Used for login operations to validate incoming credentials.
 */
export class AuthDto {

  /**
   * Username of the user attempting to log in.
   * Must not be empty.
   */
  @IsNotEmpty()
  username: string;

  /**
   * Password of the user attempting to log in.
   * Must not be empty.
   */
  @IsNotEmpty()
  password: string;
}

/**
 * Data Transfer Object for user registration.
 * Used for signup operations to validate new user data.
 */
export class SignUpDto {

  /**
   * Username for the new user account.
   * Must be at least 3 characters long.
   */
  @MinLength(3)
  username: string;

  /**
   * Password for the new user account.
   * Must be at least 6 characters long.
   */
  @MinLength(6)
  password: string;
}