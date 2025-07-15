import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Loading } from '@carbon/react';
import { Save, Close } from '@carbon/icons-react';
import {
  PatientFormData,
  PatientFormMode,
  ValidationError,
} from '@types/registration';
import { validatePatientForm } from '@utils/validation';
import { useNotification } from '@hooks/useNotification';
import styles from './styles/PatientForm.module.scss';

interface PatientFormProps {
  mode: PatientFormMode;
  onSubmit: (data: PatientFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  initialData?: PatientFormData | null;
}

interface PatientValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * PatientForm - Phase 1: Basic Registration Form
 * 
 * Clean implementation starting from scratch with core functionality:
 * - Patient Identifier
 * - Patient Name (First, Middle, Last)
 * - Demographics (Gender, Age, Birthdate)
 * - Basic Address
 * - Form Validation
 * - Form Submission
 */
const PatientForm: React.FC<PatientFormProps> = ({
  mode,
  onSubmit,
  onCancel,
  loading = false,
  initialData
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  // Form state
  const [formData, setFormData] = useState<PatientFormData>(() => 
    initialData || createEmptyPatientData()
  );
  const [validationErrors, setValidationErrors] = useState<PatientValidationResult>({
    isValid: true,
    errors: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Create empty patient data structure
   */
  function createEmptyPatientData(): PatientFormData {
    return {
      // Patient Identifier
      primaryIdentifier: {
        identifier: '',
        identifierType: {
          uuid: '',
          name: 'Patient ID',
          primary: true,
          required: true
        }
      },
      
      // Patient Name
      name: {
        givenName: '',
        middleName: '',
        familyName: ''
      },
      
      // Demographics
      gender: '',
      birthdate: '',
      age: {
        years: 0,
        months: 0,
        days: 0
      },
      
      // Basic Address
      address: {
        address1: '',
        address2: '',
        cityVillage: '',
        stateProvince: '',
        postalCode: '',
        country: ''
      }
    };
  }

  /**
   * Handle field changes
   */
  const handleFieldChange = useCallback((field: keyof PatientFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation errors for this field
    if (validationErrors.errors.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        errors: prev.errors.filter(error => error.field !== field)
      }));
    }
  }, [validationErrors.errors]);

  /**
   * Validate form data
   */
  const validateForm = useCallback((): PatientValidationResult => {
    const errors: ValidationError[] = [];

    // Required field validations
    if (!formData.primaryIdentifier.identifier.trim()) {
      errors.push({
        field: 'primaryIdentifier',
        message: 'REGISTRATION_ERROR_PATIENT_ID_REQUIRED'
      });
    }

    if (!formData.name.givenName.trim()) {
      errors.push({
        field: 'givenName',
        message: 'REGISTRATION_ERROR_FIRST_NAME_REQUIRED'
      });
    }

    if (!formData.name.familyName.trim()) {
      errors.push({
        field: 'familyName',
        message: 'REGISTRATION_ERROR_LAST_NAME_REQUIRED'
      });
    }

    if (!formData.gender) {
      errors.push({
        field: 'gender',
        message: 'REGISTRATION_ERROR_GENDER_REQUIRED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [formData]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      
      // Validate form
      const validation = validateForm();
      setValidationErrors(validation);
      
      if (!validation.isValid) {
        addNotification({
          type: 'error',
          title: t('REGISTRATION_ERROR_VALIDATION_FAILED'),
          message: t('REGISTRATION_ERROR_PLEASE_FIX_ERRORS')
        });
        return;
      }

      // Submit form
      await onSubmit(formData);
      
      addNotification({
        type: 'success',
        title: t('REGISTRATION_SUCCESS'),
        message: t('REGISTRATION_PATIENT_SAVED_SUCCESSFULLY')
      });
      
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('REGISTRATION_ERROR'),
        message: t('REGISTRATION_ERROR_SAVE_FAILED')
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, addNotification, t]);

  /**
   * Handle form cancellation
   */
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const isFormLoading = loading || isSubmitting;

  return (
    <div className={styles.patientForm}>
      {/* Form Header */}
      <div className={styles.formHeader}>
        <h2>{mode === 'create' ? t('REGISTRATION_NEW_PATIENT') : t('REGISTRATION_EDIT_PATIENT')}</h2>
      </div>

      {/* Form Content - Will be implemented in subsequent tasks */}
      <div className={styles.formContent}>
        <p>Phase 1 - Basic form structure created</p>
        <p>Next: Implement individual sections</p>
      </div>

      {/* Form Actions */}
      <div className={styles.formActions}>
        <Button
          kind="secondary"
          onClick={handleCancel}
          disabled={isFormLoading}
          renderIcon={Close}
        >
          {t('CANCEL')}
        </Button>
        
        <Button
          kind="primary"
          onClick={handleSubmit}
          disabled={isFormLoading}
          renderIcon={Save}
        >
          {isFormLoading ? (
            <>
              <Loading size="sm" />
              {t('SAVING')}
            </>
          ) : (
            t('SAVE')
          )}
        </Button>
      </div>
    </div>
  );
};

export default PatientForm;
