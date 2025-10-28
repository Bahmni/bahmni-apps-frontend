import { useTranslation } from '@bahmni-frontend/bahmni-services';
import { useState, useCallback } from 'react';
import {
  type AddressErrors,
  type AddressSelectedFromDropdown,
} from '../models/address';
import { type PatientFormData } from '../models/patientForm';
import {
  INITIAL_NAME_ERRORS,
  INITIAL_VALIDATION_ERRORS,
  type NameErrors,
  type ValidationErrors,
} from '../models/validation';
import { validateName, validatePhone } from '../utils/validation';

export const usePatientValidation = () => {
  const { t } = useTranslation();
  const [nameErrors, setNameErrors] = useState<NameErrors>(INITIAL_NAME_ERRORS);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    INITIAL_VALIDATION_ERRORS,
  );

  const handleNameChange = useCallback(
    (
      field: 'firstName' | 'middleName' | 'lastName',
      value: string,
      updateForm: (field: string, value: string) => void,
    ) => {
      if (validateName(value)) {
        updateForm(field, value);
        setNameErrors((prev) => ({ ...prev, [field]: '' }));
        setValidationErrors((prev) => ({ ...prev, [field]: '' }));
      } else {
        setNameErrors((prev) => ({
          ...prev,
          [field]: t('CREATE_PATIENT_VALIDATION_NAME_INVALID'),
        }));
      }
    },
    [t],
  );

  const handlePhoneChange = useCallback(
    (
      field: 'phoneNumber' | 'altPhoneNumber',
      value: string,
      updateForm: (field: string, value: string) => void,
    ) => {
      if (validatePhone(value)) {
        updateForm(field, value);
      }
    },
    [],
  );

  const validateFormOnSubmit = useCallback(
    (
      formData: PatientFormData,
      addressSelectedFromDropdown: AddressSelectedFromDropdown,
      setAddressErrors: (errors: AddressErrors) => void,
    ): boolean => {
      const errors: ValidationErrors = {
        firstName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
      };
      const addrErrors: AddressErrors = {
        district: '',
        state: '',
        pincode: '',
      };
      let hasErrors = false;

      if (!formData.firstName.trim()) {
        errors.firstName = t('CREATE_PATIENT_VALIDATION_FIRST_NAME_REQUIRED');
        hasErrors = true;
      }
      if (!formData.lastName.trim()) {
        errors.lastName = t('CREATE_PATIENT_VALIDATION_LAST_NAME_REQUIRED');
        hasErrors = true;
      }
      if (!formData.gender) {
        errors.gender = t('CREATE_PATIENT_VALIDATION_GENDER_REQUIRED');
        hasErrors = true;
      }
      if (!formData.dateOfBirth) {
        errors.dateOfBirth = t(
          'CREATE_PATIENT_VALIDATION_DATE_OF_BIRTH_REQUIRED',
        );
        hasErrors = true;
      }

      // Validate address fields - if they have a value, it must be from dropdown
      if (formData.district && !addressSelectedFromDropdown.district) {
        addrErrors.district = t(
          'CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN',
        );
        hasErrors = true;
      }
      if (formData.state && !addressSelectedFromDropdown.state) {
        addrErrors.state = t('CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN');
        hasErrors = true;
      }
      if (formData.pincode && !addressSelectedFromDropdown.pincode) {
        addrErrors.pincode = t(
          'CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN',
        );
        hasErrors = true;
      }

      setValidationErrors(errors);
      setAddressErrors(addrErrors);

      return !hasErrors;
    },
    [t],
  );

  return {
    nameErrors,
    validationErrors,
    setValidationErrors,
    handleNameChange,
    handlePhoneChange,
    validateFormOnSubmit,
  };
};
