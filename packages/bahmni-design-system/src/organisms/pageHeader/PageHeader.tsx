import { Breadcrumb, BreadcrumbItem } from '@carbon/react';
import React from 'react';
import styles from './styles/PageHeader.module.scss';

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export interface PageHeaderProps {
  /**
   * Array of breadcrumb items to display
   */
  breadcrumbItems?: BreadcrumbItem[];
  /**
   * Additional CSS class name for the header
   */
  className?: string;
  /**
   * Test ID for the header component
   */
  testId?: string;
}

/**
 * PageHeader component provides a simple header with breadcrumb navigation
 * Designed for registration and other simple pages that need basic navigation
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbItems = [],
  className = '',
  testId = 'page-header',
}) => {
  const renderBreadcrumbs = () => {
    if (breadcrumbItems.length === 0) return null;

    return (
      <Breadcrumb
        noTrailingSlash
        data-testid="page-breadcrumb"
        className={styles.breadcrumb}
      >
        {breadcrumbItems.map((item) => (
          <BreadcrumbItem
            key={item.id}
            href={item.href}
            isCurrentPage={item.isCurrentPage}
            data-testid={`breadcrumb-item-${item.id}`}
          >
            {item.label}
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
    );
  };

  return (
    <header
      className={`${styles.pageHeader} ${className}`}
      data-testid={testId}
    >
      <div className={styles.headerContent}>{renderBreadcrumbs()}</div>
    </header>
  );
};

export default PageHeader;
