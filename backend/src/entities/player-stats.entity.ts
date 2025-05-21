import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

/**
 * Entity for storing cumulative player statistics across all matches.
 * 
 * Maintains aggregate statistics for each player, including wins, losses,
 * shots taken, balls pocketed, and other performance metrics.
 */
@Entity()
export class PlayerStats {
  /**
   * Unique identifier for this stats record
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Reference to the user these statistics belong to
   */
  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * ID of the user these statistics belong to
   */
  @Column()
  userId: string;

  /**
   * Total number of matches the player has participated in
   */
  @Column({ type: 'int', default: 0 })
  totalMatches: number;

  /**
   * Number of matches the player has won
   */
  @Column({ type: 'int', default: 0 })
  wins: number;

  /**
   * Number of matches the player has lost
   */
  @Column({ type: 'int', default: 0 })
  losses: number;

  /**
   * Win rate as a ratio (0.0 to 1.0)
   */
  @Column({ type: 'float', default: 0 })
  winRate: number;

  /**
   * Total number of balls the player has pocketed across all matches
   */
  @Column({ type: 'int', default: 0 })
  totalBallsPocketed: number;

  /**
   * Total number of shots the player has taken across all matches
   */
  @Column({ type: 'int', default: 0 })
  totalShotsTaken: number;

  /**
   * Total number of fouls the player has committed across all matches
   */
  @Column({ type: 'int', default: 0 })
  totalFouls: number;

  /**
   * Average duration of the player's matches in seconds
   */
  @Column({ type: 'float', default: 0 })
  averageMatchDuration: number;

  /**
   * Total time the player has spent playing in seconds
   */
  @Column({ type: 'int', default: 0 })
  totalPlayTime: number;
  
  /**
   * Total points earned by the player (used for progression and rewards)
   */
  @Column({ type: 'int', default: 0 })
  points: number;
}
