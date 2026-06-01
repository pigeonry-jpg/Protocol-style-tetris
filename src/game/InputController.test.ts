import { DEFAULT_GAME_CONFIG } from '../config/gameConfig';
import { InputController } from './InputController';

describe('InputController', () => {
  it('starts and ends soft drop from ArrowDown key events', () => {
    const listeners = new Map<string, (event: { code: string; key: string; repeat: boolean; preventDefault: () => void }) => void>();
    const fakeWindow = {
      addEventListener: (type: string, callback: EventListenerOrEventListenerObject) => {
        listeners.set(
          type,
          callback as unknown as (event: { code: string; key: string; repeat: boolean; preventDefault: () => void }) => void,
        );
      },
      removeEventListener: (type: string) => {
        listeners.delete(type);
      },
      clearTimeout,
      clearInterval,
      setTimeout,
      setInterval,
    };

    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: fakeWindow,
    });

    const actions: string[] = [];
    const controller = new InputController(DEFAULT_GAME_CONFIG, (action) => {
      actions.push(action);
    });

    listeners.get('keydown')?.({
      code: 'ArrowDown',
      key: 'ArrowDown',
      repeat: false,
      preventDefault: () => {},
    });

    listeners.get('keyup')?.({
      code: 'ArrowDown',
      key: 'ArrowDown',
      repeat: false,
      preventDefault: () => {},
    });

    controller.destroy();

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });

    expect(actions).toEqual(['softDropStart', 'softDropEnd']);
  });

  it('restarts from the R key even if only event.key is available', () => {
    const listeners = new Map<string, (event: { code: string; key: string; repeat: boolean; preventDefault: () => void }) => void>();
    const fakeWindow = {
      addEventListener: (type: string, callback: EventListenerOrEventListenerObject) => {
        listeners.set(
          type,
          callback as unknown as (event: { code: string; key: string; repeat: boolean; preventDefault: () => void }) => void,
        );
      },
      removeEventListener: (type: string) => {
        listeners.delete(type);
      },
      clearTimeout,
      clearInterval,
      setTimeout,
      setInterval,
    };

    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: fakeWindow,
    });

    const actions: string[] = [];
    const controller = new InputController(DEFAULT_GAME_CONFIG, (action) => {
      actions.push(action);
    });

    listeners.get('keydown')?.({
      code: '',
      key: 'r',
      repeat: false,
      preventDefault: () => {},
    });

    controller.destroy();

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });

    expect(actions).toEqual(['restart']);
  });
});
