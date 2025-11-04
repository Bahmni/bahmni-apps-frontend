import {
  Button,
  Tile,
  BaseLayout,
} from '@bahmni-frontend/bahmni-design-system';
import {
  BAHMNI_HOME_PATH,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useRef } from 'react';
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

const Registration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const patientProfileRef = useRef<PatientProfileRef>(null);
  const patientAddressRef = useRef<PatientAddressInformationRef>(null);
  const patientContactRef = useRef<PatientContactInformationRef>(null);
  const patientAdditionalRef = useRef<PatientAdditionalInformationRef>(null);

  // Use the custom hook for patient creation
  const createPatientMutation = useCreatePatient();

  const handleSave = () => {
    // Validate all form sections
    const isValid = validateAllSections({
      profileRef: patientProfileRef,
      addressRef: patientAddressRef,
      contactRef: patientContactRef,
      additionalRef: patientAdditionalRef,
    });

    if (!isValid) {
      return;
    }

    // Collect data from all form sections
    const formData = collectFormData({
      profileRef: patientProfileRef,
      addressRef: patientAddressRef,
      contactRef: patientContactRef,
      additionalRef: patientAdditionalRef,
    });

    if (!formData) {
      return;
    }

    // Trigger mutation with collected data
    createPatientMutation.mutate(formData);
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
              <Button kind="primary">
                {t('CREATE_PATIENT_START_OPD_VISIT')}
              </Button>
            </div>
          </div>
        </div>
      }
    />
  );
};

export default Registration;
