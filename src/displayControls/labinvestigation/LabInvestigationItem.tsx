import React from 'react';
import { Tag } from '@carbon/react';
import BahmniIcon from "@components/common/bahmniIcon/BahmniIcon";
import { ICON_SIZE } from '@/constants/icon';
import * as styles from './styles/LabInvestigation.module.scss';
import { FormattedLabTest, LabTestPriority } from '@/types/labInvestigation';

interface LabInvestigationItemProps {
  test: FormattedLabTest;
}
const LabInvestigationItem: React.FC<LabInvestigationItemProps> = ({ test }) => {
  // Determine tag color based on priority
  const getTagType = (priority: LabTestPriority): 'gray' | 'green' => {
    switch (priority) {
      case LabTestPriority.Stat:
        return 'gray' as const;
      case LabTestPriority.Routine:
        return 'green' as const;
      default:
        return 'green' as const;
    }
  };

  return (
    <div className={styles.labBox}>
      <div className={styles.labHeader}>
        <strong>{test.testName}</strong>
        <Tag type={getTagType(test.priority)}>{test.priority}</Tag>
        <div className={styles.orderedBy}>
          <BahmniIcon name="fa-user" size={ICON_SIZE.SM} id="homeIcon" />
          Ordered by: {test.orderedBy}
        </div>
      </div>
      <div>
        Results pending…
      </div>
    </div>
  );
};

export default LabInvestigationItem;
