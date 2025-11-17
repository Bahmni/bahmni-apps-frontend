import { Button, Tile, BaseLayout } from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  useTranslation,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  getPatientById,
  CreatePatientResponse,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AdditionalInfo,
  AdditionalInfoRef,
} from '../../components/forms/additionalInfo/AdditionalInfo';
import {
  AddressInfo,
  AddressInfoRef,
} from '../../components/forms/addressInfo/AddressInfo';
import {
  ContactInfo,
  ContactInfoRef,
} from '../../components/forms/contactInfo/ContactInfo';
import { Profile, ProfileRef } from '../../components/forms/profile/Profile';
import { Header } from '../../components/Header';
import { useCreatePatient } from '../../hooks/useCreatePatient';
import { useUpdatePatient } from '../../hooks/useUpdatePatient';
import { validateAllSections, collectFormData } from './patientFormService';
import styles from './styles/index.module.scss';
import { VisitTypeSelector } from './visitTypeSelector';

const CreatePatient = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { patientUuid: patientUuidFromUrl } = useParams<{
    patientUuid: string;
  }>();

  // Determine if we're in edit mode based on URL parameter
  const isEditMode = !!patientUuidFromUrl;
  const [patientUuid, setPatientUuid] = useState<string | null>(
    patientUuidFromUrl ?? null,
  );
  const [patientIdentifier, setPatientIdentifier] = useState<string | null>(
    null,
  );

  const patientProfileRef = useRef<ProfileRef>(null);
  const patientAddressRef = useRef<AddressInfoRef>(null);
  const patientContactRef = useRef<ContactInfoRef>(null);
  const patientAdditionalRef = useRef<AdditionalInfoRef>(null);

  // Fetch patient data if in edit mode
  // TODO: Transform FHIR Patient data to form data and populate fields
  useQuery({
    queryKey: ['patient', patientUuidFromUrl],
    queryFn: () => getPatientById(patientUuidFromUrl!),
    enabled: isEditMode,
  });

  // Use the appropriate mutation based on mode
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();

  // Dispatch audit event when page is viewed
  useEffect(() => {
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_NEW_PATIENT_PAGE
        .eventType as AuditEventType,
      module: AUDIT_LOG_EVENT_DETAILS.VIEWED_NEW_PATIENT_PAGE.module,
    });
  }, []);

  // Track patient UUID and identifier after successful creation/update
  useEffect(() => {
    if (createPatientMutation.isSuccess && createPatientMutation.data) {
      const response = createPatientMutation.data as CreatePatientResponse;
      if (response?.patient?.uuid) {
        setPatientUuid(response.patient.uuid);
      }
      if (response?.patient?.identifiers?.[0]?.identifier) {
        setPatientIdentifier(response.patient.identifiers[0].identifier);
      }
    }
  }, [createPatientMutation.isSuccess, createPatientMutation.data]);

  useEffect(() => {
    if (updatePatientMutation.isSuccess && updatePatientMutation.data) {
      const response = updatePatientMutation.data as CreatePatientResponse;
      if (response?.patient?.uuid) {
        setPatientUuid(response.patient.uuid);
      }
      if (response?.patient?.identifiers?.[0]?.identifier) {
        setPatientIdentifier(response.patient.identifiers[0].identifier);
      }
    }
  }, [updatePatientMutation.isSuccess, updatePatientMutation.data]);

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

    // Trigger mutation with collected data (create or update)
    try {
      if (isEditMode && patientUuid) {
        // Update existing patient
        const response = (await updatePatientMutation.mutateAsync({
          patientUuid,
          ...formData,
        })) as CreatePatientResponse;
        if (response?.patient?.uuid) {
          return response.patient.uuid;
        }
      } else {
        // Create new patient
        const response = (await createPatientMutation.mutateAsync(
          formData,
        )) as CreatePatientResponse;
        if (response?.patient?.uuid) {
          const newPatientUuid = response.patient.uuid;
          // Navigate to edit patient page after successful save
          navigate(`/registration/edit/${newPatientUuid}`);
          return newPatientUuid;
        }
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
    {
      label: isEditMode
        ? t('EDIT_PATIENT_BREADCRUMB_CURRENT')
        : t('CREATE_PATIENT_BREADCRUMB_CURRENT'),
    },
  ];

  const isPending = isEditMode
    ? updatePatientMutation.isPending
    : createPatientMutation.isPending;

  return (
    <BaseLayout
      header={<Header breadcrumbs={breadcrumbs} />}
      main={
        <div>
          <Tile className={styles.patientDetailsHeader}>
            <span className={styles.sectionTitle}>
              {isEditMode
                ? t('EDIT_PATIENT_HEADER_TITLE')
                : t('CREATE_PATIENT_HEADER_TITLE')}
            </span>
          </Tile>

          <div className={styles.formContainer}>
            <Profile
              ref={patientProfileRef}
              patientIdentifier={patientIdentifier}
            />
            <AddressInfo ref={patientAddressRef} />
            <ContactInfo ref={patientContactRef} />
            <AdditionalInfo ref={patientAdditionalRef} />
          </div>

          {/* Footer Actions */}
          <div className={styles.formActions}>
            <Button
              kind="tertiary"
              onClick={() => navigate('/registration/search')}
            >
              {t('CREATE_PATIENT_BACK_TO_SEARCH')}
            </Button>
            <div className={styles.actionButtons}>
              <Button
                kind="tertiary"
                onClick={handleSave}
                disabled={isPending || (!isEditMode && patientUuid != null)}
              >
                {isPending ? 'Saving...' : t('CREATE_PATIENT_SAVE')}
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
