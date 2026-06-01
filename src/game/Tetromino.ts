import type { Point, TetrominoType } from './types';

export type RotationIndex = 0 | 1 | 2 | 3;
export type RotationDirection = 1 | -1;
export type Matrix = number[][];

const I_STATES: Matrix[] = [
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 0],
  ],
  [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
  ],
];

const O_STATES: Matrix[] = [
  [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
];

const T_STATES: Matrix[] = [
  [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 0, 0],
    [1, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
  ],
];

const S_STATES: Matrix[] = [
  [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [1, 0, 0, 0],
    [1, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
  ],
];

const Z_STATES: Matrix[] = [
  [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 0, 1, 0],
    [0, 1, 1, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 0, 0, 0],
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 0, 0],
    [1, 1, 0, 0],
    [1, 0, 0, 0],
    [0, 0, 0, 0],
  ],
];

const J_STATES: Matrix[] = [
  [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 1, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
  ],
];

const L_STATES: Matrix[] = [
  [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
  ],
  [
    [0, 0, 0, 0],
    [1, 1, 1, 0],
    [1, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [1, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
  ],
];

const TETROMINO_STATES: Record<TetrominoType, Matrix[]> = {
  I: I_STATES,
  O: O_STATES,
  T: T_STATES,
  S: S_STATES,
  Z: Z_STATES,
  J: J_STATES,
  L: L_STATES,
};

const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

const shuffle = (types: TetrominoType[]): TetrominoType[] => {
  const copy = [...types];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
};

export class PieceBag {
  private bag: TetrominoType[] = [];

  next(): TetrominoType {
    if (this.bag.length === 0) {
      this.bag = shuffle(TETROMINO_TYPES);
    }

    const nextPiece = this.bag.shift();

    if (!nextPiece) {
      throw new Error('Piece bag failed to produce a tetromino.');
    }

    return nextPiece;
  }
}

export const getTetrominoMatrix = (
  type: TetrominoType,
  rotation: RotationIndex,
): Matrix => TETROMINO_STATES[type][rotation];

const normalizeRotation = (rotation: number): RotationIndex =>
  (((rotation % 4) + 4) % 4) as RotationIndex;

export class Tetromino {
  readonly type: TetrominoType;
  readonly rotation: RotationIndex;
  readonly position: Point;

  constructor(type: TetrominoType, position: Point, rotation: RotationIndex = 0) {
    this.type = type;
    this.position = position;
    this.rotation = rotation;
  }

  static create(type: TetrominoType, x: number, y: number): Tetromino {
    return new Tetromino(type, { x, y });
  }

  get matrix(): Matrix {
    return getTetrominoMatrix(this.type, this.rotation);
  }

  getCells(
    position: Point = this.position,
    rotation: RotationIndex = this.rotation,
  ): Point[] {
    const matrix = getTetrominoMatrix(this.type, rotation);
    const cells: Point[] = [];

    for (let row = 0; row < matrix.length; row += 1) {
      for (let column = 0; column < matrix[row].length; column += 1) {
        if (matrix[row][column] === 1) {
          cells.push({
            x: position.x + column,
            y: position.y + row,
          });
        }
      }
    }

    return cells;
  }

  move(deltaX: number, deltaY: number): Tetromino {
    return new Tetromino(this.type, {
      x: this.position.x + deltaX,
      y: this.position.y + deltaY,
    }, this.rotation);
  }

  withPosition(position: Point): Tetromino {
    return new Tetromino(this.type, position, this.rotation);
  }

  rotate(direction: RotationDirection): Tetromino {
    return new Tetromino(
      this.type,
      this.position,
      normalizeRotation(this.rotation + direction),
    );
  }
}

export const getKickTests = (
  type: TetrominoType,
  direction: RotationDirection,
): Point[] => {
  if (type === 'O') {
    return [{ x: 0, y: 0 }];
  }

  if (type === 'I') {
    return direction === 1
      ? [
          { x: 0, y: 0 },
          { x: -2, y: 0 },
          { x: 1, y: 0 },
          { x: -2, y: -1 },
          { x: 1, y: 2 },
          { x: 0, y: -1 },
        ]
      : [
          { x: 0, y: 0 },
          { x: 2, y: 0 },
          { x: -1, y: 0 },
          { x: 2, y: -1 },
          { x: -1, y: 2 },
          { x: 0, y: -1 },
        ];
  }

  return direction === 1
    ? [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: -1, y: -1 },
        { x: 0, y: 2 },
        { x: -1, y: 2 },
        { x: 1, y: 0 },
      ]
    : [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: -1, y: 0 },
      ];
};
