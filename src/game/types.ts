import type { GameAction } from '../config/gameConfig';

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type GameState =
  | 'idle'
  | 'running'
  | 'paused'
  | 'clearing'
  | 'gameover';

export interface Point {
  x: number;
  y: number;
}

export type CellValue = TetrominoType | null;

export interface GameStats {
  score: number;
  level: number;
  lines: number;
}

export interface LineClearEvent {
  lineCount: number;
  rows: number[];
  scoreDelta: number;
  timestamp: number;
}

export interface GameSnapshot {
  board: CellValue[][];
  activePiece: {
    type: TetrominoType;
    cells: Point[];
  } | null;
  ghostPiece: {
    type: TetrominoType;
    cells: Point[];
  } | null;
  nextType: TetrominoType | null;
  clearingRows: number[];
  clearingProgress: number;
  state: GameState;
  stats: GameStats;
}

export interface GameHooks {
  onSnapshot?: (snapshot: GameSnapshot) => void;
  onStateChange?: (state: GameState) => void;
  onStatsChange?: (stats: GameStats) => void;
  onLineClear?: (event: LineClearEvent) => void;
}

export interface RendererLike {
  render(snapshot: GameSnapshot): void;
}

export interface AudioManagerLike {
  startBgm(): void;
  stopBgm(): void;
  pauseBgm(): void;
  resumeBgm(): void;
  play(effect: 'move' | 'rotate' | 'drop' | 'clear' | 'gameover'): void;
}

export interface InputBindingTarget {
  action: GameAction;
  element: HTMLElement;
}
