import type { AudioManifest } from '../config/theme';
import type { AudioManagerLike } from './types';

export type EffectName = 'move' | 'rotate' | 'drop' | 'clear' | 'gameover';
export type AudioTrackSource = 'builtin' | 'imported';

export interface AudioTrack {
  id: string;
  label: string;
  src: string;
  source: AudioTrackSource;
}

export interface AudioState {
  currentTrackId: string | null;
  tracks: AudioTrack[];
  volume: number;
}

type AudioStateListener = (state: AudioState) => void;

const AUDIO_FILE_PATTERN = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;

const stripFileExtension = (fileName: string): string =>
  fileName.replace(/\.[^/.]+$/, '');

export class AudioManager implements AudioManagerLike {
  private readonly manifest: AudioManifest;
  private readonly listeners = new Set<AudioStateListener>();
  private readonly importedTrackIds = new Set<string>();
  private tracks: AudioTrack[];
  private bgm: HTMLAudioElement | null = null;
  private currentTrackId: string | null;
  private volume = 0.45;
  private bgmShouldBePlaying = false;

  constructor(manifest: AudioManifest, initialTracks: AudioTrack[] = []) {
    this.manifest = manifest;
    this.tracks =
      initialTracks.length > 0
        ? [...initialTracks]
        : manifest.bgm
          ? [
              {
                id: 'default-bgm',
                label: '默认 BGM',
                src: manifest.bgm,
                source: 'builtin',
              },
            ]
          : [];
    this.currentTrackId = this.tracks[0]?.id ?? null;
  }

  subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AudioState {
    return {
      currentTrackId: this.currentTrackId,
      tracks: [...this.tracks],
      volume: this.volume,
    };
  }

  getVolume(): number {
    return this.volume;
  }

  setVolume(nextVolume: number): void {
    this.volume = Math.min(1, Math.max(0, nextVolume));

    if (this.bgm) {
      this.bgm.volume = this.volume;
    }

    this.emitState();
  }

  selectTrack(trackId: string): void {
    if (!this.tracks.some((track) => track.id === trackId)) {
      return;
    }

    this.currentTrackId = trackId;

    if (this.bgmShouldBePlaying) {
      this.startBgm();
    } else {
      this.replaceBgmElement();
    }

    this.emitState();
  }

  addImportedTracks(files: Iterable<File>): number {
    let addedCount = 0;

    Array.from(files)
      .filter((file) => file.type.startsWith('audio/') || AUDIO_FILE_PATTERN.test(file.name))
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
      .forEach((file) => {
        const trackId = `imported:${file.name}:${file.size}:${file.lastModified}`;

        if (this.importedTrackIds.has(trackId)) {
          return;
        }

        this.importedTrackIds.add(trackId);
        this.tracks.push({
          id: trackId,
          label: stripFileExtension(file.name),
          src: URL.createObjectURL(file),
          source: 'imported',
        });
        addedCount += 1;
      });

    if (!this.currentTrackId && this.tracks.length > 0) {
      this.currentTrackId = this.tracks[0].id;
    }

    if (addedCount > 0) {
      this.emitState();
    }

    return addedCount;
  }

  startBgm(): void {
    this.bgmShouldBePlaying = true;
    const track = this.getCurrentTrack();

    if (!track) {
      return;
    }

    if (!this.bgm || this.bgm.dataset.trackId !== track.id) {
      this.replaceBgmElement();
    } else {
      this.bgm.currentTime = 0;
    }

    if (!this.bgm) {
      return;
    }

    this.bgm.volume = this.volume;
    void this.safePlay(this.bgm);
  }

  stopBgm(): void {
    this.bgmShouldBePlaying = false;

    if (!this.bgm) {
      return;
    }

    this.bgm.pause();
    this.bgm.currentTime = 0;
  }

  pauseBgm(): void {
    this.bgmShouldBePlaying = false;
    this.bgm?.pause();
  }

  resumeBgm(): void {
    this.bgmShouldBePlaying = true;
    const track = this.getCurrentTrack();

    if (!track) {
      return;
    }

    if (!this.bgm || this.bgm.dataset.trackId !== track.id) {
      this.replaceBgmElement();
    }

    if (!this.bgm) {
      return;
    }

    this.bgm.volume = this.volume;
    void this.safePlay(this.bgm);
  }

  play(effect: EffectName): void {
    const source = this.manifest[effect];

    if (!source) {
      return;
    }

    const sound = new Audio(source);
    sound.volume = effect === 'drop' ? 0.4 : 0.55;
    void this.safePlay(sound);
  }

  destroy(): void {
    this.bgm?.pause();
    this.bgm = null;
    this.listeners.clear();

    this.tracks.forEach((track) => {
      if (track.source === 'imported') {
        URL.revokeObjectURL(track.src);
      }
    });
  }

  private getCurrentTrack(): AudioTrack | null {
    if (!this.currentTrackId) {
      return null;
    }

    return this.tracks.find((track) => track.id === this.currentTrackId) ?? null;
  }

  private replaceBgmElement(): void {
    const track = this.getCurrentTrack();

    if (!track) {
      this.bgm?.pause();
      this.bgm = null;
      return;
    }

    this.bgm?.pause();
    const nextAudio = new Audio(track.src);
    nextAudio.loop = true;
    nextAudio.volume = this.volume;
    nextAudio.dataset.trackId = track.id;
    this.bgm = nextAudio;
  }

  private emitState(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  private async safePlay(audio: HTMLAudioElement): Promise<void> {
    try {
      await audio.play();
    } catch {
      // Optional audio assets are allowed to fail silently in v1.
    }
  }
}
