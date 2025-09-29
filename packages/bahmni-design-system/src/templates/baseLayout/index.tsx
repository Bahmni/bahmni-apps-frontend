import React, { ReactNode } from 'react';
import styles from './styles/index.module.scss';

interface BaseLayoutProps {
  header: ReactNode;
  main: ReactNode;
}

/**
 * Base Layout provides the layout structure for pages with 2 distinct sections:
 * 1. Header - at the top of the screen, full width along with the left side navigation
 * 2. Main - rest of the screen, scrollable content area
 *
 * @param {ReactNode} header - The header component
 * @param {ReactNode} mainDisplay - The main content to display
 * @returns {React.ReactElement} The ActionAreaLayout component
 */
const BaseLayout: React.FC<BaseLayoutProps> = ({ header, main }) => {
  return (
    <div className={styles.layout}>
      {header}
      <div className={styles.main}>{main}</div>
    </div>
  );
};
export default BaseLayout;
