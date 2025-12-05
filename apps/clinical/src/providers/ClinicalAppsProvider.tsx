import { Loading } from '@bahmni/design-system';
import { getEncountersForEOC, useTranslation } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { ReactNode, useMemo } from 'react';
import {
  ClinicalAppsContext,
  EpisodeOfCare,
} from '../contexts/ClinicalAppsContext';

interface ClinicalAppsDataProviderProps {
  children: ReactNode;
  episodeIds: string[];
}

export const ClinicalAppsProvider: React.FC<ClinicalAppsDataProviderProps> = ({
  children,
  episodeIds,
}) => {
  const { t } = useTranslation();
  const {
    data: episodeOfCareData,
    isLoading: isLoadingEncounters,
    error,
  } = useQuery({
    queryKey: ['encounters-for-eoc', episodeIds],
    queryFn: () => getEncountersForEOC(episodeIds),
    enabled: episodeIds.length > 0,
  });

  const value = useMemo(() => {
    const episodeOfCare: EpisodeOfCare[] = [];

    if (episodeOfCareData && episodeIds.length > 0) {
      episodeIds.forEach((episodeId) => {
        episodeOfCare.push({
          uuid: episodeId,
          encounterIds: episodeOfCareData.encounterIds || [],
          visitIds: episodeOfCareData.visitIds || [],
        });
      });
    }

    return {
      episodeOfCare,
      visit: [],
      encounter: [],
      isLoading: isLoadingEncounters,
      error: error as Error | null,
    };
  }, [episodeOfCareData, episodeIds, isLoadingEncounters, error]);

  if (isLoadingEncounters && episodeIds.length > 0) {
    return <Loading description={t('LOADING_CLINICAL_DATA')} role="status" />;
  }

  return (
    <ClinicalAppsContext.Provider value={value}>
      {children}
    </ClinicalAppsContext.Provider>
  );
};

ClinicalAppsProvider.displayName = 'clinical apps provider';
