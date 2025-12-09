import { Loading } from '@bahmni/design-system';
import { useTranslation, getEncountersAndVisitsForEOC } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { ReactNode, useMemo } from 'react';
import {
  ClinicalAppContext,
  EpisodeOfCare,
} from '../contexts/ClinicalAppContext';

interface ClinicalAppDataProviderProps {
  children: ReactNode;
  episodeUuids: string[];
}

export const ClinicalAppProvider: React.FC<ClinicalAppDataProviderProps> = ({
  children,
  episodeUuids,
}) => {
  const { t } = useTranslation();
  const {
    data: episodeOfCareData,
    isLoading: isLoadingEncounters,
    error,
  } = useQuery({
    queryKey: ['encounters-for-eoc', episodeUuids],
    queryFn: () => getEncountersAndVisitsForEOC(episodeUuids),
    enabled: episodeUuids.length > 0,
  });

  const value = useMemo(() => {
    const episodeOfCare: EpisodeOfCare[] = [];

    if (episodeOfCareData && episodeUuids.length > 0) {
      episodeUuids.forEach((episodeUuid) => {
        episodeOfCare.push({
          uuid: episodeUuid,
          encounterUuids: episodeOfCareData.encounterUuids ?? [],
          visitUuids: episodeOfCareData.visitUuids ?? [],
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
  }, [episodeOfCareData, episodeUuids, isLoadingEncounters, error]);

  if (isLoadingEncounters && episodeUuids.length > 0) {
    return <Loading description={t('LOADING_CLINICAL_DATA')} role="status" />;
  }

  if (error)
    return (
      <div className="alert alert-danger">
        {t('ERROR_FETCHING_CLINICAL_DATA')}
      </div>
    );

  return (
    <ClinicalAppContext.Provider value={value}>
      {children}
    </ClinicalAppContext.Provider>
  );
};

ClinicalAppProvider.displayName = 'clinical apps provider';
