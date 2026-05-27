import { Loading } from '@bahmni/design-system';
import {
  BAHMNI_USER_COOKIE_NAME,
  LOGIN_PATH,
  checkSession,
  getCookieByName,
} from '@bahmni/services';
import React, { ReactNode, useEffect, useState } from 'react';

interface SessionGateProps {
  children: ReactNode;
}

const redirectToLogin = () => {
  window.location.replace(LOGIN_PATH);
};

export const SessionGate: React.FC<SessionGateProps> = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Fail-secure synchronous check: if the bahmni.user cookie is missing the
    // user has logged out (here or in another tab) or never logged in. Skip
    // the network round-trip and redirect immediately.
    if (!getCookieByName(BAHMNI_USER_COOKIE_NAME)) {
      redirectToLogin();
      return;
    }

    const verifySession = async () => {
      const authenticated = await checkSession();
      if (!mounted) return;
      if (!authenticated) {
        redirectToLogin();
        return;
      }
      setReady(true);
    };
    verifySession();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return <Loading />;
  }

  return <>{children}</>;
};

SessionGate.displayName = 'SessionGate';
