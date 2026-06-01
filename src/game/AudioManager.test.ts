import { AudioManager } from './AudioManager';

describe('AudioManager', () => {
  it('keeps the provided initial playlist and selects the first track', () => {
    const audioManager = new AudioManager(
      {
        bgm: '/bgm/default.mp3',
      },
      [
        {
          id: 'track-a',
          label: 'Track A',
          src: '/bgm/a.mp3',
          source: 'builtin',
        },
      ],
    );

    const state = audioManager.getState();

    expect(state.tracks).toHaveLength(1);
    expect(state.currentTrackId).toBe('track-a');
  });

  it('falls back to manifest bgm when no playlist is provided', () => {
    const audioManager = new AudioManager({
      bgm: '/bgm/default.mp3',
    });

    const state = audioManager.getState();

    expect(state.tracks).toHaveLength(1);
    expect(state.currentTrackId).toBe('default-bgm');
    expect(state.tracks[0]?.src).toBe('/bgm/default.mp3');
  });
});
