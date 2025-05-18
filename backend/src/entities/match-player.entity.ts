import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Match } from './match.entity';
import { BallGroup } from '@shared/game.types';

@Entity()
export class MatchPlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Match, match => match.matchPlayers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match: Match;
  
  @Column()
  matchId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
  
  @Column()
  userId: string;

  @Column({ type: 'enum', enum: BallGroup, nullable: true })
  ballGroup: BallGroup;
  
  @Column({ type: 'int', default: 0 })
  ballsPocketed: number;
  
  @Column({ type: 'int', default: 0 })
  shotsTaken: number;
  
  @Column({ type: 'int', default: 0 })
  fouls: number;
  
  @Column({ type: 'boolean', default: false })
  isWinner: boolean;
}
