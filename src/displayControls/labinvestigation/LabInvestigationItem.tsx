import React from 'react';
import { Tag } from '@carbon/react';
import BahmniIcon from "@components/common/bahmniIcon/BahmniIcon";
import { ICON_SIZE } from '@/constants/icon';
import * as styles from './styles/LabInvestigation.module.scss';
import { FormattedLabTest, LabTestResult, LabTestStatus, LabTestPriority } from '@/types/labInvestigation';

interface LabInvestigationItemProps {
  test: FormattedLabTest;
}

const LabInvestigationItem: React.FC<LabInvestigationItemProps> = ({ test }) => {
  // Determine tag color based on priority
  const getTagType = (priority: LabTestPriority) => {
    switch (priority) {
      case LabTestPriority.Stat:
        return 'red';
      case LabTestPriority.Urgent:
        return 'magenta';
      case LabTestPriority.Routine:
      default:
        return 'green';
    }
  };

  // Determine status display
  const getStatusDisplay = (status: LabTestStatus) => {
    switch (status) {
      case LabTestStatus.Abnormal:
        return <span className={`${styles.testType} ${styles.abnormal}`}>{status}</span>;
      case LabTestStatus.Normal:
        return <span className={`${styles.testType} ${styles.normal}`}>{status}</span>;
      case LabTestStatus.Pending:
      default:
        return <span className={styles.testType}>{status}</span>;
    }
  };

  // Get the results array if available
  const results = Array.isArray(test.result) ? test.result : [];
  return (
    <div className={styles.labBox}>
      <div className={styles.labHeader}>
        <strong>{test.testName}</strong>
        {getStatusDisplay(test.status)}
        <Tag type={getTagType(test.priority)}>{test.priority}</Tag>
        <div className={styles.orderedBy}>
          <BahmniIcon name="fa-user" size={ICON_SIZE.SM} id="homeIcon" />
          Ordered by: {test.orderedBy}
        </div>
      </div>

      {results && results.length > 0 ? (
        <table className={styles.resultsTable}>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Reference Range</th>
            </tr>
          </thead>
          <tbody>
            {results.map((res, index) => (
              <tr key={index}>
                <td>{res.parameter}</td>
                <td>{res.value}</td>
                <td>{res.unit}</td>
                <td>{res.referenceRange}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.labResult}>Results pending...</div>
      )}
    </div>
  );
};

export default LabInvestigationItem;
