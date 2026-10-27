import { getCurrentUser } from '@bahmni/services';
import { useEffect, useState } from 'react';

interface CurrentUserIdState {
  userId: string | null;
  loading: boolean;
}

/**
 * Resolves the logged-in user's uuid once on mount. There is no synchronous
 * current-user primitive in this codebase (getCurrentUser reads the
 * bahmni.user cookie, then round-trips to the OpenMRS REST API), so callers
 * that need to scope data (like AI chat conversations) to the current user
 * must wait for `loading` to settle before reading `userId`.
 */
export function useCurrentUserId(): CurrentUserIdState {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((user) => {
        if (!cancelled) setUserId(user?.uuid ?? null);
      })
      .catch(() => {
        if (!cancelled) setUserId(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { userId, loading };
}
