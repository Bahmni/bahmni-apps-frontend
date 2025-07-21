import classNames from 'classnames';
import React, { ReactNode } from 'react';
import * as styles from './styles/ClinicalLayout.module.scss';

interface ClinicalLayoutProps {
  headerWSideNav: ReactNode;
  patientHeader: ReactNode;
  mainDisplay: ReactNode;
  actionArea: ReactNode;
  isActionAreaVisible: boolean;
}

/**
 * Clinical Layout component that provides the main layout structure
 * for clinical pages with four distinct sections:
 * 1. HeaderWSideNav - at the top of the screen, full width along with the left side navigation
 * 2. Patient Details - below header, spans full width
 * 3. Main Display - right side, scrollable content area
 *
 * @param {ReactNode} headerWSideNav - The header component
 * @param {ReactNode} patientHeader - The patient header component
 * @param {ReactNode} mainDisplay - The main content to display
 * @param {ReactNode} actionArea - The action area component
 * @param {boolean} isActionAreaVisible - Flag to control visibility of the action area
 * @returns {React.ReactElement} The ClinicalLayout component
 */
const ClinicalLayout: React.FC<ClinicalLayoutProps> = ({
  headerWSideNav,
  patientHeader,
  mainDisplay,
  actionArea,
  isActionAreaVisible,
}) => {
  return (
    <div className={styles.layout}>
      {headerWSideNav}
      <div
        className={classNames(
          styles.body,
          isActionAreaVisible ? styles.collapse : styles.expand,
        )}
      >
        <div
          className={classNames(
            styles.patientHeader,
            isActionAreaVisible && styles.collapsedPatientHeader,
          )}
        >
          {patientHeader}
        </div>
        <div
          className={classNames(
            styles.mainDisplay,
            isActionAreaVisible && styles.collapsedMainDisplay,
          )}
        >
          {mainDisplay}
        </div>
      </div>
      {isActionAreaVisible && (
        <div className={styles.actionArea}>{actionArea}</div>
      )}
    </div>
  );
};

export default ClinicalLayout;
