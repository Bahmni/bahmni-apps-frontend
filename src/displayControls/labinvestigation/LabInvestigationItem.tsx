import { Tag } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormattedLabTest, LabTestPriority } from '@types/labInvestigation';
import * as styles from './styles/LabInvestigation.module.scss';

interface LabInvestigationItemProps {
  test: FormattedLabTest;
}
const LabInvestigationItem: React.FC<LabInvestigationItemProps> = ({
  test,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.labBox}>
      <div className={styles.labHeaderWrapper}>
        <div className={styles.labTestNameWrapper}>
          <span>{test.testName}</span>
          {test.testType === 'Panel' && (
            <span className={styles.testInfo}>
              {t(`LAB_TEST_${test.testType.toUpperCase()}`)}
            </span>
          )}
          {test.priority === LabTestPriority.stat && (
            <Tag type="red" data-testid={`lab-test-priority-${test.priority}`}>
              {t(`LAB_TEST_${test.priority.toUpperCase()}`)}
            </Tag>
          )}
        </div>
        <span className={styles.testInfo}>
          {t('LAB_TEST_ORDERED_BY')}: {test.orderedBy}
        </span>
      </div>
      <div className={styles.testInfo}>
        {t('LAB_TEST_RESULTS_PENDING') + ' ....'}
      </div>
    </div>
  );
};

export default LabInvestigationItem;
