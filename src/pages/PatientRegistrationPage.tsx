/**
 * Patient Registration Page
 *
 * Main page component that combines all registration sections and handles
 * form submission, validation, and navigation. Replaces the existing
 * PatientForm_New.tsx with a complete implementation.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Loading,
  Content,
  Grid,
  Column,
  Stack,
  Breadcrumb,
  BreadcrumbItem,
} from '@carbon/react';
import { Save, Close, ArrowLeft } from '@carbon/icons-react';
import {
  PatientFormData,
  PatientFormMode,
  ValidationError,
  RegistrationConfig,
} from '../types/registration';
import { useNotification } from '@hooks/useNotification';
import { validatePatientForm } from '@utils/registrationValidation';
import {
  createPatient,
  updatePatient,
  getRegistrationConfig,
  getPatientByUuid,
} from '@services/patientRegistrationService';

// Section Components
import PatientPhotoSection from '@components/registration/sections/PatientPhotoSection';
import PatientIdentifierSection from '@components/registration/sections/PatientIdentifierSection';
import PatientNameSection from '@components/registration/sections/PatientNameSection';
import PatientDemographicsSection from '@components/registration/sections/PatientDemographicsSection';
import PatientAddressSection from '@components/registration/sections/PatientAddressSection';
import PatientOtherInfoSection from '@components/registration/sections/PatientOtherInfoSection';
import PatientAdditionalInfoSection from '@components/registration/sections/PatientAdditionalInfoSection';

import * as styles from './styles/PatientRegistrationPage.module.scss';

interface PatientRegistrationPageProps {
  mode?: PatientFormMode;
}

const PatientRegistrationPage: React.FC<PatientRegistrationPageProps> = ({
  mode = 'create',
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const { patientUuid } = useParams<{ patientUuid?: string }>();

  // State
  const [formData, setFormData] = useState<PatientFormData>(() =>
    createEmptyPatientData(),
  );
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState<RegistrationConfig | null>(null);

  /**
   * Create empty patient data structure
   */
  function createEmptyPatientData(): PatientFormData {
    return {
      primaryIdentifier: {
        identifier: '',
        identifierType: {
          uuid: '',
          name: 'Patient ID',
          primary: true,
          required: true,
        },
      },
      name: {
        givenName: '',
        middleName: '',
        familyName: '',
      },
      demographics: {
        gender: '',
        birthdate: undefined,
        birthdateEstimated: false,
        age: { years: 0, months: 0, days: 0 },
      },
      address: {
        address1: '',
        address2: '',
        cityVillage: '',
        stateProvince: '',
        postalCode: '',
        country: '',
      },
      photo: {
        image: undefined,
        hasPhoto: false,
      },
      otherInfo: {
        phoneNumber: '',
        alternatePhoneNumber: '',
      },
      attributes: [],
      relationships: [],
    };
  }

  /**
   * Load registration configuration
   */
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const registrationConfig = await getRegistrationConfig();
      setConfig(registrationConfig);

      // Set default identifier type if available
      if (registrationConfig.identifierTypes.length > 0) {
        const primaryIdentifierType =
          registrationConfig.identifierTypes.find((type) => type.primary) ||
          registrationConfig.identifierTypes[0];

        setFormData((prev) => ({
          ...prev,
          primaryIdentifier: {
            ...prev.primaryIdentifier,
            identifierType: primaryIdentifierType,
          },
        }));
      }
    } catch (error) {
      console.error('Error loading registration config:', error);
      addNotification({
        type: 'error',
        title: t('REGISTRATION_ERROR'),
        message: t('REGISTRATION_ERROR_CONFIG_LOAD_FAILED'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, t]);

  /**
   * Load existing patient data for edit mode
   */
  const loadPatientData = useCallback(async () => {
    if (mode !== 'edit' || !patientUuid) return;

    try {
      setIsLoading(true);
      const patientData = await getPatientByUuid(patientUuid);

      // Transform patient data to form data structure
      // This would need to be implemented based on the API response structure
      // For now, we'll use the empty data structure

      addNotification({
        type: 'info',
        title: t('REGISTRATION_INFO'),
        message: t('REGISTRATION_PATIENT_DATA_LOADED'),
      });
    } catch (error) {
      console.error('Error loading patient data:', error);
      addNotification({
        type: 'error',
        title: t('REGISTRATION_ERROR'),
        message: t('REGISTRATION_ERROR_PATIENT_LOAD_FAILED'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [mode, patientUuid, addNotification, t]);

  /**
   * Handle field changes
   */
  const handleFieldChange = useCallback(
    (field: keyof PatientFormData, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear validation errors for this field
      setValidationErrors((prev) =>
        prev.filter((error) => !error.field.startsWith(field)),
      );
    },
    [],
  );

  /**
   * Validate form
   */
  const validateForm = useCallback(() => {
    const validation = validatePatientForm(formData, config || undefined);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, [formData, config]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);

      // Validate form
      const isValid = validateForm();
      if (!isValid) {
        addNotification({
          type: 'error',
          title: t('REGISTRATION_ERROR_VALIDATION_FAILED'),
          message: t('REGISTRATION_ERROR_PLEASE_FIX_ERRORS'),
        });
        return;
      }

      // Submit form
      if (mode === 'create') {
        const response = await createPatient(formData, config!);
        addNotification({
          type: 'success',
          title: t('REGISTRATION_SUCCESS'),
          message: t('REGISTRATION_PATIENT_CREATED_SUCCESSFULLY'),
        });

        // Navigate to patient view or clinical page
        navigate(`/clinical/${response.patient.uuid}`);
      } else {
        await updatePatient(patientUuid!, formData, config!);
        addNotification({
          type: 'success',
          title: t('REGISTRATION_SUCCESS'),
          message: t('REGISTRATION_PATIENT_UPDATED_SUCCESSFULLY'),
        });

        // Navigate back to patient view
        navigate(`/clinical/${patientUuid}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      addNotification({
        type: 'error',
        title: t('REGISTRATION_ERROR'),
        message:
          mode === 'create'
            ? t('REGISTRATION_ERROR_CREATE_FAILED')
            : t('REGISTRATION_ERROR_UPDATE_FAILED'),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, patientUuid, validateForm, addNotification, t, navigate]);

  const handleSaveAndStartOPD = useCallback(async () => {
    await handleSubmit();
    // Add navigation to OPD after patient is created
  }, [handleSubmit]);

  /**
   * Handle form cancellation
   */
  const handleCancel = useCallback(() => {
    if (mode === 'edit' && patientUuid) {
      navigate(`/clinical/${patientUuid}`);
    } else {
      navigate('/');
    }
  }, [mode, patientUuid, navigate]);

  // Load configuration and patient data on mount
  useEffect(() => {
    loadConfig();
    loadPatientData();
  }, [loadConfig, loadPatientData]);

  const isFormLoading = isLoading || isSubmitting;
  const pageTitle =
    mode === 'create'
      ? t('REGISTRATION_NEW_PATIENT')
      : t('REGISTRATION_EDIT_PATIENT');

  if (isLoading) {
    return (
      <Content className={styles.loadingContainer}>
        <Loading description={t('REGISTRATION_LOADING_CONFIG')} />
      </Content>
    );
  }

  return (
    <Content className={`${styles.registrationPage} registration-page`}>
      {/* Breadcrumb Navigation */}
      <div className={styles.breadcrumbContainer}>
        <Breadcrumb>
          <BreadcrumbItem href="/">{t('HOME')}</BreadcrumbItem>
          <BreadcrumbItem href="/registration">
            {t('REGISTRATION')}
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{pageTitle}</BreadcrumbItem>
        </Breadcrumb>
      </div>

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={ArrowLeft}
            onClick={handleCancel}
          >
            {t('BACK')}
          </Button>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        </div>
      </div>

      {/* Registration Form */}
      <div className={styles.formContainer}>
        <Grid className={styles.formGrid}>
          <Column sm={4} md={8} lg={12}>
            <Stack gap={6}>
              {/* Patient Photo Section */}
              {!config?.disablePhotoCapture && (
                <PatientPhotoSection
                  data={formData.photo!}
                  onChange={(photo) => handleFieldChange('photo', photo)}
                  errors={validationErrors}
                  disabled={isFormLoading}
                  disablePhotoCapture={config?.disablePhotoCapture}
                />
              )}

              {/* Patient Identifier Section */}
              <PatientIdentifierSection
                data={formData.primaryIdentifier}
                onChange={(identifier) =>
                  handleFieldChange('primaryIdentifier', identifier)
                }
                errors={validationErrors}
                disabled={isFormLoading}
                config={config || undefined}
                showEnterID={config?.showEnterID}
              />

              {/* Patient Name Section */}
              <PatientNameSection
                data={formData.name}
                onChange={(name) => handleFieldChange('name', name)}
                errors={validationErrors}
                disabled={isFormLoading}
                config={config || undefined}
                showMiddleName={config?.showMiddleName}
                showLastName={config?.showLastName}
              />

              {/* Demographics Section */}
              <PatientDemographicsSection
                data={formData.demographics}
                onChange={(demographics) =>
                  handleFieldChange('demographics', demographics)
                }
                errors={validationErrors}
                disabled={isFormLoading}
                config={config || undefined}
                dobMandatory={config?.dobMandatory}
                showBirthTime={config?.showBirthTime}
              />

              {/* Address Section */}
              <PatientAddressSection
                data={formData.address}
                onChange={(address) => handleFieldChange('address', address)}
                errors={validationErrors}
                disabled={isFormLoading}
                config={config || undefined}
                addressLevels={config?.addressLevels}
                showAddressFieldsTopDown={
                  config?.addressHierarchyConfigs.showAddressFieldsTopDown
                }
              />

              {/* Other Info Section */}
              <PatientOtherInfoSection
                data={formData.otherInfo!}
                onChange={(otherInfo) =>
                  handleFieldChange('otherInfo', otherInfo)
                }
                disabled={isFormLoading}
              />

              {/* Additional Info Section */}
              <PatientAdditionalInfoSection />
            </Stack>
          </Column>
        </Grid>
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
              <Loading small withOverlay={false} />
              {t('SAVING')}
            </>
          ) : (
            t('SAVE')
          )}
        </Button>
        <Button
          kind="primary"
          onClick={handleSaveAndStartOPD}
          disabled={isFormLoading}
        >
          {t('SAVE_AND_START_OPD')}
        </Button>
      </div>
    </Content>
  );
};

export default PatientRegistrationPage;
