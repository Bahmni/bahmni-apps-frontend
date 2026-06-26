import { createContext, useContext } from 'react';
import { ExtensionConfigContextType } from './models';

export const ExtensionConfigContext = createContext<
  ExtensionConfigContextType | undefined
>(undefined);

export const useExtensionConfig = (): ExtensionConfigContextType => {
  const context = useContext(ExtensionConfigContext);
  if (!context) {
    throw new Error(
      'useExtensionConfig must be used within an ExtensionConfigProvider',
    );
  }
  return context;
};
