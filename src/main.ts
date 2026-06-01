import { DEFAULT_GAME_CONFIG } from './config/gameConfig';
import {
  DEFAULT_AUDIO_MANIFEST,
  DEFAULT_BGM_LIBRARY,
  DEFAULT_THEME,
} from './config/theme';
import {
  AudioManager,
  type AudioState,
  type AudioTrack,
} from './game/AudioManager';
import { Game } from './game/Game';
import { InputController } from './game/InputController';
import { Renderer } from './game/Renderer';
import type { GameSnapshot, GameState, GameStats } from './game/types';
import './styles/main.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root was not found.');
}

app.innerHTML = `
  <main class="app-shell">
    <section class="game-shell">
      <header class="hero-panel">
        <div class="hero-copy">
          <span class="eyebrow">Guard Special Theme</span>
          <h1>何忆卫！</h1>
          <p>卫戍和音律双重ed，于是鄙人就这么搓了一个小俄罗斯方块，总之，玩得开心！</p>
        </div>

        <div class="session-actions">
          <button class="action-button action-pill" type="button" data-action="start" id="start-button">开始</button>
          <button class="action-button action-pill secondary" type="button" data-action="togglePause" id="pause-button">暂停</button>
          <button class="action-button action-pill secondary" type="button" data-action="restart" id="restart-button">重开</button>
        </div>
      </header>

      <section class="playfield-shell" id="playfield-shell" aria-label="游戏页面组">
        <div class="playfield-stack">
          <section class="board-topbar" aria-label="游戏信息">
            <div class="stats-row">
              <article class="stat-card">
                <span>分数</span>
                <strong id="score">0</strong>
              </article>
              <article class="stat-card">
                <span>等级</span>
                <strong id="level">1</strong>
              </article>
              <article class="stat-card">
                <span>消除行数</span>
                <strong id="lines">0</strong>
              </article>
            </div>

            <section class="next-piece-card">
              <div class="next-piece-copy">
                <span>下一个方块</span>
              </div>
              <canvas class="preview-canvas" id="preview" aria-label="下一个方块"></canvas>
            </section>
          </section>

          <section class="board-stage" id="board-stage">
            <div class="board-wrap">
              <canvas class="board-canvas" id="board" aria-label="游戏棋盘"></canvas>
              <div class="board-overlay visible" id="overlay">
                <div class="overlay-card">
                  <h2 id="overlay-title">准备开局</h2>
                  <p id="overlay-copy">点击开始后会播放背景音乐。双击棋盘或切出窗口时，游戏会自动暂停。</p>
                </div>
              </div>
              <button
                class="playfield-expand-button"
                type="button"
                id="maximize-button"
                aria-label="最大化游戏区"
                title="最大化游戏区"
              >
                <svg viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M12 5H5v7" />
                  <path d="M5 5l10 10" />
                  <path d="M20 27h7v-7" />
                  <path d="M27 27L17 17" />
                </svg>
              </button>
            </div>
          </section>

          <section class="controller-panel" aria-label="屏幕控制按钮">
            <button class="control-button" type="button" data-action="moveLeft" aria-label="左移" title="左移">
              <span aria-hidden="true">←</span>
            </button>
            <button class="control-button" type="button" data-action="rotateCW" aria-label="旋转" title="旋转">
              <span aria-hidden="true">↻</span>
            </button>
            <button class="control-button" type="button" data-action="moveRight" aria-label="右移" title="右移">
              <span aria-hidden="true">→</span>
            </button>
            <button class="control-button" type="button" data-action="softDropStart" aria-label="软降" title="软降">
              <span aria-hidden="true">↓</span>
            </button>
            <button class="control-button hard-drop" type="button" data-action="hardDrop" aria-label="硬降" title="硬降">
              <span aria-hidden="true">⇊</span>
            </button>
          </section>
        </div>
      </section>

      <section class="music-panel">
        <div class="panel-heading">
          <div>
            <h2>背景音乐</h2>
            <p id="track-status">当前曲目：未选择</p>
          </div>
          <div class="music-imports">
            <button class="action-button secondary action-pill" type="button" id="import-folder-button">导入文件夹</button>
            <button class="action-button secondary action-pill" type="button" id="import-files-button">导入音频</button>
          </div>
        </div>

        <input id="music-folder-input" type="file" accept="audio/*" webkitdirectory multiple hidden />
        <input id="music-files-input" type="file" accept="audio/*" multiple hidden />

        <div class="music-grid">
          <label class="music-field">
            <span>曲目选择</span>
            <select id="track-select"></select>
          </label>

          <label class="music-field">
            <span>音量 <strong id="volume-value">45%</strong></span>
            <input id="volume-slider" type="range" min="0" max="100" step="1" value="45" />
          </label>
        </div>

        <p class="music-note" id="music-note">
          现在先内置一首 BGM。你也可以从本地导入一个音乐文件夹或多首音频，曲目会立刻出现在下拉列表里。
        </p>
      </section>

      <section class="notes-panel">
        <div class="panel-heading notes-heading">
          <div>
            <h2>版本说明与操作提示</h2>
            <p>下面这块可以滚动查看，手机端也会放在游戏区下方。</p>
          </div>
        </div>

        <div class="notes-scroll">
          <ul class="guide-list">
            <li>不同形状的方块仍然固定对应不同表情图，未来换皮只需要改配置，不用改玩法。</li>
            <li>键盘操作：← → 移动，↑ / X 旋转，↓ 软降，Space 硬降，P 暂停，R 重开。</li>
            <li>软降现在会立刻给你一个下压反馈，并持续加快下落，但不会直接触底。</li>
            <li>双击棋盘会自动暂停；切出窗口或页面失焦时，电脑端和移动端都会自动暂停。</li>
            <li>清行后会有礼花式表情包特效和浮动加分文本，消除行数越多，爆发越大。</li>
            <li>点击“最大化”会把分数区、预览区、棋盘和控制键聚焦成一个页面组，方便在电脑和手机上沉浸游玩。</li>
          </ul>
        </div>
      </section>
    </section>
  </main>
`;

const boardCanvas = document.querySelector<HTMLCanvasElement>('#board');
const previewCanvas = document.querySelector<HTMLCanvasElement>('#preview');
const overlay = document.querySelector<HTMLDivElement>('#overlay');
const overlayTitle = document.querySelector<HTMLHeadingElement>('#overlay-title');
const overlayCopy = document.querySelector<HTMLParagraphElement>('#overlay-copy');
const pauseButton = document.querySelector<HTMLButtonElement>('#pause-button');
const scoreNode = document.querySelector<HTMLElement>('#score');
const levelNode = document.querySelector<HTMLElement>('#level');
const linesNode = document.querySelector<HTMLElement>('#lines');
const boardStage = document.querySelector<HTMLDivElement>('#board-stage');
const playfieldShell = document.querySelector<HTMLElement>('#playfield-shell');
const maximizeButton = document.querySelector<HTMLButtonElement>('#maximize-button');
const trackStatus = document.querySelector<HTMLElement>('#track-status');
const trackSelect = document.querySelector<HTMLSelectElement>('#track-select');
const volumeSlider = document.querySelector<HTMLInputElement>('#volume-slider');
const volumeValue = document.querySelector<HTMLElement>('#volume-value');
const musicNote = document.querySelector<HTMLElement>('#music-note');
const importFolderButton = document.querySelector<HTMLButtonElement>('#import-folder-button');
const importFilesButton = document.querySelector<HTMLButtonElement>('#import-files-button');
const musicFolderInput = document.querySelector<HTMLInputElement>('#music-folder-input');
const musicFilesInput = document.querySelector<HTMLInputElement>('#music-files-input');

if (
  !boardCanvas ||
  !previewCanvas ||
  !overlay ||
  !overlayTitle ||
  !overlayCopy ||
  !pauseButton ||
  !scoreNode ||
  !levelNode ||
  !linesNode ||
  !boardStage ||
  !playfieldShell ||
  !maximizeButton ||
  !trackStatus ||
  !trackSelect ||
  !volumeSlider ||
  !volumeValue ||
  !musicNote ||
  !importFolderButton ||
  !importFilesButton ||
  !musicFolderInput ||
  !musicFilesInput
) {
  throw new Error('Game UI did not mount correctly.');
}

let game!: Game;
let audioManager!: AudioManager;
let renderer!: Renderer;
let inputController!: InputController;

const updateOverlay = (state: GameState, snapshot: GameSnapshot): void => {
  const states: Record<GameState, { title: string; copy: string; visible: boolean }> = {
    idle: {
      title: '准备开局',
      copy: '点击开始后会播放背景音乐。双击棋盘或切出窗口时，游戏会自动暂停。',
      visible: true,
    },
    running: {
      title: '',
      copy: '',
      visible: false,
    },
    paused: {
      title: '已暂停',
      copy: '按 P、点继续，或者重新聚焦页面后再接着搓。',
      visible: true,
    },
    clearing: {
      title: '',
      copy: '',
      visible: false,
    },
    gameover: {
      title: '游戏结束',
      copy: `最终分数 ${snapshot.stats.score} 分，共消除 ${snapshot.stats.lines} 行。按 R 或点重开马上再来。`,
      visible: true,
    },
  };

  const view = states[state];
  overlay.classList.toggle('visible', view.visible);
  overlayTitle.textContent = view.title;
  overlayCopy.textContent = view.copy;
  pauseButton.textContent = state === 'paused' ? '继续' : '暂停';
};

const updateStats = (stats: GameStats): void => {
  scoreNode.textContent = String(stats.score);
  levelNode.textContent = String(stats.level);
  linesNode.textContent = String(stats.lines);
};

const syncTrackSelectOptions = (state: AudioState): void => {
  while (trackSelect.firstChild) {
    trackSelect.removeChild(trackSelect.firstChild);
  }

  state.tracks.forEach((track) => {
    const option = document.createElement('option');
    option.value = track.id;
    option.textContent =
      track.source === 'builtin' ? `内置 · ${track.label}` : `本地 · ${track.label}`;
    trackSelect.appendChild(option);
  });
};

const updateAudioUi = (state: AudioState): void => {
  const selectedTrack = state.tracks.find((track) => track.id === state.currentTrackId) ?? null;
  const importedCount = state.tracks.filter((track) => track.source === 'imported').length;

  syncTrackSelectOptions(state);
  trackSelect.value = state.currentTrackId ?? '';
  volumeSlider.value = String(Math.round(state.volume * 100));
  volumeValue.textContent = `${Math.round(state.volume * 100)}%`;
  trackStatus.textContent = selectedTrack
    ? `当前曲目：${selectedTrack.label}`
    : '当前曲目：未选择';
  musicNote.textContent =
    importedCount > 0
      ? `已导入 ${importedCount} 首本地音乐。未来网页版可以把常用 BGM 直接内置在这里。`
      : '现在先内置一首 BGM。你也可以从本地导入一个音乐文件夹或多首音频，曲目会立刻出现在下拉列表里。';
};

const bindAudioUi = (): void => {
  audioManager.subscribe((state) => {
    try {
      updateAudioUi(state);
    } catch (error) {
      console.warn('Audio UI update failed, but the game can continue running.', error);
      trackStatus.textContent = '当前曲目：界面刷新失败';
    }
  });
};

const bindGameControls = (): void => {
  inputController = new InputController(DEFAULT_GAME_CONFIG, (action) => {
    switch (action) {
      case 'start':
        game.start();
        break;
      case 'togglePause':
        game.togglePause();
        break;
      case 'restart':
        game.restart();
        break;
      case 'moveLeft':
        game.moveLeft();
        break;
      case 'moveRight':
        game.moveRight();
        break;
      case 'rotateCW':
        game.rotateClockwise();
        break;
      case 'softDropStart':
        game.setSoftDrop(true);
        break;
      case 'softDropEnd':
        game.setSoftDrop(false);
        break;
      case 'hardDrop':
        game.hardDrop();
        break;
      default:
        break;
    }
  });

  inputController.bindButtons(
    Array.from(document.querySelectorAll<HTMLElement>('[data-action]')),
  );
};

const initializeGame = (): void => {
  audioManager = new AudioManager(
    DEFAULT_AUDIO_MANIFEST,
    DEFAULT_BGM_LIBRARY.map<AudioTrack>((track) => ({
      ...track,
      source: 'builtin',
    })),
  );

  renderer = new Renderer({
    boardCanvas,
    previewCanvas,
    theme: DEFAULT_THEME,
    boardWidth: DEFAULT_GAME_CONFIG.boardWidth,
    boardHeight: DEFAULT_GAME_CONFIG.boardHeight,
    cellPixelSize: 44,
  });

  game = new Game({
    config: DEFAULT_GAME_CONFIG,
    renderer,
    audioManager,
    hooks: {
      onSnapshot: (snapshot) => {
        updateOverlay(snapshot.state, snapshot);
      },
      onStatsChange: (stats) => {
        updateStats(stats);
      },
      onLineClear: (event) => {
        renderer.celebrateLineClear(event);
      },
    },
  });

  bindAudioUi();
  bindGameControls();
};

initializeGame();

trackSelect.addEventListener('change', () => {
  audioManager.selectTrack(trackSelect.value);
});

volumeSlider.addEventListener('input', () => {
  audioManager.setVolume(Number(volumeSlider.value) / 100);
});

importFolderButton.addEventListener('click', () => {
  musicFolderInput.click();
});

importFilesButton.addEventListener('click', () => {
  musicFilesInput.click();
});

const importFiles = (files: FileList | null): void => {
  if (!files) {
    return;
  }

  const addedCount = audioManager.addImportedTracks(Array.from(files));

  if (addedCount === 0) {
    musicNote.textContent = '这次没有识别到新的音频文件，可以再试试 mp3、wav、ogg 或 m4a。';
  }
};

musicFolderInput.addEventListener('change', () => {
  importFiles(musicFolderInput.files);
  musicFolderInput.value = '';
});

musicFilesInput.addEventListener('change', () => {
  importFiles(musicFilesInput.files);
  musicFilesInput.value = '';
});

const pauseFromSystem = (): void => {
  game.pause();
};

const handleBoardStagePress = (target: EventTarget | null): void => {
  if (target instanceof Node && maximizeButton.contains(target)) {
    return;
  }

  const state = game.getState();

  if (state === 'gameover') {
    game.restart();
    return;
  }

  if (state === 'running' || state === 'clearing') {
    game.pause();
    return;
  }

  if (state === 'paused' || state === 'idle') {
    game.start();
  }
};

let fallbackMaximized = false;

const updateMaximizeButton = (): void => {
  const active = document.fullscreenElement === playfieldShell || fallbackMaximized;
  playfieldShell.classList.toggle('is-maximized', active);
  maximizeButton.classList.toggle('is-active', active);
  maximizeButton.setAttribute('aria-label', active ? '退出聚焦游戏区' : '最大化游戏区');
  maximizeButton.setAttribute('title', active ? '退出聚焦游戏区' : '最大化游戏区');
};

const togglePlayfieldMaximize = async (): Promise<void> => {
  if (fallbackMaximized) {
    fallbackMaximized = false;
    updateMaximizeButton();
    return;
  }

  if (document.fullscreenElement === playfieldShell) {
    await document.exitFullscreen();
    return;
  }

  if (document.fullscreenElement && document.exitFullscreen) {
    await document.exitFullscreen();
  }

  if (document.fullscreenEnabled && playfieldShell.requestFullscreen) {
    try {
      await playfieldShell.requestFullscreen();
      return;
    } catch {
      fallbackMaximized = !fallbackMaximized;
      updateMaximizeButton();
      return;
    }
  }

  fallbackMaximized = !fallbackMaximized;
  updateMaximizeButton();
};

maximizeButton.addEventListener('click', () => {
  void togglePlayfieldMaximize();
});

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement !== playfieldShell) {
    fallbackMaximized = false;
  }

  updateMaximizeButton();
});

window.addEventListener('blur', pauseFromSystem);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseFromSystem();
  }
});

boardStage.addEventListener('click', (event) => {
  handleBoardStagePress(event.target);
});

renderer.ready.finally(() => {
  const snapshot = game.getSnapshot();
  updateStats(snapshot.stats);
  updateOverlay(snapshot.state, snapshot);
  updateMaximizeButton();
  game.startLoop();
});

window.addEventListener('beforeunload', () => {
  inputController.destroy();
  audioManager.destroy();
  game.stopLoop();
});
