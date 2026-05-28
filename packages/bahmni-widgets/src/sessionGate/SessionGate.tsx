import { Loading } from '@bahmni/design-system';
import {
  BAHMNI_USER_COOKIE_NAME,
  LOGIN_PATH,
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
    if (!getCookieByName(BAHMNI_USER_COOKIE_NAME)) {
      redirectToLogin();
      return;
    }
    setReady(true);
  }, []);

  if (!ready) {
    return <Loading />;
  }

  return <>{children}</>;
};

SessionGate.displayName = 'SessionGate';
