import React, { ReactNode } from 'react';
import * as styles from './styles/ClinicalLayout.module.scss';

interface ClinicalLayoutProps {
  header: ReactNode;
  patientDetails: ReactNode;
  sidebar: ReactNode;
  mainDisplay: ReactNode;
}

/**
 * Clinical Layout component that provides the main layout structure
 * for clinical pages with four distinct sections:
 * 1. Header - at the top of the screen, full width
 * 2. Patient Details - below header, spans full width
 * 3. Sidebar - left side below patient details
 * 4. Main Display - right side, scrollable content area
 *
 * @param {ReactNode} header - The header component
 * @param {ReactNode} patientDetails - The patient details component
 * @param {ReactNode} sidebar - The sidebar component
 * @param {ReactNode} mainDisplay - The main content to display
 * @returns {React.ReactElement} The ClinicalLayout component
 */
const ClinicalLayout: React.FC<ClinicalLayoutProps> = ({
  header,
  patientDetails,
  sidebar,
  mainDisplay,
}) => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>{header}</header>
      <div className={styles.body}>
        <section className={styles.patientDetails}>{patientDetails}</section>
        <div className={styles.sidebar}>{sidebar}</div>
        <div className={styles.mainDisplay}>{mainDisplay}</div>
      </div>
    </div>
  );
};

export default ClinicalLayout;
