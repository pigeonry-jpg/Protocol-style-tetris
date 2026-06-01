import type { GameConfig } from '../config/gameConfig';
import { DEFAULT_GAME_CONFIG } from '../config/gameConfig';
import { Board } from './Board';
import { PieceBag, Tetromino, getKickTests } from './Tetromino';
import { ScoreManager } from './ScoreManager';
import type {
  AudioManagerLike,
  GameHooks,
  GameSnapshot,
  GameState,
  Point,
  RendererLike,
  TetrominoType,
} from './types';

const NOOP_RENDERER: RendererLike = {
  render: () => {},
};

const NOOP_AUDIO: AudioManagerLike = {
  startBgm: () => {},
  stopBgm: () => {},
  pauseBgm: () => {},
  resumeBgm: () => {},
  play: () => {},
};

interface GameOptions {
  config?: GameConfig;
  renderer?: RendererLike;
  audioManager?: AudioManagerLike;
  scoreManager?: ScoreManager;
  hooks?: GameHooks;
}

type ResumableState = 'running' | 'clearing';

export class Game {
  readonly board: Board;
  readonly scoreManager: ScoreManager;

  private readonly config: GameConfig;
  private readonly renderer: RendererLike;
  private readonly audioManager: AudioManagerLike;
  private readonly hooks?: GameHooks;
  private pieceBag = new PieceBag();
  private activePiece: Tetromino | null = null;
  private nextType: TetrominoType | null = null;
  private clearingRows: number[] = [];
  private state: GameState = 'idle';
  private resumeState: ResumableState | null = null;
  private dropAccumulator = 0;
  private lockAccumulator = 0;
  private clearingAccumulator = 0;
  private softDropActive = false;
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;

  constructor(options: GameOptions = {}) {
    this.config = options.config ?? DEFAULT_GAME_CONFIG;
    this.board = new Board(this.config.boardWidth, this.config.boardHeight);
    this.renderer = options.renderer ?? NOOP_RENDERER;
    this.audioManager = options.audioManager ?? NOOP_AUDIO;
    this.scoreManager = options.scoreManager ?? new ScoreManager(this.config);
    this.hooks = options.hooks;

    this.prepareSession();
    this.emitStats();
    this.emitSnapshot();
  }

  getState(): GameState {
    return this.state;
  }

  startLoop(): void {
    if (this.animationFrameId !== null || typeof requestAnimationFrame !== 'function') {
      return;
    }

    this.lastFrameTime = performance.now();
    const loop = (time: number) => {
      const delta = Math.min(time - this.lastFrameTime, 250);
      this.lastFrameTime = time;
      this.step(delta);
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  stopLoop(): void {
    if (this.animationFrameId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  start(): void {
    if (this.state === 'paused') {
      this.setState(this.resumeState ?? 'running');
      this.resumeState = null;
      this.audioManager.resumeBgm();
      this.emitSnapshot();
      return;
    }

    this.restart();
  }

  restart(): void {
    this.prepareSession();
    this.spawnPiece();
    this.audioManager.startBgm();
    this.setState('running');
    this.emitStats();
    this.emitSnapshot();
  }

  pause(): void {
    if (this.state !== 'running' && this.state !== 'clearing') {
      return;
    }

    this.resumeState = this.state;
    this.softDropActive = false;
    this.setState('paused');
    this.audioManager.pauseBgm();
    this.emitSnapshot();
  }

  togglePause(): void {
    if (this.state === 'idle' || this.state === 'gameover') {
      return;
    }

    if (this.state === 'paused') {
      this.setState(this.resumeState ?? 'running');
      this.resumeState = null;
      this.audioManager.resumeBgm();
    } else if (this.state === 'running' || this.state === 'clearing') {
      this.resumeState = this.state;
      this.softDropActive = false;
      this.setState('paused');
      this.audioManager.pauseBgm();
    }

    this.emitSnapshot();
  }

  moveLeft(): void {
    if (this.state !== 'running') {
      return;
    }

    if (this.tryMove(-1, 0)) {
      this.audioManager.play('move');
      this.emitSnapshot();
    }
  }

  moveRight(): void {
    if (this.state !== 'running') {
      return;
    }

    if (this.tryMove(1, 0)) {
      this.audioManager.play('move');
      this.emitSnapshot();
    }
  }

  rotateClockwise(): void {
    if (this.state !== 'running' || !this.activePiece) {
      return;
    }

    const rotated = this.activePiece.rotate(1);

    for (const kick of getKickTests(this.activePiece.type, 1)) {
      const candidate = rotated.withPosition({
        x: rotated.position.x + kick.x,
        y: rotated.position.y + kick.y,
      });

      if (!this.board.collides(candidate)) {
        this.activePiece = candidate;
        this.lockAccumulator = 0;
        this.audioManager.play('rotate');
        this.emitSnapshot();
        return;
      }
    }
  }

  setSoftDrop(active: boolean): void {
    if (this.state !== 'running') {
      return;
    }

    if (this.softDropActive === active) {
      return;
    }

    this.softDropActive = active;

    if (!active) {
      return;
    }

    if (this.tryMove(0, 1, false)) {
      this.dropAccumulator = 0;
      this.emitSnapshot();
    }
  }

  hardDrop(): void {
    if (this.state !== 'running' || !this.activePiece) {
      return;
    }

    while (this.tryMove(0, 1)) {
      // Keep falling until collision.
    }

    this.lockPiece();
    this.emitSnapshot();
  }

  step(deltaMs: number): void {
    if (this.state === 'paused' || this.state === 'idle' || this.state === 'gameover') {
      this.emitSnapshot();
      return;
    }

    let accumulator = deltaMs;

    while (accumulator > 0) {
      const slice = Math.min(accumulator, this.config.fixedStepMs);

      if (this.state === 'running') {
        this.updateRunning(slice);
      } else if (this.state === 'clearing') {
        this.updateClearing(slice);
      }

      accumulator -= slice;
    }

    this.emitSnapshot();
  }

  getSnapshot(): GameSnapshot {
    return {
      board: this.board.getGrid(),
      activePiece: this.activePiece
        ? {
            type: this.activePiece.type,
            cells: this.activePiece.getCells().filter((cell) => cell.y >= 0),
          }
        : null,
      ghostPiece: this.activePiece
        ? {
            type: this.activePiece.type,
            cells: this.getGhostCells(),
          }
        : null,
      nextType: this.nextType,
      clearingRows: [...this.clearingRows],
      clearingProgress:
        this.state === 'clearing'
          ? Math.min(1, this.clearingAccumulator / this.config.clearAnimationMs)
          : 0,
      state: this.state,
      stats: this.scoreManager.getStats(),
    };
  }

  private updateRunning(deltaMs: number): void {
    if (!this.activePiece) {
      this.spawnPiece();
      return;
    }

    const dropInterval = this.softDropActive
      ? Math.max(28, this.scoreManager.getDropIntervalMs() * this.config.softDropFactor)
      : this.scoreManager.getDropIntervalMs();

    this.dropAccumulator += deltaMs;

    while (this.dropAccumulator >= dropInterval) {
      this.dropAccumulator -= dropInterval;

      if (!this.tryMove(0, 1, false)) {
        this.dropAccumulator = 0;
        break;
      }
    }

    if (this.isGrounded()) {
      this.lockAccumulator += deltaMs;

      if (this.lockAccumulator >= this.config.lockDelayMs) {
        this.lockPiece();
      }
    } else {
      this.lockAccumulator = 0;
    }
  }

  private updateClearing(deltaMs: number): void {
    this.clearingAccumulator += deltaMs;

    if (this.clearingAccumulator < this.config.clearAnimationMs) {
      return;
    }

    const clearedCount = this.board.clearRows(this.clearingRows);
    this.clearingRows = [];
    this.clearingAccumulator = 0;
    this.scoreManager.applyLineClear(clearedCount);
    this.emitStats();
    this.setState('running');
    this.spawnPiece();
  }

  private prepareSession(): void {
    this.board.reset();
    this.scoreManager.reset();
    this.pieceBag = new PieceBag();
    this.nextType = this.pieceBag.next();
    this.activePiece = null;
    this.clearingRows = [];
    this.resumeState = null;
    this.dropAccumulator = 0;
    this.lockAccumulator = 0;
    this.clearingAccumulator = 0;
    this.softDropActive = false;
    this.audioManager.stopBgm();
    this.setState('idle');
  }

  private spawnPiece(): void {
    const type = this.nextType ?? this.pieceBag.next();
    this.nextType = this.pieceBag.next();
    const spawnX = Math.floor(this.config.boardWidth / 2) - 2;
    const candidate = Tetromino.create(type, spawnX, -1);

    if (this.board.collides(candidate)) {
      this.activePiece = null;
      this.softDropActive = false;
      this.audioManager.play('gameover');
      this.audioManager.stopBgm();
      this.setState('gameover');
      return;
    }

    this.activePiece = candidate;
    this.lockAccumulator = 0;
    this.dropAccumulator = 0;
  }

  private lockPiece(): void {
    if (!this.activePiece) {
      return;
    }

    this.board.place(this.activePiece);
    const fullRows = this.board.getFullRows();
    this.activePiece = null;
    this.lockAccumulator = 0;
    this.dropAccumulator = 0;
    this.softDropActive = false;

    if (fullRows.length > 0) {
      const scoreDelta = this.scoreManager.getLineClearScore(fullRows.length);
      this.clearingRows = fullRows;
      this.clearingAccumulator = 0;
      this.setState('clearing');
      this.audioManager.play('clear');
      this.hooks?.onLineClear?.({
        lineCount: fullRows.length,
        rows: [...fullRows],
        scoreDelta,
        timestamp: performance.now(),
      });
      return;
    }

    this.audioManager.play('drop');
    this.spawnPiece();
  }

  private tryMove(deltaX: number, deltaY: number, resetLock = true): boolean {
    if (!this.activePiece) {
      return false;
    }

    const candidate = this.activePiece.move(deltaX, deltaY);

    if (this.board.collides(candidate)) {
      return false;
    }

    this.activePiece = candidate;

    if (resetLock) {
      this.lockAccumulator = 0;
    }

    return true;
  }

  private isGrounded(): boolean {
    if (!this.activePiece) {
      return false;
    }

    return this.board.collides(this.activePiece.move(0, 1));
  }

  private getGhostCells(): Point[] {
    if (!this.activePiece) {
      return [];
    }

    let ghost = this.activePiece;

    while (!this.board.collides(ghost.move(0, 1))) {
      ghost = ghost.move(0, 1);
    }

    return ghost.getCells().filter((cell) => cell.y >= 0);
  }

  private emitStats(): void {
    this.hooks?.onStatsChange?.(this.scoreManager.getStats());
  }

  private emitSnapshot(): void {
    const snapshot = this.getSnapshot();
    this.renderer.render(snapshot);
    this.hooks?.onSnapshot?.(snapshot);
  }

  private setState(nextState: GameState): void {
    if (this.state === nextState) {
      return;
    }

    this.state = nextState;
    this.hooks?.onStateChange?.(nextState);
  }
}
