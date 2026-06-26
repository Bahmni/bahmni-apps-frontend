import { Loading } from '@bahmni/design-system';
import {
  useTranslation,
  getEncountersAndVisitsForEOC,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { ReactNode, useMemo } from 'react';
import {
  ClinicalAppContext,
  EpisodeOfCare,
} from '../contexts/ClinicalAppContext';
import { usePatientVisit } from '../hooks/usePatientVisit';

interface ClinicalAppDataProviderProps {
  children: ReactNode;
  episodeUuids: string[];
  patientId: string | null;
}

export const ClinicalAppProvider: React.FC<ClinicalAppDataProviderProps> = ({
  children,
  episodeUuids,
  patientId,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    data: episodeOfCareData,
    isLoading: isLoadingEncounters,
    error,
  } = useQuery({
    queryKey: ['encounters-for-eoc', episodeUuids],
    queryFn: () => getEncountersAndVisitsForEOC(episodeUuids),
    enabled: episodeUuids.length > 0,
  });

  const { activeVisit } = usePatientVisit(patientId);

  useSubscribeConsultationSaved(() => {
    if (episodeUuids.length > 0) {
      queryClient.invalidateQueries({
        queryKey: ['encounters-for-eoc', episodeUuids],
      });
    }
  }, [episodeUuids, queryClient]);

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

    const activeEpisodeId = episodeUuids.length > 0 ? episodeUuids[0] : null;
    const activeVisitId = activeVisit?.id ?? null;

    return {
      episodeOfCare,
      visit: [],
      encounter: [],
      isLoading: isLoadingEncounters,
      error: error,
      patientId,
      activeVisitId,
      activeEpisodeId,
    };
  }, [
    episodeOfCareData,
    episodeUuids,
    isLoadingEncounters,
    error,
    patientId,
    activeVisit?.id,
  ]);

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
