import type { ThemePack } from '../config/theme';
import { getTetrominoMatrix } from './Tetromino';
import type {
  CellValue,
  GameSnapshot,
  LineClearEvent,
  Point,
  RendererLike,
  TetrominoType,
} from './types';

interface RendererOptions {
  boardCanvas: HTMLCanvasElement;
  previewCanvas: HTMLCanvasElement;
  theme: ThemePack;
  boardWidth: number;
  boardHeight: number;
  cellPixelSize?: number;
}

interface CelebrationParticle {
  bornAt: number;
  image: HTMLImageElement | null;
  rotation: number;
  rowY: number;
  size: number;
  spin: number;
  ttl: number;
  vx: number;
  vy: number;
  x: number;
}

interface FloatingScore {
  bornAt: number;
  text: string;
  ttl: number;
  x: number;
  y: number;
}

const FALLBACK_COLORS: Record<TetrominoType, string> = {
  I: '#4fc3f7',
  O: '#ffd166',
  T: '#c77dff',
  S: '#80ed99',
  Z: '#ff7b7b',
  J: '#7fb1ff',
  L: '#ffb570',
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

export class Renderer implements RendererLike {
  readonly ready: Promise<void>;
  private readonly boardCanvas: HTMLCanvasElement;
  private readonly boardContext: CanvasRenderingContext2D;
  private readonly previewCanvas: HTMLCanvasElement;
  private readonly previewContext: CanvasRenderingContext2D;
  private readonly theme: ThemePack;
  private readonly boardWidthPx: number;
  private readonly boardHeightPx: number;
  private readonly previewWidthPx: number;
  private readonly previewHeightPx: number;
  private readonly cellSize: number;
  private readonly devicePixelRatio: number;
  private readonly textures = new Map<string, HTMLImageElement>();
  private readonly reserveTextures: HTMLImageElement[] = [];
  private readonly particles: CelebrationParticle[] = [];
  private readonly floatingScores: FloatingScore[] = [];
  private backgroundTexture: HTMLImageElement | null = null;

  constructor(options: RendererOptions) {
    const cellPixelSize = options.cellPixelSize ?? 44;

    this.boardCanvas = options.boardCanvas;
    this.previewCanvas = options.previewCanvas;
    this.theme = options.theme;
    this.devicePixelRatio =
      typeof window === 'undefined'
        ? 1
        : Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    this.boardWidthPx = options.boardWidth * cellPixelSize;
    this.boardHeightPx = options.boardHeight * cellPixelSize;
    this.previewWidthPx = 150;
    this.previewHeightPx = 120;

    this.boardCanvas.width = Math.round(this.boardWidthPx * this.devicePixelRatio);
    this.boardCanvas.height = Math.round(this.boardHeightPx * this.devicePixelRatio);
    this.previewCanvas.width = Math.round(this.previewWidthPx * this.devicePixelRatio);
    this.previewCanvas.height = Math.round(this.previewHeightPx * this.devicePixelRatio);
    this.cellSize = this.boardWidthPx / options.boardWidth;

    const boardContext = this.boardCanvas.getContext('2d');
    const previewContext = this.previewCanvas.getContext('2d');

    if (!boardContext || !previewContext) {
      throw new Error('Canvas 2D context is not available.');
    }

    this.boardContext = boardContext;
    this.previewContext = previewContext;
    this.setupContext(this.boardContext);
    this.setupContext(this.previewContext);
    this.ready = this.preloadAssets();
  }

  celebrateLineClear(event: LineClearEvent): void {
    const now = event.timestamp || performance.now();
    const texturePool =
      this.reserveTextures.length > 0
        ? this.reserveTextures
        : Array.from(this.textures.values());
    const averageRow =
      event.rows.reduce((total, row) => total + row, 0) / Math.max(1, event.rows.length);
    const centerY = (averageRow + 0.5) * this.cellSize;
    const centerX = this.boardWidthPx / 2;
    const particleCount = 10 + event.lineCount * 12;
    const blastWidth = this.boardWidthPx * (0.18 + event.lineCount * 0.05);
    const maxParticleSize = 18 + event.lineCount * 5;

    for (let index = 0; index < particleCount; index += 1) {
      const angle = (-Math.PI * 0.75) + Math.random() * Math.PI * 0.5;
      const speed = 70 + Math.random() * (85 + event.lineCount * 25);
      const image =
        texturePool[Math.floor(Math.random() * Math.max(1, texturePool.length))] ?? null;

      this.particles.push({
        bornAt: now,
        image,
        rotation: Math.random() * Math.PI * 2,
        rowY: centerY + (Math.random() - 0.5) * this.cellSize * event.lineCount,
        size: 12 + Math.random() * maxParticleSize,
        spin: (Math.random() - 0.5) * 9,
        ttl: 900 + event.lineCount * 150 + Math.random() * 220,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * blastWidth,
        vy: Math.sin(angle) * speed,
        x: centerX + (Math.random() - 0.5) * blastWidth,
      });
    }

    this.floatingScores.push({
      bornAt: now,
      text: `+${event.scoreDelta}`,
      ttl: 1100,
      x: centerX,
      y: Math.max(64, centerY),
    });
  }

  render(snapshot: GameSnapshot): void {
    this.drawBoard(snapshot);
    this.drawPreview(snapshot.nextType);
  }

  private async preloadAssets(): Promise<void> {
    const pieceTextureUrls = Object.values(this.theme.pieceTextures);
    const reserveTextureUrls = Object.values(this.theme.reserveTexturePools).flat();
    const uniqueUrls = Array.from(new Set([...pieceTextureUrls, ...reserveTextureUrls]));

    await Promise.all(
      uniqueUrls.map(async (src) => {
        const image = await this.loadImage(src);

        if (!image) {
          return;
        }

        this.textures.set(src, image);

        if (reserveTextureUrls.includes(src)) {
          this.reserveTextures.push(image);
        }
      }),
    );

    if (this.theme.backgroundImage) {
      this.backgroundTexture = await this.loadImage(this.theme.backgroundImage);
    }
  }

  private async loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.decoding = 'async';
      image.src = src;
    });
  }

  private setupContext(context: CanvasRenderingContext2D): void {
    context.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
  }

  private drawBoard(snapshot: GameSnapshot): void {
    const context = this.boardContext;
    context.clearRect(0, 0, this.boardWidthPx, this.boardHeightPx);

    if (this.backgroundTexture) {
      context.save();
      context.globalAlpha = 0.14;
      context.drawImage(
        this.backgroundTexture,
        0,
        0,
        this.boardWidthPx,
        this.boardHeightPx,
      );
      context.restore();
    }

    context.fillStyle = this.theme.boardBackground;
    context.fillRect(0, 0, this.boardWidthPx, this.boardHeightPx);

    this.drawGrid();
    this.drawSettledCells(
      snapshot.board,
      snapshot.clearingRows,
      snapshot.clearingProgress,
    );
    this.drawGhost(snapshot.ghostPiece);

    if (snapshot.activePiece) {
      this.drawCells(
        snapshot.activePiece.type,
        snapshot.activePiece.cells,
        false,
        false,
        0,
      );
    }

    this.drawCelebrations();
  }

  private drawGrid(): void {
    const context = this.boardContext;
    context.save();
    context.strokeStyle = 'rgba(141, 173, 207, 0.08)';
    context.lineWidth = 1;

    for (let column = 0; column <= this.boardWidthPx; column += this.cellSize) {
      context.beginPath();
      context.moveTo(column, 0);
      context.lineTo(column, this.boardHeightPx);
      context.stroke();
    }

    for (let row = 0; row <= this.boardHeightPx; row += this.cellSize) {
      context.beginPath();
      context.moveTo(0, row);
      context.lineTo(this.boardWidthPx, row);
      context.stroke();
    }

    context.restore();
  }

  private drawSettledCells(
    board: CellValue[][],
    clearingRows: number[],
    clearingProgress: number,
  ): void {
    const clearingSet = new Set(clearingRows);

    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (!cell) {
          return;
        }

        this.drawCell(
          cell,
          { x, y },
          {
            ghost: false,
            clearing: clearingSet.has(y),
            clearingProgress,
          },
        );
      });
    });
  }

  private drawGhost(
    ghostPiece: {
      type: TetrominoType;
      cells: Point[];
    } | null,
  ): void {
    if (!ghostPiece || ghostPiece.cells.length === 0) {
      return;
    }

    this.drawCells(ghostPiece.type, ghostPiece.cells, true, false, 0);
  }

  private drawCells(
    type: TetrominoType,
    cells: Point[],
    ghost: boolean,
    clearing: boolean,
    clearingProgress: number,
  ): void {
    cells.forEach((cell) =>
      this.drawCell(type, cell, { ghost, clearing, clearingProgress }),
    );
  }

  private drawCell(
    type: TetrominoType,
    cell: Point,
    options: { ghost: boolean; clearing: boolean; clearingProgress: number },
  ): void {
    const context = this.boardContext;
    const pixelX = cell.x * this.cellSize;
    const pixelY = cell.y * this.cellSize;
    const inset = options.ghost ? 6 : 3;
    const size = this.cellSize - inset * 2;

    context.save();
    context.translate(pixelX, pixelY);

    drawRoundedRect(context, inset, inset, size, size, 8);
    context.clip();

    const clearingAlpha = 0.58 + Math.sin(options.clearingProgress * Math.PI * 3) * 0.2;
    context.fillStyle = options.clearing
      ? `rgba(255, 244, 197, ${clearingAlpha.toFixed(2)})`
      : 'rgba(18, 32, 48, 0.92)';
    context.fillRect(inset, inset, size, size);

    const texture = this.textures.get(this.theme.pieceTextures[type]);

    if (texture && !options.ghost) {
      context.drawImage(texture, inset, inset, size, size);
      context.fillStyle = 'rgba(255, 255, 255, 0.12)';
      context.fillRect(inset, inset, size, 8);
    } else {
      context.globalAlpha = options.ghost ? 0.22 : 1;
      context.fillStyle = FALLBACK_COLORS[type];
      context.fillRect(inset, inset, size, size);
    }

    context.restore();

    context.save();
    context.strokeStyle = options.ghost
      ? 'rgba(178, 221, 255, 0.42)'
      : options.clearing
        ? 'rgba(255, 246, 204, 0.65)'
        : 'rgba(184, 219, 255, 0.2)';
    context.lineWidth = options.ghost ? 2 : 1;
    drawRoundedRect(context, pixelX + inset, pixelY + inset, size, size, 8);
    context.stroke();
    context.restore();
  }

  private drawCelebrations(): void {
    const now = performance.now();
    const context = this.boardContext;

    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      const elapsed = now - particle.bornAt;

      if (elapsed >= particle.ttl) {
        this.particles.splice(index, 1);
        continue;
      }

      const progress = elapsed / particle.ttl;
      const currentX = particle.x + particle.vx * progress * 0.65;
      const currentY =
        particle.rowY +
        particle.vy * progress * 0.8 +
        progress * progress * (80 + particle.size * 0.8);
      const alpha = 1 - progress;
      const size = particle.size * (1 + Math.sin(progress * Math.PI) * 0.2);

      context.save();
      context.globalAlpha = alpha * 0.95;
      context.translate(currentX, currentY);
      context.rotate(particle.rotation + particle.spin * progress);

      if (particle.image) {
        context.drawImage(particle.image, -size / 2, -size / 2, size, size);
      } else {
        context.fillStyle = 'rgba(121, 207, 255, 0.9)';
        context.fillRect(-size / 2, -size / 2, size, size);
      }

      context.restore();
    }

    for (let index = this.floatingScores.length - 1; index >= 0; index -= 1) {
      const floatingScore = this.floatingScores[index];
      const elapsed = now - floatingScore.bornAt;

      if (elapsed >= floatingScore.ttl) {
        this.floatingScores.splice(index, 1);
        continue;
      }

      const progress = elapsed / floatingScore.ttl;
      context.save();
      context.globalAlpha = 1 - progress;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `700 ${26 + (1 - progress) * 8}px "Microsoft YaHei UI", sans-serif`;
      context.fillStyle = '#ffe59a';
      context.strokeStyle = 'rgba(11, 27, 45, 0.9)';
      context.lineWidth = 4;
      const y = floatingScore.y - progress * 84;
      context.strokeText(floatingScore.text, floatingScore.x, y);
      context.fillText(floatingScore.text, floatingScore.x, y);
      context.restore();
    }
  }

  private drawPreview(nextType: TetrominoType | null): void {
    const context = this.previewContext;
    context.clearRect(0, 0, this.previewWidthPx, this.previewHeightPx);
    context.fillStyle = 'rgba(6, 14, 24, 0.96)';
    context.fillRect(0, 0, this.previewWidthPx, this.previewHeightPx);

    if (!nextType) {
      return;
    }

    const matrix = getTetrominoMatrix(nextType, 0);
    const occupied = matrix.flatMap((row, y) =>
      row.flatMap((value, x) => (value ? [{ x, y }] : [])),
    );

    const minX = Math.min(...occupied.map((cell) => cell.x));
    const maxX = Math.max(...occupied.map((cell) => cell.x));
    const minY = Math.min(...occupied.map((cell) => cell.y));
    const maxY = Math.max(...occupied.map((cell) => cell.y));
    const shapeWidth = maxX - minX + 1;
    const shapeHeight = maxY - minY + 1;
    const previewCellSize = 28;
    const offsetX =
      (this.previewWidthPx - shapeWidth * previewCellSize) / 2 - minX * previewCellSize;
    const offsetY =
      (this.previewHeightPx - shapeHeight * previewCellSize) / 2 - minY * previewCellSize;

    occupied.forEach((cell) => {
      const x = offsetX + cell.x * previewCellSize;
      const y = offsetY + cell.y * previewCellSize;
      const texture = this.textures.get(this.theme.pieceTextures[nextType]);

      context.save();
      drawRoundedRect(context, x, y, previewCellSize - 4, previewCellSize - 4, 8);
      context.clip();
      context.fillStyle = 'rgba(20, 36, 54, 0.94)';
      context.fillRect(x, y, previewCellSize - 4, previewCellSize - 4);

      if (texture) {
        context.drawImage(texture, x, y, previewCellSize - 4, previewCellSize - 4);
      } else {
        context.fillStyle = FALLBACK_COLORS[nextType];
        context.fillRect(x, y, previewCellSize - 4, previewCellSize - 4);
      }

      context.restore();
    });
  }
}
