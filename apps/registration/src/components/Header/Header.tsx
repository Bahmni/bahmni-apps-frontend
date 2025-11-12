import { Breadcrumb, Button } from '@bahmni-frontend/bahmni-design-system';
import { getCurrentUser } from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import styles from './styles/index.module.scss';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface HeaderProps {
  breadcrumbs: BreadcrumbItem[];
  showButton?: boolean;
  buttonText?: string;
  buttonDisabled?: boolean;
  onButtonClick?: () => void;
  buttonTestId?: string;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  breadcrumbs,
  showButton = false,
  buttonText,
  buttonDisabled = false,
  onButtonClick,
  buttonTestId,
  className,
}) => {
  const { data: user } = useQuery({
    queryKey: ['registrationConfig'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  return (
    <div className={`${styles.customHeader} ${className ?? ''}`}>
      <div className={styles.headerContent}>
        <Breadcrumb
          items={breadcrumbs.map((item, index) => ({
            label: item.label,
            href: item.href,
            isCurrentPage: index === breadcrumbs.length - 1,
          }))}
          className={styles.carbonBreadcrumb}
        />
        <div className={styles.rightActions}>
          {showButton && buttonText && (
            <Button
              kind="primary"
              size="sm"
              onClick={onButtonClick}
              disabled={buttonDisabled}
              testId={buttonTestId}
              className={styles.actionButton}
            >
              {buttonText}
            </Button>
          )}
          <div className={styles.profileSection}>
            <div className={styles.userAvatar} />
            <span className={styles.profileText}>Hi, {user?.username}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
