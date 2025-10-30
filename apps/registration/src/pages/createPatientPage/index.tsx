import {
  Button,
  Tile,
  BaseLayout,
} from '@bahmni-frontend/bahmni-design-system';
import {
  BAHMNI_HOME_PATH,
  createPatient,
  notificationService,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PatientProfile,
  PatientProfileRef,
} from '../../components/forms/patientProfile/PatientProfile';
import { Header } from '../../components/Header';
import styles from './styles/index.module.scss';

const Registration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Create ref for PatientProfile
  const patientProfileRef = useRef<PatientProfileRef>(null);

  const handleSave = () => {
    // Validate PatientProfile
    const isProfileValid = patientProfileRef.current?.validate();

    if (!isProfileValid) {
      notificationService.showError(
        'Error',
        'Please fix validation errors',
        5000,
      );
      return;
    }

    // Get data from PatientProfile
    const profileData = patientProfileRef.current?.getData();

    if (!profileData) {
      notificationService.showError(
        'Error',
        'Unable to get patient data',
        5000,
      );
      return;
    }

    // Continue with other validations (address, etc.)
    // Then submit...

    // Transform flat profile data into CreatePatientRequest structure
    const patientPayload = {
      patient: {
        person: {
          names: [
            {
              givenName: profileData.firstName,
              ...(profileData.middleName && {
                middleName: profileData.middleName,
              }),
              familyName: profileData.lastName,
              display: `${profileData.firstName}${profileData.middleName ? ' ' + profileData.middleName : ''} ${profileData.lastName}`,
              preferred: false,
            },
          ],
          gender: profileData.gender.charAt(0).toUpperCase(),
          birthdate: profileData.dateOfBirth,
          birthdateEstimated: profileData.dobEstimated,
          birthtime: profileData.birthTime || null,
          addresses: [],
          attributes: [],
          deathDate: null,
          causeOfDeath: '',
        },
        identifiers: [
          {
            identifierPrefix: profileData.patientIdFormat,
            identifierType: '', // TODO: Get from identifier type config
            preferred: true,
            voided: false,
          },
        ],
      },
      relationships: [],
    };

    createPatientMutation.mutate(patientPayload);
  };

  const createPatientMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: (response) => {
      notificationService.showSuccess(
        'Success',
        'Patient saved successfully',
        5000,
      );
      if (response?.patient?.uuid) {
        window.history.replaceState(
          {
            patientDisplay: response.patient.display,
            patientUuid: response.patient.uuid,
          },
          '',
          `/registration/patient/${response.patient.uuid}`,
        );
      } else {
        navigate('/registration/search');
      }
    },
    onError: () => {
      notificationService.showError('Error', 'Failed to save patient', 5000);
    },
  });

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
          <div>
            {/* No props needed except optional initialData */}
            <div className={styles.formContainer}>
              <PatientProfile ref={patientProfileRef} />
            </div>

            {/* Other form sections... */}
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
