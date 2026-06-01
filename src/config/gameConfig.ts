export type ScoreTable = Record<1 | 2 | 3 | 4, number>;

export type GameAction =
  | 'start'
  | 'togglePause'
  | 'restart'
  | 'moveLeft'
  | 'moveRight'
  | 'softDropStart'
  | 'softDropEnd'
  | 'rotateCW'
  | 'hardDrop';

export interface GameConfig {
  boardWidth: number;
  boardHeight: number;
  fixedStepMs: number;
  baseDropIntervalMs: number;
  minDropIntervalMs: number;
  levelSpeedStepMs: number;
  lockDelayMs: number;
  clearAnimationMs: number;
  softDropFactor: number;
  scoreTable: ScoreTable;
  linesPerLevel: number;
  keyBindings: Record<GameAction, string[]>;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  boardWidth: 10,
  boardHeight: 20,
  fixedStepMs: 1000 / 60,
  baseDropIntervalMs: 950,
  minDropIntervalMs: 140,
  levelSpeedStepMs: 70,
  lockDelayMs: 450,
  clearAnimationMs: 180,
  softDropFactor: 0.05,
  scoreTable: {
    1: 100,
    2: 300,
    3: 500,
    4: 800,
  },
  linesPerLevel: 10,
  keyBindings: {
    start: ['Enter'],
    togglePause: ['KeyP'],
    restart: ['KeyR'],
    moveLeft: ['ArrowLeft'],
    moveRight: ['ArrowRight'],
    softDropStart: ['ArrowDown'],
    softDropEnd: [],
    rotateCW: ['ArrowUp', 'KeyX'],
    hardDrop: ['Space'],
  },
};

export const getDropIntervalMs = (
  level: number,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): number =>
  Math.max(
    config.minDropIntervalMs,
    config.baseDropIntervalMs - (level - 1) * config.levelSpeedStepMs,
  );
