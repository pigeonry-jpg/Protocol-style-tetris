import type { GameAction, GameConfig } from '../config/gameConfig';

type ActionHandler = (action: GameAction) => void;

const HOLD_START_DELAY_MS = 140;
const HOLD_REPEAT_MS = 55;

const isHoldAction = (action: GameAction): boolean =>
  action === 'moveLeft' || action === 'moveRight' || action === 'softDropStart';

const bindingToKey = (binding: string): string | null => {
  if (/^Key[A-Z]$/.test(binding)) {
    return binding.slice(3).toLowerCase();
  }

  if (binding === 'Space') {
    return ' ';
  }

  if (
    binding === 'ArrowLeft' ||
    binding === 'ArrowRight' ||
    binding === 'ArrowUp' ||
    binding === 'ArrowDown' ||
    binding === 'Enter'
  ) {
    return binding;
  }

  return null;
};

const normalizeEventKey = (key: string): string =>
  key.length === 1 ? key.toLowerCase() : key;

export class InputController {
  private readonly handler: ActionHandler;
  private readonly keyBindingsByCode: Map<string, GameAction> = new Map();
  private readonly keyBindingsByKey: Map<string, GameAction> = new Map();
  private readonly heldKeys = new Map<string, number>();
  private readonly buttonCleanup: Array<() => void> = [];

  constructor(config: GameConfig, handler: ActionHandler) {
    this.handler = handler;

    Object.entries(config.keyBindings).forEach(([action, codes]) => {
      if (action === 'softDropEnd') {
        return;
      }

      codes.forEach((code) => {
        const resolvedAction = action as GameAction;
        this.keyBindingsByCode.set(code, resolvedAction);

        const key = bindingToKey(code);

        if (key) {
          this.keyBindingsByKey.set(key, resolvedAction);
        }
      });
    });

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  bindButtons(buttons: HTMLElement[]): void {
    buttons.forEach((button) => {
      const action = button.dataset.action as GameAction | undefined;

      if (!action) {
        return;
      }

      if (action === 'softDropStart') {
        const onPointerDown = (event: Event) => {
          event.preventDefault();
          this.handler('softDropStart');
        };
        const onPointerUp = () => {
          this.handler('softDropEnd');
        };

        button.addEventListener('pointerdown', onPointerDown);
        button.addEventListener('pointerup', onPointerUp);
        button.addEventListener('pointerleave', onPointerUp);
        button.addEventListener('pointercancel', onPointerUp);
        this.buttonCleanup.push(() => {
          button.removeEventListener('pointerdown', onPointerDown);
          button.removeEventListener('pointerup', onPointerUp);
          button.removeEventListener('pointerleave', onPointerUp);
          button.removeEventListener('pointercancel', onPointerUp);
        });
        return;
      }

      if (isHoldAction(action)) {
        const onPointerDown = (event: Event) => {
          event.preventDefault();
          this.triggerHoldAction(`button:${action}`, action);
        };
        const onPointerUp = () => {
          this.clearHold(`button:${action}`);
        };

        button.addEventListener('pointerdown', onPointerDown);
        button.addEventListener('pointerup', onPointerUp);
        button.addEventListener('pointerleave', onPointerUp);
        button.addEventListener('pointercancel', onPointerUp);
        this.buttonCleanup.push(() => {
          button.removeEventListener('pointerdown', onPointerDown);
          button.removeEventListener('pointerup', onPointerUp);
          button.removeEventListener('pointerleave', onPointerUp);
          button.removeEventListener('pointercancel', onPointerUp);
        });
        return;
      }

      const onClick = (event: Event) => {
        event.preventDefault();
        this.handler(action);
      };

      button.addEventListener('click', onClick);
      this.buttonCleanup.push(() => {
        button.removeEventListener('click', onClick);
      });
    });
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.heldKeys.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.buttonCleanup.forEach((cleanup) => cleanup());
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const action = this.resolveAction(event);

    if (!action) {
      return;
    }

    if (
      action === 'moveLeft' ||
      action === 'moveRight' ||
      action === 'softDropStart' ||
      action === 'hardDrop' ||
      action === 'rotateCW'
    ) {
      event.preventDefault();
    }

    if (event.repeat && !isHoldAction(action)) {
      return;
    }

    if (action === 'softDropStart') {
      if (this.heldKeys.has(event.code)) {
        return;
      }

      this.heldKeys.set(event.code, 0);
      this.handler('softDropStart');
      return;
    }

    if (action === 'moveLeft' || action === 'moveRight') {
      if (this.heldKeys.has(event.code)) {
        return;
      }

      this.triggerHoldAction(event.code, action);
      return;
    }

    this.handler(action);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const action = this.resolveAction(event);

    if (!action) {
      return;
    }

    if (action === 'softDropStart') {
      this.heldKeys.delete(event.code);
      this.handler('softDropEnd');
      return;
    }

    this.clearHold(event.code);
  };

  private triggerHoldAction(key: string, action: GameAction): void {
    this.handler(action);

    const timeoutId = window.setTimeout(() => {
      const intervalId = window.setInterval(() => {
        this.handler(action);
      }, HOLD_REPEAT_MS);

      this.heldKeys.set(key, intervalId);
    }, HOLD_START_DELAY_MS);

    this.heldKeys.set(key, timeoutId);
  }

  private clearHold(key: string): void {
    const timeoutId = this.heldKeys.get(key);

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      window.clearInterval(timeoutId);
      this.heldKeys.delete(key);
    }
  }

  private resolveAction(event: KeyboardEvent): GameAction | undefined {
    return (
      this.keyBindingsByCode.get(event.code) ??
      this.keyBindingsByKey.get(normalizeEventKey(event.key))
    );
  }
}
