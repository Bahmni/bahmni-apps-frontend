import { Breadcrumb, BreadcrumbItem, Header } from '@carbon/react';
import React from 'react';
import styles from './styles/PageHeader.module.scss';

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export interface PageHeaderProps {
  breadcrumbItems?: BreadcrumbItem[];
  className?: string;
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
    <Header className={className} data-testid={testId}>
      <div className={styles.headerContent}>{renderBreadcrumbs()}</div>
    </Header>
  );
};

export default PageHeader;
