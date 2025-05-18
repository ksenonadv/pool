import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class PlayerStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'int', default: 0 })
  totalMatches: number;

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @Column({ type: 'float', default: 0 })
  winRate: number;

  @Column({ type: 'int', default: 0 })
  totalBallsPocketed: number;

  @Column({ type: 'int', default: 0 })
  totalShotsTaken: number;

  @Column({ type: 'int', default: 0 })
  totalFouls: number;

  @Column({ type: 'float', default: 0 })
  averageMatchDuration: number;

  @Column({ type: 'int', default: 0 })
  totalPlayTime: number;
}
