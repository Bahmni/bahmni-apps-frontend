import { Tag } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import BahmniIcon from '@components/common/bahmniIcon/BahmniIcon';
import { ICON_SIZE } from '@constants/icon';
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
      <div className={styles.labHeader}>
        <div>
          <strong>{test.testName}</strong>
          {test.testType === 'Panel' && (
            <span className={styles.testType}>
              {t(`LAB_TEST_${test.testType.toUpperCase()}`)}
            </span>
          )}
        </div>
        {test.priority === LabTestPriority.stat && (
          <Tag
            className={styles['yellow-tag']}
            data-testid={`lab-test-priority-${test.priority}`}
          >
            {t(`LAB_TEST_${test.priority.toUpperCase()}`)}
          </Tag>
        )}
        <div className={styles.orderedBy}>
          <BahmniIcon name="fa-user" size={ICON_SIZE.SM} id="homeIcon" />
          {t('LAB_TEST_ORDERED_BY')}: {test.orderedBy}
        </div>
      </div>
      <div>{t('LAB_TEST_RESULTS_PENDING')}</div>
    </div>
  );
};

export default LabInvestigationItem;
