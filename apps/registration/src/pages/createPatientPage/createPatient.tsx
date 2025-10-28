import { BaseLayout } from '@bahmni-frontend/bahmni-design-system';
import {
  BAHMNI_HOME_PATH,
  useTranslation,
  createPatient,
  notificationService,
} from '@bahmni-frontend/bahmni-services';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useAddressHierarchy } from '../../hooks/useAddressHierarchy';
import { useDateOfBirth } from '../../hooks/useDateOfBirth';
import { usePatientForm } from '../../hooks/usePatientForm';
import { usePatientIdentifiers } from '../../hooks/usePatientIdentifiers';
import { usePatientValidation } from '../../hooks/usePatientValidation';
import { mapFormDataToPatientRequest } from '../../utils/patientMapper';
import { PatientDetails } from './PatientDetails/PatientDetails';

const NewPatientRegistration = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Form state management
  const { formData, handleInputChange, updateMultipleFields } =
    usePatientForm();

  // Identifier and gender data (using TanStack Query)
  const {
    genders,
    identifierPrefixes,
    identifierSources,
    primaryIdentifierType,
  } = usePatientIdentifiers();

  // Date of birth and age logic
  const dateOfBirthProps = useDateOfBirth(
    formData,
    handleInputChange,
    updateMultipleFields,
  );

  // Address hierarchy logic
  const addressProps = useAddressHierarchy(handleInputChange);

  // Validation logic
  const validationProps = usePatientValidation();

  // Set initial identifier prefix when data loads
  useEffect(() => {
    if (identifierPrefixes.length > 0 && !formData.patientIdFormat) {
      handleInputChange('patientIdFormat', identifierPrefixes[0]);
    }
  }, [identifierPrefixes, formData.patientIdFormat, handleInputChange]);

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

  const handleSave = () => {
    const isValid = validationProps.validateFormOnSubmit(
      formData,
      addressProps.addressSelectedFromDropdown,
      addressProps.setAddressErrors,
    );

    if (!isValid) return;

    if (!primaryIdentifierType) {
      notificationService.showError(
        'Error',
        'Unable to determine identifier type',
        5000,
      );
      return;
    }

    const patientRequest = mapFormDataToPatientRequest(
      formData,
      dateOfBirthProps.dobEstimated,
      primaryIdentifierType,
      identifierSources,
    );

    createPatientMutation.mutate(patientRequest);
  };

  const handleGenderChange = (gender: string) => {
    handleInputChange('gender', gender);
    validationProps.setValidationErrors((prev) => ({
      ...prev,
      gender: '',
    }));
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
        <PatientDetails
          formData={formData}
          identifierPrefixes={identifierPrefixes}
          genders={genders}
          nameErrors={validationProps.nameErrors}
          validationErrors={validationProps.validationErrors}
          ageErrors={dateOfBirthProps.ageErrors}
          dateErrors={dateOfBirthProps.dateErrors}
          addressErrors={addressProps.addressErrors}
          dobEstimated={dateOfBirthProps.dobEstimated}
          suggestions={addressProps.suggestions}
          showSuggestions={addressProps.showSuggestions}
          isSaving={createPatientMutation.isPending}
          onInputChange={handleInputChange}
          onNameChange={(field, value) =>
            validationProps.handleNameChange(
              field,
              value,
              handleInputChange as (field: string, value: string) => void,
            )
          }
          onAgeChange={dateOfBirthProps.handleAgeChange}
          onDateInputChange={dateOfBirthProps.handleDateInputChange}
          onDateOfBirthChange={dateOfBirthProps.handleDateOfBirthChange}
          onDobEstimatedChange={dateOfBirthProps.setDobEstimated}
          onGenderChange={handleGenderChange}
          onAddressInputChange={addressProps.handleAddressInputChange}
          onSuggestionSelect={addressProps.handleSuggestionSelect}
          onSuggestionBlur={addressProps.handleSuggestionBlur}
          onSuggestionFocus={addressProps.handleSuggestionFocus}
          onPhoneChange={(field, value) =>
            validationProps.handlePhoneChange(
              field,
              value,
              handleInputChange as (field: string, value: string) => void,
            )
          }
          onSave={handleSave}
        />
      }
    />
  );
};

export default NewPatientRegistration;
