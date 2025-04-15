import { useContext } from 'react';
import { ConfigContext } from '@contexts/ConfigContext';
import { ConfigContextType } from '@types/config';

/**
 * Custom hook to access the config context
 * @returns The config context values including config, loading state, and error
 */
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }

  return context;
};
