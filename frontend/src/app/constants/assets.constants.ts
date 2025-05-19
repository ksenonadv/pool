export const GAME_IMAGES_ASSETS = { 
  'table': 'assets/images/game/table.png',
  'ball_0': 'assets/images/game/ball_0.png',
  'ball_1': 'assets/images/game/ball_1.png',
  'ball_2': 'assets/images/game/ball_2.png',
  'ball_3': 'assets/images/game/ball_3.png',
  'ball_4': 'assets/images/game/ball_4.png',
  'ball_5': 'assets/images/game/ball_5.png',
  'ball_6': 'assets/images/game/ball_6.png',
  'ball_7': 'assets/images/game/ball_7.png',
  'ball_8': 'assets/images/game/ball_8.png',
  'ball_9': 'assets/images/game/ball_9.png',
  'ball_10': 'assets/images/game/ball_10.png',
  'ball_11': 'assets/images/game/ball_11.png',
  'ball_12': 'assets/images/game/ball_12.png',
  'ball_13': 'assets/images/game/ball_13.png',
  'ball_14': 'assets/images/game/ball_14.png',
  'ball_15': 'assets/images/game/ball_15.png',
  'cue': 'assets/images/game/cue.png'
};

export const GAME_AUDIO_ASSETS = {
  'turn': 'assets/audio/turn.mp3',
  'collision': 'assets/audio/collision.mp3',
  'pocket': 'assets/audio/pocket.mp3',
  'shoot': 'assets/audio/shoot.mp3',
};

export type SoundType = keyof typeof GAME_AUDIO_ASSETS;