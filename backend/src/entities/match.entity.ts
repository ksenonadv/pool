import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { MatchPlayer } from './match-player.entity';

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  playedAt: Date;

  @Column({ type: 'int', nullable: false })
  durationSeconds: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'winnerId' })
  winner: User;

  @Column({ nullable: true })
  winnerId: string;

  @Column({ nullable: true })
  gameOverReason: string;

  @OneToMany(() => MatchPlayer, matchPlayer => matchPlayer.match, { cascade: true })
  matchPlayers: MatchPlayer[];
}
