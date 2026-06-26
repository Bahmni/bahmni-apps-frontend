import { BaseLayout, Header } from '@bahmni/design-system';
import { BAHMNI_HOME_PATH, useTranslation } from '@bahmni/services';
import { Extensions } from '@bahmni/widgets';
import { useMemo } from 'react';
import { CLINICAL_SEARCH_CONFIG_URL } from './constants';
import styles from './styles/index.module.scss';

const ClinicalList = () => {
  const { t } = useTranslation();

  const breadcrumbItems = useMemo(
    () => [
      { id: 'home', label: t('HOME_LABEL'), href: BAHMNI_HOME_PATH },
      { id: 'clinical', label: t('CLINICAL_LABEL'), isCurrentPage: true },
    ],
    [t],
  );

  return (
    <div
      id="clinical-list-page"
      data-testid="clinical-list-page-test-id"
      aria-label="Clinical List"
      className={styles.page}
    >
      <BaseLayout
        header={<Header breadcrumbItems={breadcrumbItems} />}
        main={
          <div
            id="clinical-list-tabs"
            data-testid="clinical-list-tabs-test-id"
            aria-label="Clinical List Tabs"
            className={styles.tabs}
          >
            <Extensions configUrl={CLINICAL_SEARCH_CONFIG_URL} />
          </div>
        }
      />
    </div>
  );
};

export default ClinicalList;
