import { getEncountersForEOC } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { ReactNode, useMemo } from 'react';
import { EocContext } from '../contexts/EocContext';

interface EncounterDataProviderProps {
  children: ReactNode;
  episodeIds: string[];
}

export const EocProvider: React.FC<EncounterDataProviderProps> = ({
  children,
  episodeIds,
}) => {
  const {
    data: encountersData,
    isLoading: isLoadingEncounters,
    error,
  } = useQuery({
    queryKey: ['encounters-for-eoc', episodeIds],
    queryFn: () => getEncountersForEOC(episodeIds),
    enabled: episodeIds.length > 0,
  });

  const value = useMemo(
    () => ({
      eoc: encountersData ?? null,
      isLoadingEncounters,
      error: error as Error | null,
    }),
    [encountersData, isLoadingEncounters, error],
  );

  console.log('EOC Provider Value:', value);

  return <EocContext.Provider value={value}>{children}</EocContext.Provider>;
};

EocProvider.displayName = 'EocProvider';
