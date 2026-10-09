import { Header, Icon, ICON_SIZE } from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  getEncounterTypeByName,
  getFormattedPatientById,
} from '@bahmni/services';
import { PatientDetails, usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentsSection } from '../components/DocumentsSection';
import {
  BAHMNI_PATIENT_DOCUMENTS_NAMESPACE,
  BAHMNI_DOCUMENT_UPLOAD_SEARCH_BASE,
} from '../constants/app';
import { useDocumentUploadParams } from '../hooks/useDocumentUploadParams';
import styles from './styles/Index.module.scss';

export const IndexPage: React.FC = () => {
  const { t } = useTranslation(BAHMNI_PATIENT_DOCUMENTS_NAMESPACE);
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
            topLevelConcept={topLevelConcept}
            defaultOption={defaultOption}
            searchHref={searchHref}
          />
        )}
      </main>
    </>
  );
};
