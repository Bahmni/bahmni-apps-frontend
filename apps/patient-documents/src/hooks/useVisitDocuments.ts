import {
  DocumentViewModel,
  getFormattedDocumentReferences,
  getPatientEncounters,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { Encounter } from 'fhir/r4';
import { useRef } from 'react';

export interface VisitDocumentGroup {
  visit: Encounter;
  documents: DocumentViewModel[];
  documentEncounter?: Encounter;
}

const isVisit = (encounter: Encounter): boolean =>
  encounter.meta?.tag?.some((tag) => tag.code === 'visit') ?? !encounter.partOf;

const visitIdOf = (encounter: Encounter): string | undefined =>
  encounter.partOf?.reference?.split('/').pop();

const startTime = (encounter: Encounter): number =>
  encounter.period?.start ? new Date(encounter.period.start).getTime() : 0;

// Groups a patient's documents under their visit (via each document encounter's partOf), latest
// visit first, and resolves the existing document encounter per visit so uploads reuse it.
export const useVisitDocuments = (
  patientUuid: string | null,
  documentEncounterTypeUuid?: string[],
) => {
  const hasCompletedInitialLoad = useRef(false);

  const encountersQuery = useQuery({
    queryKey: ['patientEncounters', patientUuid],
    queryFn: () => getPatientEncounters(patientUuid!),
    enabled: !!patientUuid,
  });

  const encounters = encountersQuery.data ?? [];

  const encounterToVisit = new Map<string, string>();
  const documentEncounterByVisit = new Map<string, Encounter>();
  encounters
    .filter((encounter) => !isVisit(encounter))
    .forEach((encounter) => {
      const visitId = visitIdOf(encounter);
      if (!encounter.id || !visitId) {
        return;
      }
      encounterToVisit.set(encounter.id, visitId);
      const typeCode = encounter.type?.[0]?.coding?.[0]?.code;
      if (
        documentEncounterTypeUuid &&
        typeCode &&
        documentEncounterTypeUuid.includes(typeCode)
      ) {
        documentEncounterByVisit.set(visitId, encounter);
      }
    });

  const matchingEncounterInstanceUuids = Array.from(
    documentEncounterByVisit.values(),
  ).flatMap((encounter) => (encounter.id ? [encounter.id] : []));

  const documentsQuery = useQuery({
    queryKey: [
      'patientDocuments',
      patientUuid,
      documentEncounterTypeUuid,
      matchingEncounterInstanceUuids,
    ],
    queryFn: () =>
      getFormattedDocumentReferences(
        patientUuid!,
        matchingEncounterInstanceUuids.length > 0
          ? matchingEncounterInstanceUuids
          : undefined,
      ),
    enabled: !!patientUuid && matchingEncounterInstanceUuids.length > 0,
    placeholderData: (previous) => previous,
  });

  const documents = documentsQuery.data ?? [];

  const visits = encounters
    .filter(isVisit)
    .sort((a, b) => startTime(b) - startTime(a));

  // A document may be attached directly to a visit-level encounter; map each visit to itself so
  // those documents group under their visit instead of being dropped.
  visits.forEach((visit) => {
    if (visit.id) {
      encounterToVisit.set(visit.id, visit.id);
    }
  });

  const documentsByVisit = new Map<string, DocumentViewModel[]>();
  documents.forEach((document) => {
    if (!document.encounterId) {
      return;
    }
    const visitId =
      encounterToVisit.get(document.encounterId) ?? document.encounterId;
    const existing = documentsByVisit.get(visitId) ?? [];
    existing.push(document);
    documentsByVisit.set(visitId, existing);
  });

  const visitGroups: VisitDocumentGroup[] = visits.map((visit) => ({
    visit,
    documents: visit.id ? (documentsByVisit.get(visit.id) ?? []) : [],
    documentEncounter: visit.id
      ? documentEncounterByVisit.get(visit.id)
      : undefined,
  }));

  const refetch = async () => {
    await Promise.all([encountersQuery.refetch(), documentsQuery.refetch()]);
  };

  const isFirstLoadPending =
    encountersQuery.isLoading || documentsQuery.isLoading;
  if (encountersQuery.data !== undefined && !isFirstLoadPending) {
    hasCompletedInitialLoad.current = true;
  }

  return {
    visitGroups,
    isLoading: !hasCompletedInitialLoad.current && isFirstLoadPending,
    error: encountersQuery.error ?? documentsQuery.error,
    refetch,
  };
};
