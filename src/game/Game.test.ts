import { DEFAULT_GAME_CONFIG } from '../config/gameConfig';
import { Game } from './Game';
import { Tetromino } from './Tetromino';
import type { AudioManagerLike, RendererLike } from './types';

const createRendererStub = (): RendererLike => ({
  render: () => {},
});

const createAudioStub = (): AudioManagerLike => ({
  startBgm: () => {},
  stopBgm: () => {},
  pauseBgm: () => {},
  resumeBgm: () => {},
  play: () => {},
});

describe('Game', () => {
  it('supports pause and restart transitions', () => {
    const game = new Game({
      config: DEFAULT_GAME_CONFIG,
      renderer: createRendererStub(),
      audioManager: createAudioStub(),
    });

    game.start();
    expect(game.getState()).toBe('running');

    game.togglePause();
    expect(game.getState()).toBe('paused');

    game.restart();
    expect(game.getState()).toBe('running');
    expect(game.getSnapshot().stats.score).toBe(0);
  });

  it('uses a wall kick when rotating near the left edge', () => {
    const game = new Game({
      config: DEFAULT_GAME_CONFIG,
      renderer: createRendererStub(),
      audioManager: createAudioStub(),
    });

    game.start();
    const internalGame = game as unknown as { activePiece: Tetromino };
    internalGame.activePiece = new Tetromino('I', { x: 7, y: 0 }, 1);

    game.rotateClockwise();

    expect(internalGame.activePiece.position.x).toBeLessThan(7);
  });

  it('clears a row and updates score after the clear animation finishes', () => {
    const game = new Game({
      config: {
        ...DEFAULT_GAME_CONFIG,
        clearAnimationMs: 60,
      },
      renderer: createRendererStub(),
      audioManager: createAudioStub(),
    });

    game.start();
    game.board.place(Tetromino.create('I', 0, 18));
    game.board.place(Tetromino.create('I', 4, 18));

    const internalGame = game as unknown as { activePiece: Tetromino };
    internalGame.activePiece = Tetromino.create('O', 7, 0);

    game.hardDrop();
    expect(game.getState()).toBe('clearing');

    game.step(80);

    const snapshot = game.getSnapshot();
    expect(snapshot.state).toBe('running');
    expect(snapshot.stats.score).toBe(100);
    expect(snapshot.stats.lines).toBe(1);
  });

  it('enters gameover when the spawn zone is blocked', () => {
    const game = new Game({
      config: DEFAULT_GAME_CONFIG,
      renderer: createRendererStub(),
      audioManager: createAudioStub(),
    });

    game.start();
    game.board.place(Tetromino.create('O', 2, 0));
    game.board.place(Tetromino.create('O', 4, 0));

    const internalGame = game as unknown as {
      activePiece: Tetromino | null;
      nextType: 'I';
      spawnPiece: () => void;
    };

    internalGame.activePiece = null;
    internalGame.nextType = 'I';
    internalGame.spawnPiece();

    expect(game.getState()).toBe('gameover');
  });
});
