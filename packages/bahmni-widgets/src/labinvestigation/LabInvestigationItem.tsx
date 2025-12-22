import { Tag, TooltipIcon } from '@bahmni/design-system';
import {
  useTranslation,
  FormattedLabTest,
  LabTestPriority,
} from '@bahmni/services';
import React from 'react';
import styles from './styles/LabInvestigation.module.scss';

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
          {test.note && (
            <TooltipIcon
              iconName="fa-file-lines"
              content={test.note}
              ariaLabel={test.note}
            />
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
