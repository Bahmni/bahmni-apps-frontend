import {
  Button,
  Tile,
  BaseLayout,
} from '@bahmni-frontend/bahmni-design-system';
import {
  BAHMNI_HOME_PATH,
  useTranslation,
  createPatient,
  notificationService,
  MAX_PATIENT_AGE_YEARS,
} from '@bahmni-frontend/bahmni-services';
import { useMutation } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientAdditionalInformation } from '../../components/forms/patientAdditionalInformation/PatientAdditionalInformation';
import { PatientAddressInformation } from '../../components/forms/patientAddressInformation/PatientAddressInformation';
import { PatientContactInformation } from '../../components/forms/patientContactInformation/PatientContactInformation';
import { formatToDisplay } from '../../components/forms/patientProfile/dateAgeUtils';
import { PatientProfile } from '../../components/forms/patientProfile/PatientProfile';
import { Header } from '../../components/Header';
import {
  useGenderData,
  useIdentifierData,
} from '../../utils/identifierGenderUtils';
import styles from './styles/index.module.scss';
import { createPatientSaveHandler } from './utils/patientSaveUtils';

const NewPatientRegistration = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [dobEstimated, setDobEstimated] = useState(false);

  // Ref to hold validation function from BasicInformation
  const basicInfoValidateRef = useRef<(() => boolean) | null>(null);

  // Use utility hooks for identifier and gender data
  const { identifierPrefixes, identifierSources, primaryIdentifierType } =
    useIdentifierData();
  const { genders } = useGenderData(t);

  // Mutation for creating a patient
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

  const [formData, setFormData] = useState({
    patientIdFormat: '',
    entryType: false,
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    ageYears: '',
    ageMonths: '',
    ageDays: '',
    dateOfBirth: '',
    birthTime: '',
    houseNumber: '',
    locality: '',
    district: '',
    city: '',
    state: '',
    pincode: '',
    phoneNumber: '',
    altPhoneNumber: '',
    email: '',
  });

  // Getter function for validation errors from BasicInformation
  const getValidationErrors = () => ({
    validationErrors: {
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
    },
    ageErrors: { ageYears: '', ageMonths: '', ageDays: '' },
    dateErrors: { dateOfBirth: '' },
  });

  // Ref to hold getter function for address dropdown selection state
  const getAddressSelectedFromDropdownRef = useRef<
    | (() => {
        district: boolean;
        state: boolean;
        pincode: boolean;
      })
    | null
  >(null);

  // Address validation errors
  const [addressErrors, setAddressErrors] = useState({
    district: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (identifierPrefixes.length > 0 && !formData.patientIdFormat) {
      setFormData((prev) => ({
        ...prev,
        patientIdFormat: identifierPrefixes[0],
      }));
    }
  }, [identifierPrefixes, formData.patientIdFormat]);

  const handleInputChange = useCallback(
    (field: string, value: string | number | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSave = () => {
    const saveHandler = createPatientSaveHandler({
      formData,
      t,
      setAddressErrors,
      addressSelectedFromDropdown:
        getAddressSelectedFromDropdownRef.current?.() ?? {
          district: false,
          state: false,
          pincode: false,
        },
      primaryIdentifierType: primaryIdentifierType ?? undefined,
      identifierSources: identifierSources ?? undefined,
      dobEstimated,
      createPatientMutation,
      validateBasicInfo: () => basicInfoValidateRef.current?.() ?? false,
    });
    saveHandler();
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
      header={
        <Header
          breadcrumbs={breadcrumbs}
          showButton
          buttonText={t('CREATE_PATIENT_BUTTON_TEXT')}
          buttonTestId="create-new-patient-button"
          buttonDisabled
        />
      }
      main={
        <div>
          <Tile className={styles.patientDetailsHeader}>
            <span className={styles.sectionTitle}>
              {t('CREATE_PATIENT_HEADER_TITLE')}
            </span>
          </Tile>

          <div className={styles.formContainer}>
            <PatientProfile
              formData={{
                patientIdFormat: formData.patientIdFormat,
                entryType: formData.entryType,
                firstName: formData.firstName,
                middleName: formData.middleName,
                lastName: formData.lastName,
                gender: formData.gender,
                ageYears: formData.ageYears,
                ageMonths: formData.ageMonths,
                ageDays: formData.ageDays,
                dateOfBirth: formData.dateOfBirth,
                birthTime: formData.birthTime,
              }}
              dobEstimated={dobEstimated}
              identifierPrefixes={identifierPrefixes}
              genders={genders}
              //TODO : Read MAX_AGE from config
              maxPatientAgeYears={MAX_PATIENT_AGE_YEARS}
              onInputChange={handleInputChange}
              onDobEstimatedChange={setDobEstimated}
              setFormData={
                setFormData as React.Dispatch<React.SetStateAction<unknown>>
              }
              formatToDisplay={formatToDisplay}
              getValidationErrors={getValidationErrors}
              onValidate={(validateFn) => {
                basicInfoValidateRef.current = validateFn;
              }}
            />

            <PatientAddressInformation
              formData={{
                houseNumber: formData.houseNumber,
                locality: formData.locality,
                district: formData.district,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
              }}
              addressErrors={addressErrors}
              onInputChange={handleInputChange}
              onAddressErrorsChange={setAddressErrors}
              getAddressSelectedFromDropdown={(getter) => {
                getAddressSelectedFromDropdownRef.current = getter;
              }}
            />

            <PatientContactInformation
              formData={{
                phoneNumber: formData.phoneNumber,
                altPhoneNumber: formData.altPhoneNumber,
              }}
              onInputChange={handleInputChange}
            />

            <PatientAdditionalInformation
              formData={{
                email: formData.email,
              }}
              onInputChange={handleInputChange}
            />
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

export default NewPatientRegistration;
