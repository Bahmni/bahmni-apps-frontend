import React, { ReactNode } from 'react';
import { PageHeader, type BreadcrumbItem } from '../../organisms/pageHeader';
import styles from './styles/RegistrationLayout.module.scss';

interface RegistrationLayoutProps {
  breadcrumbItems?: BreadcrumbItem[];
  children: ReactNode;
  testId?: string;
}

/**
 * Registration Layout component that provides the main layout structure
 * for registration pages with PageHeader and main content area.
 *
 * This template includes:
 * 1. PageHeader with breadcrumb navigation at the top
 * 2. Main content area for page-specific content
 *
 * @param {BreadcrumbItem[]} breadcrumbItems - Optional breadcrumb items for navigation
 * @param {ReactNode} children - The main content to display
 * @param {string} testId - Optional test ID for the PageHeader
 * @returns {React.ReactElement} The RegistrationLayout component
 */
export const RegistrationLayout: React.FC<RegistrationLayoutProps> = ({
  breadcrumbItems,
  children,
  testId,
}) => {
  return (
    <div className={styles.layout}>
      {breadcrumbItems && (
        <PageHeader breadcrumbItems={breadcrumbItems} testId={testId} />
      )}
      <div className={styles.mainContent}>{children}</div>
    </div>
  );
};
