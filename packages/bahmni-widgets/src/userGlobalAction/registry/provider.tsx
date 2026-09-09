import React, {
  ReactNode,
  useRef,
  useMemo,
  useCallback,
  useState,
} from 'react';
import { UserAction } from '../models';
import { UserActionContext } from './context';

const validateAction = (action: UserAction) => {
  if (!action.id || typeof action.id !== 'string') {
    throw new Error('Action id must be a non-empty string');
  }
  if (!action.label || typeof action.label !== 'string') {
    throw new Error('Action label must be a non-empty string');
  }
  if (typeof action.onClick !== 'function') {
    throw new TypeError('Action onClick must be a function');
  }
};

interface UserActionProviderProps {
  children: ReactNode;
}

export const UserActionProvider: React.FC<UserActionProviderProps> = ({
  children,
}) => {
  const registryRef = useRef<Map<string, UserAction>>(new Map());
  const [version, setVersion] = useState<number>(0);

  const registerAction = useCallback((action: UserAction) => {
    validateAction(action);
    const existing = registryRef.current.get(action.id);
    if (existing !== action) {
      registryRef.current.set(action.id, action);
      setVersion((prev) => prev + 1);
    }
  }, []);

  const unregisterAction = useCallback((id: string) => {
    registryRef.current.delete(id);
    setVersion((prev) => prev + 1);
  }, []);

  const getActions = useCallback((): UserAction[] => {
    return Array.from(registryRef.current.values()).sort(
      (a, b) => (a.priority ?? 999) - (b.priority ?? 999),
    );
  }, []);

  const clear = useCallback(() => {
    registryRef.current.clear();
    setVersion((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({
      registerAction,
      unregisterAction,
      getActions,
      clear,
      version,
    }),
    [registerAction, unregisterAction, getActions, clear, version],
  );

  return (
    <UserActionContext.Provider value={value}>
      {children}
    </UserActionContext.Provider>
  );
};

UserActionProvider.displayName = 'UserActionProvider';
