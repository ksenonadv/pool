import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, BeforeInsert, ManyToOne } from 'typeorm';
import { Cue } from './cue.entity';

/**
 * User entity that represents a player in the application.
 * 
 * This entity stores all user-related information including authentication
 * details, profile data, and relationships to other entities.
 */
@Entity()
export class User {
  
  /**
   * The unique identifier of the user
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The user's display name, must be unique
   */
  @Column({ unique: true })
  username: string;

  /**
   * The URL to the user's profile picture
   * Defaults to a placeholder image if not set
   */
  @Column({ nullable: false, default: '/assets/images/default_avatar.jpg' })
  avatar: string;

  /**
   * Discord ID for users who authenticated through Discord OAuth
   * Will be null for users who registered with username/password
   */
  @Column({ unique: true, nullable: true })
  discordId: string;

  /**
   * Hashed password for users who registered via username/password
   * Will be null for users who authenticated through Discord
   */
  @Column({ nullable: true })
  password: string;

  /**
   * JWT refresh token used for authentication
   */
  @Column({ nullable: true })
  refreshToken: string;

  /**
   * The currently equipped cue object that the user is using
   */
  @ManyToOne(() => Cue)
  @JoinColumn({ name: 'equippedCueId' })
  cue: Cue;

  /**
   * ID reference to the cue that the user has currently equipped
   */
  @Column({ nullable: true, unique: false })
  equippedCueId: string;
}
