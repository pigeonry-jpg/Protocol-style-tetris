import { Tetromino } from './Tetromino';
import type { CellValue } from './types';

export class Board {
  readonly width: number;
  readonly height: number;
  private grid: CellValue[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = this.createEmptyGrid();
  }

  reset(): void {
    this.grid = this.createEmptyGrid();
  }

  getGrid(): CellValue[][] {
    return this.grid.map((row) => [...row]);
  }

  collides(piece: Tetromino): boolean {
    return piece.getCells().some(({ x, y }) => {
      if (x < 0 || x >= this.width || y >= this.height) {
        return true;
      }

      if (y < 0) {
        return false;
      }

      return this.grid[y][x] !== null;
    });
  }

  place(piece: Tetromino): void {
    piece.getCells().forEach(({ x, y }) => {
      if (y < 0) {
        return;
      }

      this.grid[y][x] = piece.type;
    });
  }

  getFullRows(): number[] {
    const rows: number[] = [];

    for (let row = 0; row < this.height; row += 1) {
      if (this.grid[row].every((cell) => cell !== null)) {
        rows.push(row);
      }
    }

    return rows;
  }

  clearRows(rows: number[]): number {
    if (rows.length === 0) {
      return 0;
    }

    const rowSet = new Set(rows);
    const remainingRows = this.grid.filter((_, index) => !rowSet.has(index));
    const clearedCount = this.height - remainingRows.length;

    while (remainingRows.length < this.height) {
      remainingRows.unshift(Array.from<CellValue>({ length: this.width }).fill(null));
    }

    this.grid = remainingRows;
    return clearedCount;
  }

  private createEmptyGrid(): CellValue[][] {
    return Array.from({ length: this.height }, () =>
      Array.from<CellValue>({ length: this.width }).fill(null),
    );
  }
}
