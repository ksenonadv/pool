import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Cue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  image: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ nullable: true })
  description: string;
}
