import React, { ReactNode, Suspense } from 'react';
import '@/i18n';
import { Loading } from '@carbon/react';

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> =
  React.memo(({ children }) => {
    return (
      <>
        <Suspense fallback={<Loading description="Loading..." />}>
          {children}
        </Suspense>
      </>
    );
  });

TranslationProvider.displayName = 'TranslationProvider';
