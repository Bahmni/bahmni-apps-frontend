import { Header, Icon, ICON_SIZE } from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  getDocumentTypes,
  getEncounterTypeByName,
  getFormattedError,
  getFormattedPatientById,
} from '@bahmni/services';
import {
  PatientDetails,
  PendingDocumentsProvider,
  useNotification,
  usePatientUUID,
} from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentsSection } from '../components/DocumentsSection';
import { PageActions } from '../components/PageActions';
import {
  BAHMNI_PATIENT_DOCUMENTS_NAMESPACE,
  BAHMNI_DOCUMENT_UPLOAD_SEARCH_BASE,
} from '../constants/app';
import { useDocumentUploadParams } from '../hooks/useDocumentUploadParams';
import {
  PATIENT_DOCUMENTS_QUERY_KEY,
  PATIENT_ENCOUNTERS_QUERY_KEY,
  useVisitDocuments,
} from '../hooks/useVisitDocuments';
import styles from './styles/Index.module.scss';

export const IndexPage: React.FC = () => {
  const { t } = useTranslation(BAHMNI_PATIENT_DOCUMENTS_NAMESPACE);
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();
  const patientUUID = usePatientUUID();
  const { encounterType, topLevelConcept, defaultOption } =
    useDocumentUploadParams();

  const { data: patient } = useQuery({
    queryKey: ['patient', patientUUID],
    queryFn: () => getFormattedPatientById(patientUUID!),
    enabled: !!patientUUID,
  });

  const encounter = useQuery({
    queryKey: ['encounterType', encounterType],
    queryFn: () => getEncounterTypeByName(encounterType!),
    enabled: !!encounterType,
  });

  // Same query-key inputs as DocumentsSection (patientUuid, [encounter type uuid]), so this reads
  // the same react-query cache entry rather than triggering a second fetch. Only visitGroups.length
  // is needed here, to decide whether the action bar has anything to upload into (AC 13).
  const { visitGroups } = useVisitDocuments(
    patientUUID,
    encounter.data ? [encounter.data.uuid] : undefined,
  );

  // Page-level because the queued files of every visit share one type dropdown list and one Save.
  const { data: documentTypes, error: documentTypesError } = useQuery({
    queryKey: ['documentTypes', topLevelConcept],
    queryFn: () => getDocumentTypes(topLevelConcept!),
    enabled: !!topLevelConcept,
  });

  // Document types populate an optional dropdown, so a failure must not block upload — but the
  // user should still be told the list could not be loaded rather than seeing an empty dropdown.
  useEffect(() => {
    if (documentTypesError) {
      const { title, message } = getFormattedError(documentTypesError);
      addNotification({ title, message, type: 'error' });
    }
  }, [documentTypesError, addNotification]);

  // Saving can touch any visit, so refresh the whole visit/document view rather than one accordion.
  const handleSaved = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [PATIENT_ENCOUNTERS_QUERY_KEY],
    });
    queryClient.invalidateQueries({ queryKey: [PATIENT_DOCUMENTS_QUERY_KEY] });
  }, [queryClient]);
  const searchHref = useMemo(() => {
    const params = [];
    if (encounterType)
      params.push(`encounterType=${encodeURIComponent(encounterType)}`);
    if (topLevelConcept)
      params.push(`topLevelConcept=${encodeURIComponent(topLevelConcept)}`);
    if (defaultOption)
      params.push(`defaultOption=${encodeURIComponent(defaultOption)}`);
    return `${BAHMNI_DOCUMENT_UPLOAD_SEARCH_BASE}?${params.join('&')}#/search`;
  }, [encounterType, topLevelConcept, defaultOption]);

  const breadcrumbItems = useMemo(
    () => [
      {
        id: 'home',
        label: t('PATIENT_DOCUMENTS_BREADCRUMB_HOME'),
        href: BAHMNI_HOME_PATH,
      },
      {
        id: 'search',
        label: t('PATIENT_DOCUMENTS_BREADCRUMB_SEARCH'),
        href: searchHref,
      },
      {
        id: 'current',
        label: patient?.fullName ?? t('PATIENT_DOCUMENTS_BREADCRUMB_CURRENT'),
        isCurrentPage: true,
      },
    ],
    [patient?.fullName, t, searchHref],
  );

  const globalActions = useMemo(
    () => [
      {
        id: 'user',
        label: t('PATIENT_DOCUMENTS_GLOBAL_ACTION_USER'),
        renderIcon: <Icon id="user-icon" name="fa-user" size={ICON_SIZE.LG} />,
        onClick: () => {},
      },
    ],
    [t],
  );

  return (
    <>
      <Header breadcrumbItems={breadcrumbItems} globalActions={globalActions} />
      {/* Wraps both the accordion and the action bar: files queued under any visit are held here,
          so the bar's Save can commit all of them in one go. */}
      <PendingDocumentsProvider
        patientUuid={patientUUID ?? ''}
        encounterTypeName={encounter.data?.name ?? ''}
        documentTypes={documentTypes}
        defaultOption={defaultOption}
        onSaved={handleSaved}
      >
        <main className={styles.page}>
          <section
            aria-label={t('PATIENT_DOCUMENTS_PATIENT_HEADER_LABEL')}
            className={styles.patientBanner}
          >
            <PatientDetails />
          </section>
          {patientUUID && encounter.data && (
            <DocumentsSection
              patientUuid={patientUUID}
              documentEncounterType={encounter.data}
            />
          )}
          {/* Documents attach to visits, so with no visits there is nothing to upload into —
              hidden rather than shown disabled (AC 13). This also keeps the bar hidden while the
              visits query is loading or errors, consistent with DocumentsSection above. Gated on
              patientUUID (not on encounter.data) because visitGroups only needs the patient to
              resolve — requiring the document encounter type too would also hide the bar whenever
              that URL param is absent, which is not what AC 13 asks for. */}
          {patientUUID && visitGroups.length > 0 && (
            <PageActions searchHref={searchHref} />
          )}
        </main>
      </PendingDocumentsProvider>
    </>
  );
};
