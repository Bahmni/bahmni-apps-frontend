import { Loading } from '@bahmni/design-system';
import {
  useTranslation,
  getEncountersAndVisitsForEOC,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQueries, useQueryClient } from '@tanstack/react-query';
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
  const episodeOfCareQueries = useQueries({
    queries: episodeUuids.map((episodeUuid) => ({
      queryKey: ['encounters-for-eoc', episodeUuid],
      queryFn: () => getEncountersAndVisitsForEOC([episodeUuid]),
      enabled: !!episodeUuid,
    })),
    combine: (results) => ({
      data: results.map((result, index) => ({
        uuid: episodeUuids[index],
        encounterUuids: result.data?.encounterUuids ?? [],
        visitUuids: result.data?.visitUuids ?? [],
      })),
      isLoading: results.some((result) => result.isLoading),
      error: results.find((result) => result.error)?.error ?? null,
    }),
  });

  const { activeVisit } = usePatientVisit(patientId);

  useSubscribeConsultationSaved(() => {
    episodeUuids.forEach((episodeUuid) => {
      queryClient.invalidateQueries({
        queryKey: ['encounters-for-eoc', episodeUuid],
      });
    });
  }, [episodeUuids, queryClient]);

  const clinicalContext = useMemo(() => {
    const episodeOfCare: EpisodeOfCare[] =
      episodeUuids.length > 0 ? episodeOfCareQueries.data : [];

    const activeEpisodeId = episodeUuids.length > 0 ? episodeUuids[0] : null;
    const activeVisitId = activeVisit?.id ?? null;

    return {
      episodeOfCare,
      visit: [],
      encounter: [],
      isLoading: episodeOfCareQueries.isLoading,
      error: episodeOfCareQueries.error,
      patientId,
      activeVisitId,
      activeEpisodeId,
    };
  }, [episodeOfCareQueries, episodeUuids, patientId, activeVisit?.id]);

  if (clinicalContext.isLoading && episodeUuids.length > 0) {
    return <Loading description={t('LOADING_CLINICAL_DATA')} role="status" />;
  }

  if (clinicalContext.error)
    return (
      <div className="alert alert-danger">
        {t('ERROR_FETCHING_CLINICAL_DATA')}
      </div>
    );

  return (
    <ClinicalAppContext.Provider value={clinicalContext}>
      {children}
    </ClinicalAppContext.Provider>
  );
};

ClinicalAppProvider.displayName = 'clinical apps provider';
