import { Board } from './Board';
import { Tetromino } from './Tetromino';

describe('Board', () => {
  it('detects wall collision', () => {
    const board = new Board(10, 20);
    const piece = Tetromino.create('I', -1, 0);

    expect(board.collides(piece)).toBe(true);
  });

  it('clears full rows and keeps board height stable', () => {
    const board = new Board(10, 20);

    board.place(Tetromino.create('I', 0, 18));
    board.place(Tetromino.create('I', 4, 18));
    board.place(Tetromino.create('O', 7, 18));

    expect(board.getFullRows()).toEqual([19]);

    const cleared = board.clearRows([19]);

    expect(cleared).toBe(1);
    expect(board.getGrid()).toHaveLength(20);
    expect(board.getGrid()[0].every((cell) => cell === null)).toBe(true);
  });
});
