import { useCallback, useEffect, useRef } from 'react';

const GUARD_STATE_KEY = 'unsavedChangesGuard';

const isOnGuardEntry = () =>
  !!(window.history.state as Record<string, unknown> | null)?.[GUARD_STATE_KEY];

const pushGuardEntry = () =>
  window.history.pushState(
    { ...window.history.state, [GUARD_STATE_KEY]: true },
    '',
  );

/**
 * Keeps the user on the page while there are unsaved changes.
 *
 * - Browser Back: the app uses a plain BrowserRouter, so react-router's useBlocker is not
 *   available. Instead a duplicate history entry is pushed while the form is dirty; pressing
 *   Back pops that entry (same URL, page stays mounted) and `onBrowserBack` is called.
 * - Reload, tab close and full-page links: the browser's native beforeunload prompt.
 *
 * Call the returned `leave` to navigate away on purpose. It disarms both guards first and
 * removes the extra history entry, so the user does not need to press Back twice later.
 */
export const useUnsavedChangesGuard = (
  isDirty: boolean,
  onBrowserBack: () => void,
) => {
  const isLeavingRef = useRef(false);
  const onBrowserBackRef = useRef(onBrowserBack);
  onBrowserBackRef.current = onBrowserBack;

  useEffect(() => {
    if (!isDirty) return;

    const confirmUnload = (event: BeforeUnloadEvent) => {
      if (isLeavingRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    const handlePopState = () => {
      if (isLeavingRef.current) return;
      // Back consumed the guard entry; put it back so a second Back is caught too.
      pushGuardEntry();
      onBrowserBackRef.current();
    };

    if (!isOnGuardEntry()) pushGuardEntry();
    window.addEventListener('beforeunload', confirmUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', confirmUnload);
      window.removeEventListener('popstate', handlePopState);
      // Form went back to pristine while staying on the page: drop the guard entry.
      if (!isLeavingRef.current && isOnGuardEntry()) window.history.back();
    };
  }, [isDirty]);

  /**
   * `navigateAway` receives whether a guard entry is on top of the history stack, so the
   * caller can replace it rather than stacking a new entry above it.
   */
  const leave = useCallback((navigateAway: (hasGuard: boolean) => void) => {
    isLeavingRef.current = true;
    navigateAway(isOnGuardEntry());
  }, []);

  return { leave };
};
