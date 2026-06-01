import { DEFAULT_GAME_CONFIG } from '../config/gameConfig';
import { ScoreManager } from './ScoreManager';

describe('ScoreManager', () => {
  it('awards score and levels up every 10 lines', () => {
    const scoreManager = new ScoreManager(DEFAULT_GAME_CONFIG);

    scoreManager.applyLineClear(4);
    scoreManager.applyLineClear(4);
    const stats = scoreManager.applyLineClear(2);

    expect(stats.score).toBe(1900);
    expect(stats.lines).toBe(10);
    expect(stats.level).toBe(2);
    expect(scoreManager.getDropIntervalMs()).toBeLessThan(
      DEFAULT_GAME_CONFIG.baseDropIntervalMs,
    );
  });
});
