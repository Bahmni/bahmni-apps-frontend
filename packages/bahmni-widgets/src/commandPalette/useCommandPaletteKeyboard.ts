import { useEffect, useRef } from 'react';
import { type TriggerConfig } from './models';
import { DEFAULT_DOUBLE_INTERVAL, matchesKeys } from './utils';

export function useCommandPaletteKeyboard(
  isOpen: boolean,
  toggle: () => void,
  trigger: TriggerConfig,
): void {
  const lastPressTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        toggle();
        return;
      }

      if (trigger.type === 'combination') {
        const hasModifier = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
        if (hasModifier && matchesKeys(e, trigger.keys)) {
          e.preventDefault();
          toggle();
        }
      } else if (trigger.type === 'double') {
        const active = document.activeElement;
        const isTyping =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLSelectElement ||
          (active as HTMLElement)?.isContentEditable;

        if (matchesKeys(e, trigger.keys) && !isTyping) {
          const now = Date.now();
          const interval = trigger.interval ?? DEFAULT_DOUBLE_INTERVAL;
          if (now - lastPressTimeRef.current <= interval) {
            e.preventDefault();
            toggle();
            lastPressTimeRef.current = 0;
          } else {
            lastPressTimeRef.current = now;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, trigger]);
}
