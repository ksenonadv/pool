/**
 * Minimum power value for a shot to be valid.
 * Prevents extremely weak shots that would barely move the ball.
 */
export const MIN_POWER = 15;

/**
 * Represents the different groups of pool balls in the game.
 * 
 * In 8-ball pool, players are assigned either SOLIDS or STRIPES.
 * EIGHT represents the black 8-ball, which is the winning ball.
 * NONE is used when no group is assigned yet.
 */
export enum BallGroup {
  /** No group assigned yet */
  NONE = 'none',
  /** Solid-colored balls (1-7) */
  SOLIDS = 'solids',
  /** Striped balls (9-15) */
  STRIPES = 'stripes',
  /** The 8-ball (black ball) */
  EIGHT = 'eight'
}