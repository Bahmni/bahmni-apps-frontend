import { Context, useContext } from 'react';

export function createConfigHook<TContextValue>(
  context: Context<TContextValue | undefined>,
  hookName: string,
  providerName: string,
): () => TContextValue {
  return () => {
    const ctx = useContext(context);
    if (!ctx) {
      throw new Error(`${hookName} must be used within a ${providerName}`);
    }
    return ctx;
  };
}
