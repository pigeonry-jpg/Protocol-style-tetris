import { PieceBag, Tetromino } from './Tetromino';

describe('Tetromino utilities', () => {
  it('produces a full 7-bag before repeating pieces', () => {
    const bag = new PieceBag();
    const pieces = Array.from({ length: 7 }, () => bag.next());

    expect(new Set(pieces).size).toBe(7);
  });

  it('rotates tetromino state clockwise', () => {
    const piece = Tetromino.create('T', 3, 0);
    const rotated = piece.rotate(1);

    expect(rotated.rotation).toBe(1);
    expect(rotated.getCells()).not.toEqual(piece.getCells());
  });
});
