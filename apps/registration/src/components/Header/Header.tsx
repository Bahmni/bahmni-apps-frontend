import { Button } from '@bahmni-frontend/bahmni-design-system';
import { Breadcrumb, BreadcrumbItem } from '@carbon/react';
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
  return (
    <div className={`${styles.customHeader} ${className ?? ''}`}>
      <div className={styles.headerContent}>
        <Breadcrumb noTrailingSlash className={styles.carbonBreadcrumb}>
          {breadcrumbs.map((item, index) => (
            <BreadcrumbItem
              key={`breadcrumb-${item.label}`}
              href={item.href}
              onClick={item.onClick}
              isCurrentPage={index === breadcrumbs.length - 1}
            >
              {item.label}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
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
            <span className={styles.profileText}>Hi, Profile name</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
