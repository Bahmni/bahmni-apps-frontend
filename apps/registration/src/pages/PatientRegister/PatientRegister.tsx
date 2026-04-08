import {
  Button,
  Tile,
  BaseLayout,
  Header,
  Icon,
  ICON_SIZE,
} from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  useTranslation,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  PatientProfileResponse,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdditionalIdentifiersRef } from '../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import { AdditionalInfoRef } from '../../components/forms/additionalInfo/AdditionalInfo';
import { AddressInfoRef } from '../../components/forms/addressInfo/AddressInfo';
import { ContactInfoRef } from '../../components/forms/contactInfo/ContactInfo';
import { PatientRelationshipsRef } from '../../components/forms/patientRelationships/PatientRelationships';
import Profile, { ProfileRef } from '../../components/forms/profile/Profile';
import { RegistrationActions } from '../../components/registrationActions/RegistrationActions';
import { BAHMNI_REGISTRATION_SEARCH, getPatientUrl } from '../../constants/app';

import { useAdditionalIdentifiers } from '../../hooks/useAdditionalIdentifiers';
import { useCreatePatient } from '../../hooks/useCreatePatient';
import { usePatientDetails } from '../../hooks/usePatientDetails';
import { usePatientPhoto } from '../../hooks/usePatientPhoto';
import { useRelationshipValidation } from '../../hooks/useRelationshipValidation';
import { useUpdatePatient } from '../../hooks/useUpdatePatient';
import { useRegistrationConfig } from '../../providers/registrationConfig';
import { RegistrationFormSection } from '../../providers/registrationConfig/models';
import { FormControlRefs, FormControlData, FormControlGuards } from './models';
import { validateAllSections, collectFormData } from './patientFormService';
import PatientRegisterSection from './PatientRegisterSection';
import styles from './styles/index.module.scss';

const PatientRegister = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { patientUuid: patientUuidFromUrl } = useParams<{
    patientUuid: string;
  }>();

  const [patientUuid, setPatientUuid] = useState<string | null>(
    patientUuidFromUrl ?? null,
  );

  const { shouldShowAdditionalIdentifiers } = useAdditionalIdentifiers();
  const { relationshipTypes } = useRelationshipValidation();
  const { registrationConfig } = useRegistrationConfig();

  const patientProfileRef = useRef<ProfileRef>(null);
  const patientAddressRef = useRef<AddressInfoRef>(null);
  const patientContactRef = useRef<ContactInfoRef>(null);
  const patientAdditionalRef = useRef<AdditionalInfoRef>(null);
  const patientRelationshipsRef = useRef<PatientRelationshipsRef>(null);
  const patientAdditionalIdentifiersRef =
    useRef<AdditionalIdentifiersRef>(null);

  const {
    profileInitialData,
    personAttributesInitialData,
    addressInitialData,
    additionalIdentifiersInitialData,
    relationshipsInitialData,
    initialDobEstimated,
    metadata: initialMetadata,
  } = usePatientDetails({
    patientUuid: patientUuidFromUrl,
  });

  const [metadata, setMetadata] = useState(initialMetadata);

  const { patientPhoto } = usePatientPhoto({
    patientUuid: metadata?.patientUuid,
  });

  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata);
    }
  }, [initialMetadata]);

  useEffect(() => {
    if (metadata?.patientUuid) {
      setPatientUuid(metadata.patientUuid);
    }
  }, [metadata]);

  // Use the appropriate mutation based on mode
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();

  const isSaving =
    createPatientMutation.isPending || updatePatientMutation.isPending;

  // Dispatch audit event when page is viewed
  useEffect(() => {
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_NEW_PATIENT_PAGE
        .eventType as AuditEventType,
      module: AUDIT_LOG_EVENT_DETAILS.VIEWED_NEW_PATIENT_PAGE.module,
    });
  }, []);

  const handleSave = async (): Promise<string | null> => {
    const isValid = validateAllSections(
      {
        profileRef: patientProfileRef,
        addressRef: patientAddressRef,
        contactRef: patientContactRef,
        additionalRef: patientAdditionalRef,
        relationshipsRef: patientRelationshipsRef,
        additionalIdentifiersRef: patientAdditionalIdentifiersRef,
      },
      addNotification,
      t,
      {
        shouldValidateAdditionalIdentifiers: shouldShowAdditionalIdentifiers,
      },
    );

    if (!isValid) {
      return null;
    }

    const formData = collectFormData(
      {
        profileRef: patientProfileRef,
        addressRef: patientAddressRef,
        contactRef: patientContactRef,
        additionalRef: patientAdditionalRef,
        relationshipsRef: patientRelationshipsRef,
        additionalIdentifiersRef: patientAdditionalIdentifiersRef,
      },
      addNotification,
      t,
    );

    if (!formData) {
      return null;
    }

    try {
      if (patientUuid) {
        const response = (await updatePatientMutation.mutateAsync({
          patientUuid,
          ...formData,
          additionalIdentifiersInitialData,
        })) as PatientProfileResponse;
        if (response?.patient?.uuid) {
          setMetadata({
            ...metadata,
            patientName: response.patient.person.display ?? '',
          });
          patientRelationshipsRef.current?.removeDeletedRelationships();
          return response.patient.uuid;
        }
      } else {
        const response = (await createPatientMutation.mutateAsync(
          formData,
        )) as PatientProfileResponse;
        if (response?.patient?.uuid) {
          const newPatientUuid = response.patient.uuid;
          setPatientUuid(newPatientUuid);
          navigate(getPatientUrl(newPatientUuid));
          return newPatientUuid;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const shouldShowActions = metadata?.patientUuid || patientUuidFromUrl == null;
  const sections: RegistrationFormSection[] =
    registrationConfig?.registrationForm?.sections ?? [];
  const refs = useMemo<FormControlRefs>(
    () => ({
      profileRef: patientProfileRef,
      addressRef: patientAddressRef,
      contactRef: patientContactRef,
      additionalRef: patientAdditionalRef,
      additionalIdentifiersRef: patientAdditionalIdentifiersRef,
      relationshipsRef: patientRelationshipsRef,
    }),
    [],
  );

  const data = useMemo<FormControlData>(
    () => ({
      profileInitialData,
      addressInitialData,
      personAttributesInitialData,
      additionalIdentifiersInitialData,
      relationshipsInitialData,
      initialDobEstimated,
      patientPhoto: patientPhoto ?? undefined,
    }),
    [
      profileInitialData,
      addressInitialData,
      personAttributesInitialData,
      additionalIdentifiersInitialData,
      relationshipsInitialData,
      initialDobEstimated,
      patientPhoto,
    ],
  );

  const guards = useMemo<FormControlGuards>(
    () => ({
      shouldShowAdditionalIdentifiers,
      relationshipTypes,
    }),
    [shouldShowAdditionalIdentifiers, relationshipTypes],
  );

  const breadcrumbs = [
    {
      id: 'home',
      label: t('CREATE_PATIENT_BREADCRUMB_HOME'),
      href: BAHMNI_HOME_PATH,
    },
    {
      id: 'registration',
      label: t('CREATE_PATIENT_BREADCRUMB_REGISTRATION_SEARCH'),
      href: BAHMNI_REGISTRATION_SEARCH,
    },
    {
      id: 'current',
      label:
        patientUuid && metadata?.patientName
          ? metadata.patientName
          : t('CREATE_PATIENT_BREADCRUMB_CURRENT'),
      isCurrentPage: true,
    },
  ];
  const globalActions = [
    {
      id: 'user',
      label: 'user',
      renderIcon: <Icon id="user" name="fa-user" size={ICON_SIZE.LG} />,
      onClick: () => {},
    },
  ];

  return (
    <BaseLayout
      header={
        <Header breadcrumbItems={breadcrumbs} globalActions={globalActions} />
      }
      main={
        <div>
          <div className={styles.form}>
            <Tile className={styles.patientDetailsHeader}>
              <span className={styles.sectionTitle}>
                {patientUuid ? (
                  <div className={styles.infoContainer}>
                    <div
                      className={styles.patientId}
                    >{`${t('REGISTRATION_PATIENT_SEARCH_HEADER_ID')} : ${metadata?.patientIdentifier}`}</div>
                    <div
                      className={styles.registerDate}
                    >{`${t('CREATE_PATIENT_REGISTERED_ON')} ${metadata?.registerDate}`}</div>
                  </div>
                ) : (
                  t('CREATE_PATIENT_HEADER_TITLE')
                )}
              </span>
            </Tile>
          </div>
          <div className={styles.formContainer}>
            <Profile
              ref={patientProfileRef}
              initialData={profileInitialData}
              initialDobEstimated={initialDobEstimated}
              initialPhoto={patientPhoto}
            />
          </div>
          {sections.map((section) => (
            <PatientRegisterSection
              key={section.name}
              section={section}
              refs={refs}
              data={data}
              guards={guards}
            />
          ))}

          {/* Footer Actions */}
          {shouldShowActions && (
            <div className={styles.formActions}>
              <Button
                kind="tertiary"
                onClick={() => navigate('/registration/search')}
                data-testid="back-to-patient-search-button"
              >
                {t('CREATE_PATIENT_BACK_TO_SEARCH')}
              </Button>
              <div className={styles.actionButtons}>
                <Button
                  kind="tertiary"
                  onClick={handleSave}
                  disabled={isSaving}
                  data-testid="save-patient-button"
                >
                  {t('CREATE_PATIENT_SAVE')}
                </Button>
                <RegistrationActions
                  extensionPointId="org.bahmni.registration.navigation"
                  onBeforeNavigate={handleSave}
                />
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};
export default PatientRegister;
