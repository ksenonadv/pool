import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Match } from './match.entity';
import { BallGroup } from '@shared/game.types';

/**
 * Entity representing a player's participation and performance in a specific match.
 * 
 * This acts as a join table between Match and User, but also stores detailed statistics
 * about the player's performance during that particular match.
 */
@Entity()
export class MatchPlayer {
  /**
   * Unique identifier for this match-player record
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Reference to the match this record belongs to
   */
  @ManyToOne(() => Match, match => match.matchPlayers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;
  
  /**
   * ID of the match this record belongs to
   */
  @Column()
  matchId: string;

  /**
   * Reference to the user (player) this record is for
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
  
  /**
   * ID of the user (player) this record is for
   */
  @Column()
  userId: string;

  /**
   * The ball group assigned to this player during the match (solids/stripes)
   */
  @Column({ type: 'enum', enum: BallGroup, nullable: true })
  ballGroup: BallGroup;
  
  /**
   * Number of balls this player successfully pocketed during the match
   */
  @Column({ type: 'int', default: 0 })
  ballsPocketed: number;
  
  /**
   * Total number of shots this player took during the match
   */
  @Column({ type: 'int', default: 0 })
  shotsTaken: number;
  
  /**
   * Number of fouls this player committed during the match
   */
  @Column({ type: 'int', default: 0 })
  fouls: number;
  
  /**
   * Whether this player won the match
   */
  @Column({ type: 'boolean', default: false })
  isWinner: boolean;
}
