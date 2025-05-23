import React from 'react';
import { Tag } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import BahmniIcon from '@components/common/bahmniIcon/BahmniIcon';
import { ICON_SIZE } from '@/constants/icon';
import * as styles from './styles/LabInvestigation.module.scss';
import { FormattedLabTest, LabTestPriority } from '@/types/labInvestigation';

interface LabInvestigationItemProps {
  test: FormattedLabTest;
}
const LabInvestigationItem: React.FC<LabInvestigationItemProps> = ({
  test,
}) => {
  const { t } = useTranslation();

  // Determine tag color based on priority
  const getTagType = (priority: LabTestPriority): 'gray' | 'green' => {
    switch (priority) {
      case LabTestPriority.stat:
        return 'gray' as const;
      case LabTestPriority.routine:
        return 'green' as const;
      default:
        return 'green' as const;
    }
  };

  return (
    <div className={styles.labBox}>
      <div className={styles.labHeader}>
        <div>
          <strong>{test.testName}</strong>
          <span className={styles.testType}>
            {' '}
            {t(`LAB_TEST_${test.testType.replace(/\s+/g, '_').toUpperCase()}`)}
          </span>
        </div>
        <Tag type={getTagType(test.priority)}>
          {t(`LAB_TEST_${test.priority.toUpperCase()}`)}
        </Tag>
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
