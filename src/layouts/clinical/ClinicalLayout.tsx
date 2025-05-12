import React, { ReactNode } from 'react';
import * as styles from './styles/ClinicalLayout.module.scss';

interface ClinicalLayoutProps {
  headerWSideNav: ReactNode;
  patientDetails: ReactNode;
  mainDisplay: ReactNode;
}

/**
 * Clinical Layout component that provides the main layout structure
 * for clinical pages with four distinct sections:
 * 1. HeaderWSideNav - at the top of the screen, full width along with the left side navigation
 * 2. Patient Details - below header, spans full width
 * 3. Main Display - right side, scrollable content area
 *
 * @param {ReactNode} headerWSideNav - The header component
 * @param {ReactNode} patientDetails - The patient details component
 * @param {ReactNode} mainDisplay - The main content to display
 * @returns {React.ReactElement} The ClinicalLayout component
 */
const ClinicalLayout: React.FC<ClinicalLayoutProps> = ({
  headerWSideNav,
  patientDetails,
  mainDisplay,
}) => {
  return (
    <div className={styles.layout}>
      {headerWSideNav}
      <div className={styles.body}>
        <section className={styles.patientDetails}>{patientDetails}</section>
        <div className={styles.mainDisplay}>{mainDisplay}</div>
      </div>
    </div>
  );
};

export default ClinicalLayout;
