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
  getPatientImageAsDataUrl,
  PatientProfileResponse,
  getPatientProfile,
  formatDate,
  REGISTRATION_DATE_FORMAT,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AdditionalIdentifiers,
  AdditionalIdentifiersRef,
} from '../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
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
import {
  PatientRelationships,
  PatientRelationshipsRef,
} from '../../components/forms/patientRelationships/PatientRelationships';
import { Profile, ProfileRef } from '../../components/forms/profile/Profile';
import { BAHMNI_REGISTRATION_SEARCH, getPatientUrl } from '../../constants/app';

import { useAdditionalIdentifiers } from '../../hooks/useAdditionalIdentifiers';
import { useCreatePatient } from '../../hooks/useCreatePatient';
import { useRelationshipValidation } from '../../hooks/useRelationshipValidation';
import { useUpdatePatient } from '../../hooks/useUpdatePatient';
import { useGenderData } from '../../utils/identifierGenderUtils';
import {
  convertToBasicInfoData,
  convertToContactData,
  convertToAdditionalData,
  convertToAddressData,
} from '../../utils/patientDataConverter';
import { validateAllSections, collectFormData } from './patientFormService';
import styles from './styles/index.module.scss';
import { VisitTypeSelector } from './visitTypeSelector';

const PatientRegister = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getGenderDisplay } = useGenderData(t);
  const { addNotification } = useNotification();
  const { patientUuid: patientUuidFromUrl } = useParams<{
    patientUuid: string;
  }>();
  const [patientIdentifier, setPatientIdentifier] = useState<string>('');
  const [registerDate, setRegisterDate] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const { relationshipTypes } = useRelationshipValidation();

  // Determine if we're in edit mode based on URL parameter
  const [isEditMode, setIsEditMode] = useState(!!patientUuidFromUrl);
  const [patientUuid, setPatientUuid] = useState<string | null>(
    patientUuidFromUrl ?? null,
  );

  const { shouldShowAdditionalIdentifiers } = useAdditionalIdentifiers();

  const patientProfileRef = useRef<ProfileRef>(null);
  const patientAddressRef = useRef<AddressInfoRef>(null);
  const patientContactRef = useRef<ContactInfoRef>(null);
  const patientAdditionalRef = useRef<AdditionalInfoRef>(null);
  const patientRelationshipsRef = useRef<PatientRelationshipsRef>(null);
  const patientAdditionalIdentifiersRef =
    useRef<AdditionalIdentifiersRef>(null);

  const { data: patientDetails } = useQuery({
    queryKey: ['formattedPatient', patientUuidFromUrl],
    queryFn: () => getPatientProfile(patientUuidFromUrl!),
    enabled: isEditMode,
    refetchOnMount: false,
  });

  const { data: patientPhoto } = useQuery({
    queryKey: ['patientPhoto', patientUuidFromUrl],
    queryFn: () => getPatientImageAsDataUrl(patientUuidFromUrl!),
    enabled: isEditMode,
  });

  const profileInitialData = useMemo(
    () => convertToBasicInfoData(patientDetails, getGenderDisplay),
    [patientDetails, getGenderDisplay],
  );

  const contactInitialData = useMemo(
    () => convertToContactData(patientDetails),
    [patientDetails],
  );

  const additionalInitialData = useMemo(
    () => convertToAdditionalData(patientDetails),
    [patientDetails],
  );

  const addressInitialData = useMemo(
    () => convertToAddressData(patientDetails),
    [patientDetails],
  );

  const initialDobEstimated = useMemo(
    () => patientDetails?.patient?.person?.birthdateEstimated ?? false,
    [patientDetails],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getRegisterDate = (obj: any): void => {
    const dateCreated = obj?.patient?.auditInfo?.dateCreated;
    if (!dateCreated) {
      return;
    }
    const result = formatDate(dateCreated, t, REGISTRATION_DATE_FORMAT);
    if (!result.error) {
      setRegisterDate(result.formattedResult);
    }
  };

  useEffect(() => {
    if (patientDetails) {
      setPatientUuid(patientDetails.patient.uuid);
      setPatientIdentifier(
        patientDetails.patient.identifiers[0].identifier ?? '',
      );
      getRegisterDate(patientDetails);
      setPatientName(patientDetails.patient.person.display ?? '');
      setIsEditMode(false);
      queryClient.removeQueries({
        queryKey: ['formattedPatient', patientUuidFromUrl],
      });
    }
  }, [patientDetails, patientUuidFromUrl, queryClient]);

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
        })) as PatientProfileResponse;
        if (response?.patient?.uuid) {
          queryClient.setQueryData(['formattedPatient', patientUuid], response);
          setPatientUuid(response.patient.uuid);
          setPatientIdentifier(
            response.patient.identifiers[0].identifier ?? '',
          );
          setPatientName(response.patient.person.display ?? '');
          getRegisterDate(response);
          return response.patient.uuid;
        }
      } else {
        const response = (await createPatientMutation.mutateAsync(
          formData,
        )) as PatientProfileResponse;
        if (response?.patient?.uuid) {
          const newPatientUuid = response.patient.uuid;
          queryClient.setQueryData(
            ['formattedPatient', newPatientUuid],
            response,
          );
          setPatientUuid(newPatientUuid);
          setPatientIdentifier(
            response.patient.identifiers[0].identifier ?? '',
          );
          setPatientName(response.patient.person.display ?? '');
          getRegisterDate(response);
          navigate(getPatientUrl(newPatientUuid));
          return newPatientUuid;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const breadcrumbs = [
    {
      id: 'home',
      label: t('CREATE_PATIENT_BREADCRUMB_HOME'),
      href: BAHMNI_HOME_PATH,
    },
    {
      id: 'search',
      label: t('CREATE_PATIENT_BREADCRUMB_SEARCH'),
      href: BAHMNI_REGISTRATION_SEARCH,
    },
    {
      id: 'current',
      label: patientUuid ? patientName : t('CREATE_PATIENT_BREADCRUMB_CURRENT'),
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
          <Tile className={styles.patientDetailsHeader}>
            <span className={styles.sectionTitle}>
              {patientUuid ? (
                <div className={styles.infoContainer}>
                  <div
                    className={styles.patientId}
                  >{`Patient ID: ${patientIdentifier}`}</div>
                  <div
                    className={styles.registerDate}
                  >{`${t('CREATE_PATIENT_REGISTERED_ON')} ${registerDate}`}</div>
                </div>
              ) : (
                t('CREATE_PATIENT_HEADER_TITLE')
              )}
            </span>
          </Tile>

          <div className={styles.formContainer}>
            <Profile
              ref={patientProfileRef}
              initialData={profileInitialData}
              initialDobEstimated={initialDobEstimated}
              initialPhoto={patientPhoto}
            />
            <AddressInfo
              ref={patientAddressRef}
              initialData={addressInitialData}
            />
            <ContactInfo
              ref={patientContactRef}
              initialData={contactInitialData}
            />
            <AdditionalInfo
              ref={patientAdditionalRef}
              initialData={additionalInitialData}
            />
          </div>

          <AdditionalInfo ref={patientAdditionalRef} />

          {Array.isArray(relationshipTypes) && relationshipTypes.length > 0 && (
            <PatientRelationships ref={patientRelationshipsRef} />
          )}
          {shouldShowAdditionalIdentifiers && (
            <>
              <Tile className={styles.patientDetailsHeader}>
                <span className={styles.sectionTitle}>
                  {t('ADDITIONAL_IDENTIFIERS_HEADER_TITLE')}
                </span>
              </Tile>

              <AdditionalIdentifiers ref={patientAdditionalIdentifiersRef} />
            </>
          )}

          {/* Footer Actions */}
          <div className={styles.formActions}>
            <Button
              kind="tertiary"
              onClick={() => navigate('/registration/search')}
            >
              {t('CREATE_PATIENT_BACK_TO_SEARCH')}
            </Button>
            <div className={styles.actionButtons}>
              <Button kind="tertiary" onClick={handleSave}>
                {t('CREATE_PATIENT_SAVE')}
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
export default PatientRegister;
