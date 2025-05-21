import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Entity representing a cue stick in the game.
 * 
 * Cues are items that players can unlock and equip, each with different
 * visual appearance and potentially different properties.
 */
@Entity()
export class Cue {
  /**
   * Unique identifier for the cue
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Name of the cue, must be unique
   */
  @Column({ unique: true })
  name: string;

  /**
   * URL to the image of the cue
   */
  @Column()
  image: string;

  /**
   * Price of the cue in points (0 for starter cue)
   */
  @Column({ type: 'int' })
  price: number;

  /**
   * Description of the cue
   */
  @Column({ nullable: true })
  description: string;
}
