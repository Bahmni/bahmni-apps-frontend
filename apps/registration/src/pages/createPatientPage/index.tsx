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
  CreatePatientRequest,
  PatientName,
  PatientIdentifier,
} from '@bahmni-frontend/bahmni-services';
import { useMutation } from '@tanstack/react-query';
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
import { useIdentifierData } from '../../utils/identifierGenderUtils';
import styles from './styles/index.module.scss';

const Registration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const patientProfileRef = useRef<PatientProfileRef>(null);
  const patientAddressRef = useRef<PatientAddressInformationRef>(null);
  const patientContactRef = useRef<PatientContactInformationRef>(null);
  const patientAdditionalRef = useRef<PatientAdditionalInformationRef>(null);

  const { primaryIdentifierType, identifierSources } = useIdentifierData();

  const handleSave = () => {
    // Validate all sections
    const isProfileValid = patientProfileRef.current?.validate();
    const isAddressValid = patientAddressRef.current?.validate();
    const isContactValid = patientContactRef.current?.validate();
    const isAdditionalValid = patientAdditionalRef.current?.validate();

    if (
      !isProfileValid ||
      !isAddressValid ||
      !isContactValid ||
      !isAdditionalValid
    ) {
      notificationService.showError(
        'Error',
        'Please fix validation errors',
        5000,
      );
      return;
    }

    const profileData = patientProfileRef.current?.getData();
    if (!profileData) {
      notificationService.showError(
        'Error',
        'Unable to get patient data',
        5000,
      );
      return;
    }

    const addressData = patientAddressRef.current?.getData();
    if (!addressData) {
      notificationService.showError(
        'Error',
        'Unable to get patient address data',
        5000,
      );
      return;
    }

    const contactData = patientContactRef.current?.getData();
    if (!contactData) {
      notificationService.showError(
        'Error',
        'Unable to get patient contact data',
        5000,
      );
      return;
    }

    const additionalData = patientAdditionalRef.current?.getData();
    if (!additionalData) {
      notificationService.showError(
        'Error',
        'Unable to get patient additional data',
        5000,
      );
      return;
    }

    // Transform flat profile data into CreatePatientRequest structure
    const patientName: PatientName = {
      givenName: profileData.firstName,
      ...(profileData.middleName && { middleName: profileData.middleName }),
      familyName: profileData.lastName,
      display: `${profileData.firstName}${profileData.middleName ? ' ' + profileData.middleName : ''} ${profileData.lastName}`,
      preferred: false,
    };

    const patientIdentifier: PatientIdentifier = {
      ...(identifierSources && {
        identifierSourceUuid: identifierSources.get(
          profileData.patientIdFormat,
        ),
      }),
      identifierPrefix: profileData.patientIdFormat,
      identifierType: primaryIdentifierType ?? '',
      preferred: true,
      voided: false,
    };

    const patientPayload: CreatePatientRequest = {
      patient: {
        person: {
          names: [patientName],
          gender: profileData.gender.charAt(0).toUpperCase(),
          birthdate: profileData.dateOfBirth,
          birthdateEstimated: profileData.dobEstimated,
          birthtime: profileData.birthTime || null,
          addresses: [addressData],
          attributes: [],
          deathDate: null,
          causeOfDeath: '',
        },
        identifiers: [patientIdentifier],
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
            <div className={styles.formContainer}>
              <PatientProfile ref={patientProfileRef} />
              <PatientAddressInformation ref={patientAddressRef} />
              <PatientContactInformation ref={patientContactRef} />
              <PatientAdditionalInformation ref={patientAdditionalRef} />
            </div>
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
