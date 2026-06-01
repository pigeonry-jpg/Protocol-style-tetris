import type { TetrominoType } from '../game/types';

export interface ThemePack {
  id: string;
  name: string;
  panelAccent: string;
  boardBackground: string;
  appBackground: string;
  pieceTextures: Record<TetrominoType, string>;
  reserveTexturePools: Record<string, string[]>;
  titleImage?: string;
  backgroundImage?: string;
}

export interface AudioManifest {
  bgm: string;
  move?: string;
  rotate?: string;
  drop?: string;
  clear?: string;
  gameover?: string;
}

export interface BuiltInBgmTrack {
  id: string;
  label: string;
  src: string;
}

const imageAssets = import.meta.glob('../../素材/方块图片/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const audioAssets = import.meta.glob('../../素材/BGM/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const publicAsset = (relativePath: string): string => `/assets/${relativePath}`;

const getImageAsset = (relativePath: string): string => {
  const asset = imageAssets[relativePath];

  if (!asset) {
    throw new Error(`Missing image asset: ${relativePath}`);
  }

  return asset;
};

const getAudioAsset = (relativePath: string): string => {
  const asset = audioAssets[relativePath];

  if (!asset) {
    throw new Error(`Missing audio asset: ${relativePath}`);
  }

  return asset;
};

const makePool = (paths: string[]): string[] => paths.map(getImageAsset);

const guardTextures = {
  I: getImageAsset('../../素材/方块图片/表情套组_卫戍专用_call.png'),
  O: getImageAsset('../../素材/方块图片/表情套组_卫戍专用_cooperate.png'),
  T: getImageAsset('../../素材/方块图片/表情套组_卫戍专用_happy.png'),
  S: getImageAsset('../../素材/方块图片/表情套组_卫戍专用_respect.png'),
  Z: getImageAsset('../../素材/方块图片/表情套组_卫戍专用_sorry.png'),
  J: getImageAsset('../../素材/方块图片/表情套组_卫戍专用_thinking.png'),
  L: getImageAsset('../../素材/方块图片/表情套组_卫戍专用_noproblem.png'),
} satisfies Record<TetrominoType, string>;

export const DEFAULT_THEME: ThemePack = {
  id: 'guard-special',
  name: '卫戍专用',
  panelAccent: '#79cfff',
  boardBackground: 'rgba(6, 17, 28, 0.9)',
  appBackground:
    'radial-gradient(circle at top, rgba(58, 113, 193, 0.42), rgba(5, 10, 18, 0.96) 54%)',
  pieceTextures: guardTextures,
  reserveTexturePools: {
    卫戍专用: makePool([
      '../../素材/方块图片/表情套组_卫戍专用_call.png',
      '../../素材/方块图片/表情套组_卫戍专用_cooperate.png',
      '../../素材/方块图片/表情套组_卫戍专用_cooperate_2.png',
      '../../素材/方块图片/表情套组_卫戍专用_dying.png',
      '../../素材/方块图片/表情套组_卫戍专用_happy.png',
      '../../素材/方块图片/表情套组_卫戍专用_noproblem.png',
      '../../素材/方块图片/表情套组_卫戍专用_playingcool.png',
      '../../素材/方块图片/表情套组_卫戍专用_respect.png',
      '../../素材/方块图片/表情套组_卫戍专用_sad.png',
      '../../素材/方块图片/表情套组_卫戍专用_scared.png',
      '../../素材/方块图片/表情套组_卫戍专用_sorry.png',
      '../../素材/方块图片/表情套组_卫戍专用_thanks.png',
      '../../素材/方块图片/表情套组_卫戍专用_thinking.png',
    ]),
    博士士: makePool([
      '../../素材/方块图片/表情套组_博士士_1.png',
      '../../素材/方块图片/表情套组_博士士_2.png',
      '../../素材/方块图片/表情套组_博士士_4.png',
      '../../素材/方块图片/表情套组_博士士_5.png',
      '../../素材/方块图片/表情套组_博士士_6.png',
      '../../素材/方块图片/表情套组_博士士_8.png',
    ]),
    米米子: makePool([
      '../../素材/方块图片/表情套组_米米子_1.png',
      '../../素材/方块图片/表情套组_米米子_2.png',
      '../../素材/方块图片/表情套组_米米子_3.png',
      '../../素材/方块图片/表情套组_米米子_4.png',
      '../../素材/方块图片/表情套组_米米子_5.png',
      '../../素材/方块图片/表情套组_米米子_6.png',
    ]),
    维维美: makePool([
      '../../素材/方块图片/表情套组_维维美_1.png',
      '../../素材/方块图片/表情套组_维维美_2.png',
      '../../素材/方块图片/表情套组_维维美_3.png',
      '../../素材/方块图片/表情套组_维维美_4.png',
      '../../素材/方块图片/表情套组_维维美_5.png',
      '../../素材/方块图片/表情套组_维维美_6.png',
    ]),
  },
};

export const DEFAULT_AUDIO_MANIFEST: AudioManifest = {
  bgm: getAudioAsset('../../素材/BGM/塞壬唱片-MSR; Erik Castro - Protocol.mp3'),
  move: publicAsset('audio/move.mp3'),
  rotate: publicAsset('audio/rotate.mp3'),
  drop: publicAsset('audio/drop.mp3'),
  clear: publicAsset('audio/clear.mp3'),
  gameover: publicAsset('audio/gameover.mp3'),
};

export const DEFAULT_BGM_LIBRARY: BuiltInBgmTrack[] = [
  {
    id: 'protocol',
    label: 'Protocol',
    src: DEFAULT_AUDIO_MANIFEST.bgm,
  },
];
