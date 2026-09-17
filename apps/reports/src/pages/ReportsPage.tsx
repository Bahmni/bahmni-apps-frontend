import {
  BaseLayout,
  Header,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@bahmni/design-system';
import { BAHMNI_HOME_PATH, useTranslation } from '@bahmni/services';
import { UserGlobalAction } from '@bahmni/widgets';
import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MY_REPORTS_TAB_PATH, REPORTS_TAB_PATH } from '../constants/app';
import styles from './styles/ReportsPage.module.scss';

const MY_REPORTS_TAB_INDEX = 1;
const REPORTS_TAB_INDEX = 0;

export const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const breadcrumbItems = useMemo(
    () => [
      { id: 'home', label: t('REPORTS_HOME_LABEL'), href: BAHMNI_HOME_PATH },
      { id: 'reports', label: t('REPORTS_LABEL'), isCurrentPage: true },
    ],
    [t],
  );

  const selectedIndex = location.pathname.endsWith('/my-reports')
    ? MY_REPORTS_TAB_INDEX
    : REPORTS_TAB_INDEX;

  const handleTabChange = ({
    selectedIndex: index,
  }: {
    selectedIndex: number;
  }) => {
    navigate(
      index === MY_REPORTS_TAB_INDEX ? MY_REPORTS_TAB_PATH : REPORTS_TAB_PATH,
    );
  };

  return (
    <BaseLayout
      header={
        <div
          id="reports-page-header"
          data-testid="reports-page-header-test-id"
          aria-label="Reports Page Header"
        >
          <Header
            breadcrumbItems={breadcrumbItems}
            userMenu={<UserGlobalAction />}
          />
        </div>
      }
      main={
        <div
          id="reports-page"
          data-testid="reports-page-test-id"
          aria-label="Reports Page"
          className={styles.page}
        >
          <Tabs selectedIndex={selectedIndex} onChange={handleTabChange}>
            <TabList
              id="reports-tab-list"
              data-testid="reports-tab-list-test-id"
              aria-label={t('REPORTS_TAB_LIST_ARIA_LABEL')}
            >
              <Tab
                id="reports-tab"
                data-testid="reports-tab-test-id"
                aria-label={t('REPORTS_TAB_LABEL')}
              >
                {t('REPORTS_TAB_LABEL')}
              </Tab>
              <Tab
                id="my-reports-tab"
                data-testid="my-reports-tab-test-id"
                aria-label={t('REPORTS_MY_REPORTS_TAB_LABEL')}
              >
                {t('REPORTS_MY_REPORTS_TAB_LABEL')}
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel
                id="reports-tab-panel"
                data-testid="reports-tab-panel-test-id"
                aria-label={t('REPORTS_TAB_LABEL')}
                className={styles.panel}
              >
                <p>{t('REPORTS_TAB_PLACEHOLDER')}</p>
              </TabPanel>
              <TabPanel
                id="my-reports-tab-panel"
                data-testid="my-reports-tab-panel-test-id"
                aria-label={t('REPORTS_MY_REPORTS_TAB_LABEL')}
                className={styles.panel}
              >
                <p>{t('REPORTS_MY_REPORTS_TAB_PLACEHOLDER')}</p>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      }
    />
  );
};

export default ReportsPage;
