import type { GameConfig } from '../config/gameConfig';
import { DEFAULT_GAME_CONFIG, getDropIntervalMs } from '../config/gameConfig';
import type { GameStats } from './types';

export class ScoreManager {
  private readonly config: GameConfig;
  private score = 0;
  private level = 1;
  private lines = 0;

  constructor(config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.config = config;
  }

  reset(): void {
    this.score = 0;
    this.level = 1;
    this.lines = 0;
  }

  getLineClearScore(lineCount: number): number {
    if (lineCount <= 0) {
      return 0;
    }

    const normalizedCount = Math.min(4, Math.max(1, lineCount)) as 1 | 2 | 3 | 4;
    return this.config.scoreTable[normalizedCount];
  }

  applyLineClear(lineCount: number): GameStats {
    if (lineCount <= 0) {
      return this.getStats();
    }

    this.score += this.getLineClearScore(lineCount);
    this.lines += lineCount;
    this.level = Math.floor(this.lines / this.config.linesPerLevel) + 1;
    return this.getStats();
  }

  getDropIntervalMs(): number {
    return getDropIntervalMs(this.level, this.config);
  }

  getStats(): GameStats {
    return {
      score: this.score,
      level: this.level,
      lines: this.lines,
    };
  }
}
