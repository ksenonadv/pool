import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { MatchPlayer } from './match-player.entity';

/**
 * Entity representing a completed pool match.
 * 
 * Stores information about a match between two players, including the match duration,
 * the winner, and the reason the game ended.
 */
@Entity()
export class Match {
  /**
   * Unique identifier for the match
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Timestamp when the match was played
   */
  @CreateDateColumn()
  playedAt: Date;

  /**
   * Duration of the match in seconds
   */
  @Column({ type: 'int', nullable: false })
  durationSeconds: number;

  /**
   * Reference to the User who won the match
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'winnerId' })
  winner: User;

  /**
   * ID of the user who won the match
   */
  @Column({ nullable: true })
  winnerId: string;

  /**
   * Reason the match ended (e.g., 'EIGHT_BALL_POTTED', 'FOUL_ON_EIGHT_BALL')
   */
  @Column({ nullable: true })
  gameOverReason: string;

  /**
   * Players who participated in this match with their statistics
   */
  @OneToMany(() => MatchPlayer, matchPlayer => matchPlayer.match, { cascade: true })
  matchPlayers: MatchPlayer[];
}
