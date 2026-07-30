import { BaseLayout, Button, Header } from '@bahmni/design-system';
import {
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  BAHMNI_HOME_PATH,
  dispatchAuditEvent,
  useTranslation,
} from '@bahmni/services';
import { SearchPatient, UserGlobalAction } from '@bahmni/widgets';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistrationConfig } from '../../providers/registrationConfig';
import styles from './styles/index.module.scss';

const RegistrationList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { registrationConfig } = useRegistrationConfig();

  useEffect(() => {
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH
        .eventType as AuditEventType,
      module: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH.module,
    });
  }, []);

  const breadcrumbs = [
    {
      id: 'home',
      label: t('CREATE_PATIENT_BREADCRUMB_HOME'),
      href: BAHMNI_HOME_PATH,
    },
    {
      id: 'registration',
      label: t('CREATE_PATIENT_BREADCRUMB_REGISTRATION_SEARCH'),
      isCurrentPage: true,
    },
  ];

  return (
    <BaseLayout
      header={
        <>
          <Header
            breadcrumbItems={breadcrumbs}
            userMenu={<UserGlobalAction />}
          />
          <Button
            onClick={() => navigate('/registration/patient/new')}
            size="md"
            className={styles.headerButton}
            data-testid="create-new-patient-button"
          >
            {t('CREATE_PATIENT_BUTTON_TEXT')}
          </Button>
        </>
      }
      main={
        <div className={styles.main}>
          <SearchPatient
            patientSearch={registrationConfig?.patientSearch}
            buttonTitle={t('REGISTRATION_PATIENT_SEARCH_BUTTON_TITLE')}
            searchBarPlaceholder={t(
              'REGISTRATION_PATIENT_SEARCH_INPUT_PLACEHOLDER',
            )}
          />
        </div>
      }
    />
  );
};

export default RegistrationList;
