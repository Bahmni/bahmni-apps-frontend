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
} from '@bahmni/services';
import { useRef, useState, useEffect } from 'react';
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
import { BAHMNI_REGISTRATION_SEARCH } from '../../constants/app';

import { useCreatePatient } from '../../hooks/useCreatePatient';
import { validateAllSections, collectFormData } from './patientFormService';
import styles from './styles/index.module.scss';
import { VisitTypeSelector } from './visitTypeSelector';

const CreatePatient = () => {
  const { t } = useTranslation();
  const [patientUuid, setPatientUuid] = useState<string | null>(null);

  const patientProfileRef = useRef<ProfileRef>(null);
  const patientAddressRef = useRef<AddressInfoRef>(null);
  const patientContactRef = useRef<ContactInfoRef>(null);
  const patientAdditionalRef = useRef<AdditionalInfoRef>(null);

  // Use the custom hook for patient creation
  const createPatientMutation = useCreatePatient();

  // Dispatch audit event when page is viewed
  useEffect(() => {
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_NEW_PATIENT_PAGE
        .eventType as AuditEventType,
      module: AUDIT_LOG_EVENT_DETAILS.VIEWED_NEW_PATIENT_PAGE.module,
    });
  }, []);

  // Track patient UUID after successful creation
  useEffect(() => {
    if (createPatientMutation.isSuccess && createPatientMutation.data) {
      const response = createPatientMutation.data;
      if (response?.patient?.uuid) {
        setPatientUuid(response.patient.uuid);
      }
    }
  }, [createPatientMutation.isSuccess, createPatientMutation.data]);

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

    // Trigger mutation with collected data
    try {
      const response = await createPatientMutation.mutateAsync(formData);
      if (response?.patient?.uuid) {
        return response.patient.uuid;
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
      label: t('CREATE_PATIENT_BREADCRUMB_CURRENT'),
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
              {t('CREATE_PATIENT_HEADER_TITLE')}
            </span>
          </Tile>

          <div className={styles.formContainer}>
            <Profile ref={patientProfileRef} />
            <AddressInfo ref={patientAddressRef} />
            <ContactInfo ref={patientContactRef} />
            <AdditionalInfo ref={patientAdditionalRef} />
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
                disabled={
                  createPatientMutation.isPending || patientUuid != null
                }
              >
                {createPatientMutation.isPending
                  ? 'Saving...'
                  : t('CREATE_PATIENT_SAVE')}
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
