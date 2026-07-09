import { Header, Icon, ICON_SIZE } from '@bahmni/design-system';
import { BAHMNI_HOME_PATH, getFormattedPatientById } from '@bahmni/services';
import { PatientDetails, usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentsSection } from '../components/DocumentsSection';
import {
  BAHMNI_PATIENT_DOCUMENTS_NAMESPACE,
  BAHMNI_DOCUMENT_UPLOAD_SEARCH_PATH,
} from '../constants/app';
import { useDocumentEncounterType } from '../hooks/useDocumentEncounterType';
import styles from './styles/Index.module.scss';

export const IndexPage: React.FC = () => {
  const { t } = useTranslation(BAHMNI_PATIENT_DOCUMENTS_NAMESPACE);
  const patientUUID = usePatientUUID();
  const { encounterType } = useDocumentEncounterType();

  const { data: patient } = useQuery({
    queryKey: ['patient', patientUUID],
    queryFn: () => getFormattedPatientById(patientUUID!),
    enabled: !!patientUUID,
  });

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
        href: BAHMNI_DOCUMENT_UPLOAD_SEARCH_PATH,
      },
      {
        id: 'current',
        label: patient?.fullName ?? t('PATIENT_DOCUMENTS_BREADCRUMB_CURRENT'),
        isCurrentPage: true,
      },
    ],
    [patient?.fullName, t],
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
        {patientUUID && encounterType && (
          <DocumentsSection
            patientUuid={patientUUID}
            documentEncounterType={encounterType}
          />
        )}
      </main>
    </>
  );
};
