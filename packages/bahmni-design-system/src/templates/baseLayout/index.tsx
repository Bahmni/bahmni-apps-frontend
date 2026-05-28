import React, { ReactNode } from 'react';
import styles from './styles/index.module.scss';

interface BaseLayoutProps {
  header: ReactNode;
  main: ReactNode;
  footer?: ReactNode;
}

/**
 * Base Layout provides the layout structure for pages with up to 3 distinct sections:
 * 1. Header - at the top of the screen, full width along with the left side navigation
 * 2. Main - rest of the screen, scrollable content area
 * 3. Footer (optional) - absolutely positioned at the bottom, always visible
 *
 * @param {ReactNode} header - The header component
 * @param {ReactNode} main - The main content to display
 * @param {ReactNode} [footer] - Optional footer pinned to the bottom of the layout
 * @returns {React.ReactElement} The BaseLayout component
 */
const BaseLayout: React.FC<BaseLayoutProps> = ({ header, main, footer }) => {
  return (
    <div
      id="base-layout"
      data-testid="base-layout-test-id"
      aria-label="base-layout-aria-label"
      className={styles.layout}
    >
      {header}
      <div
        id="main-display-area"
        data-testid="main-display-area-test-id"
        aria-label="main-display-area-aria-label"
        className={styles.main}
      >
        {main}
      </div>
      {footer && (
        <div
          id="footer-display-area"
          data-testid="footer-display-area-test-id"
          aria-label="footer-display-area-aria-label"
          className={styles.footer}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
export default BaseLayout;
