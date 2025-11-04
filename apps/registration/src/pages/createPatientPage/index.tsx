import {
  Button,
  Tile,
  BaseLayout,
} from '@bahmni-frontend/bahmni-design-system';
import {
  BAHMNI_HOME_PATH,
  useTranslation,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
} from '@bahmni-frontend/bahmni-services';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PatientAdditionalInformation,
  PatientAdditionalInformationRef,
} from '../../components/forms/patientAdditionalInformation/PatientAdditionalInformation';
import {
  PatientAddressInformation,
  PatientAddressInformationRef,
} from '../../components/forms/patientAddressInformation/PatientAddressInformation';
import {
  PatientContactInformation,
  PatientContactInformationRef,
} from '../../components/forms/patientContactInformation/PatientContactInformation';
import {
  PatientProfile,
  PatientProfileRef,
} from '../../components/forms/patientProfile/PatientProfile';
import { Header } from '../../components/Header';
import { useCreatePatient } from '../../hooks/useCreatePatient';
import { validateAllSections, collectFormData } from './patientFormService';
import styles from './styles/index.module.scss';
import { VisitTypeSelector } from './visitTypeSelector';

const CreatePatient = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [patientUuid, setPatientUuid] = useState<string | null>(null);

  const patientProfileRef = useRef<PatientProfileRef>(null);
  const patientAddressRef = useRef<PatientAddressInformationRef>(null);
  const patientContactRef = useRef<PatientContactInformationRef>(null);
  const patientAdditionalRef = useRef<PatientAdditionalInformationRef>(null);

  // Use the custom hook for patient creation
  const createPatientMutation = useCreatePatient();

  // Dispatch audit event when page is viewed
  useEffect(() => {
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_NEW_PATIENT_PAGE
        .eventType as AuditEventType,
      module: AUDIT_LOG_EVENT_DETAILS.VIEWED_NEW_PATIENT_PAGE.module,
    });
  }, []);

  // Track patient UUID after successful creation
  useEffect(() => {
    if (createPatientMutation.isSuccess && createPatientMutation.data) {
      const response = createPatientMutation.data;
      if (response?.patient?.uuid) {
        setPatientUuid(response.patient.uuid);
      }
    }
  }, [createPatientMutation.isSuccess, createPatientMutation.data]);

  const handleSave = async (): Promise<string | null> => {
    // Validate all form sections
    const isValid = validateAllSections({
      profileRef: patientProfileRef,
      addressRef: patientAddressRef,
      contactRef: patientContactRef,
      additionalRef: patientAdditionalRef,
    });

    if (!isValid) {
      return null;
    }

    // Collect data from all form sections
    const formData = collectFormData({
      profileRef: patientProfileRef,
      addressRef: patientAddressRef,
      contactRef: patientContactRef,
      additionalRef: patientAdditionalRef,
    });

    if (!formData) {
      return null;
    }

    // Trigger mutation with collected data
    try {
      const response = await createPatientMutation.mutateAsync(formData);
      if (response?.patient?.uuid) {
        return response.patient.uuid;
      }
      return null;
    } catch {
      return null;
    }
  };

  const breadcrumbs = [
    { label: t('CREATE_PATIENT_BREADCRUMB_HOME'), href: BAHMNI_HOME_PATH },
    {
      label: t('CREATE_PATIENT_BREADCRUMB_SEARCH'),
      onClick: () => navigate('/registration/search'),
    },
    { label: t('CREATE_PATIENT_BREADCRUMB_CURRENT') },
  ];

  return (
    <BaseLayout
      header={<Header breadcrumbs={breadcrumbs} />}
      main={
        <div>
          <Tile className={styles.patientDetailsHeader}>
            <span className={styles.sectionTitle}>
              {t('CREATE_PATIENT_HEADER_TITLE')}
            </span>
          </Tile>

          <div className={styles.formContainer}>
            <PatientProfile ref={patientProfileRef} />
            <PatientAddressInformation ref={patientAddressRef} />
            <PatientContactInformation ref={patientContactRef} />
            <PatientAdditionalInformation ref={patientAdditionalRef} />
          </div>

          {/* Footer Actions */}
          <div className={styles.formActions}>
            <Button kind="tertiary">
              {t('CREATE_PATIENT_BACK_TO_SEARCH')}
            </Button>
            <div className={styles.actionButtons}>
              <Button
                kind="tertiary"
                onClick={handleSave}
                disabled={createPatientMutation.isPending}
              >
                {createPatientMutation.isPending
                  ? 'Saving...'
                  : t('CREATE_PATIENT_SAVE')}
              </Button>
              <Button kind="tertiary">
                {t('CREATE_PATIENT_PRINT_REG_CARD')}
              </Button>
              <VisitTypeSelector
                onVisitSave={handleSave}
                patientUuid={patientUuid}
              />
            </div>
          </div>
        </div>
      }
    />
  );
};
export default CreatePatient;
