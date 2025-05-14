import React from 'react';
import { Tag } from '@carbon/react';
import BahmniIcon from "@components/common/bahmniIcon/BahmniIcon";
import { ICON_SIZE } from '@/constants/icon';
import * as styles from './styles/LabInvestigation.module.scss';

interface LabTestProps {
  testName: string;
  type: string;
  tag: string;
  orderedBy: string;
  result: string;
}

const LabTests: React.FC<LabTestProps> = ({ testName, type, tag, orderedBy, result }) => {
  return (
    <article className={styles.labBox}>
      <header className={styles.labHeader}>
        <strong>{testName}</strong>
        <span className={styles.testType}>{type}</span>
        <Tag type="green">{tag}</Tag>
        <span className={styles.orderedBy}>
          <BahmniIcon name="fa-user" size={ICON_SIZE.SM} id="homeIcon" />
          Ordered by: {orderedBy}
        </span>
      </header>
      <p className={styles.labResult}>{result}</p>
    </article>
  );
};

export default LabTests;