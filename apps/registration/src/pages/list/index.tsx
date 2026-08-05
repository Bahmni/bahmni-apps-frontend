import {
  BaseLayout,
  CodeSnippetSkeleton,
  Header,
  Button,
} from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  useTranslation,
  filterExtensionsByPrivileges,
  groupExtensionsByPoint,
} from '@bahmni/services';
import { useUserPrivilege, UserGlobalAction } from '@bahmni/widgets';
import { Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistrationConfig } from '../../providers/registrationConfig';
import { EXTENSION_HANDLERS } from './constants';
import styles from './styles/index.module.scss';

const RegistrationList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { registrationConfig } = useRegistrationConfig();
  const { userPrivileges } = useUserPrivilege();

  const breadcrumbItems = useMemo(
    () => [
      { id: 'home', label: t('HOME_LABEL'), href: BAHMNI_HOME_PATH },
      {
        id: 'registration',
        label: t('REGISTRATION_LABEL'),
        isCurrentPage: true,
      },
    ],
    [t],
  );

  const handleCreateNewPatient = () => {
    navigate('/registration/patient/new');
  };

  const extensionsByPoint = useMemo(
    () => groupExtensionsByPoint(registrationConfig?.extensions ?? []),
    [registrationConfig],
  );

  const visibleHandlers = useMemo(
    () =>
      Array.from(extensionsByPoint.entries())
        .map(([pointId, extensions]) => ({
          pointId,
          Handler: EXTENSION_HANDLERS[pointId],
          filtered: filterExtensionsByPrivileges(extensions, userPrivileges),
        }))
        .filter(({ Handler, filtered }) => !!Handler && filtered.length > 0),
    [extensionsByPoint, userPrivileges],
  );

  return (
    <BaseLayout
      header={
        <>
          <Header
            breadcrumbItems={breadcrumbItems}
            userMenu={<UserGlobalAction />}
          />
          <Button
            onClick={handleCreateNewPatient}
            size="md"
            className={styles.headerButton}
            data-testid="create-new-patient-button"
          >
            {t('CREATE_PATIENT_BUTTON_TEXT')}
          </Button>
        </>
      }
      main={
        <div
          id="registration-list-page"
          data-testid="registration-list-page-test-id"
          aria-label="Registration List Page"
          className={styles.page}
        >
          {visibleHandlers.length > 0 ? (
            visibleHandlers.map(({ pointId, Handler, filtered }) => (
              <div
                key={pointId}
                id={pointId}
                data-testid={`${pointId}-test-id`}
              >
                <Suspense
                  fallback={
                    <CodeSnippetSkeleton
                      type="multi"
                      className={styles.loading}
                    />
                  }
                >
                  <Handler extensions={filtered} />
                </Suspense>
              </div>
            ))
          ) : (
            <p
              id="no-extensions-configured"
              data-testid="no-extensions-configured-test-id"
              aria-label="No extensions configured"
              className={styles.message}
            >
              {t('NO_EXTENSIONS_CONFIGURED')}
            </p>
          )}
        </div>
      }
    />
  );
};

export default RegistrationList;
