import { Button } from '@bahmni-frontend/bahmni-design-system';
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
        <div className={styles.breadcrumbSection}>
          <nav className={styles.breadcrumb}>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={`breadcrumb-${item.label}`}>
                {index > 0 && (
                  <span className={styles.breadcrumbSeparator}>/</span>
                )}
                {item.href ? (
                  <a
                    href={item.href}
                    className={styles.breadcrumbLink}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    className={
                      index === breadcrumbs.length - 1
                        ? styles.breadcrumbCurrent
                        : styles.breadcrumbLink
                    }
                    onClick={item.onClick}
                    role={item.onClick ? 'button' : undefined}
                    tabIndex={item.onClick ? 0 : undefined}
                    onKeyDown={
                      item.onClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              item.onClick?.();
                            }
                          }
                        : undefined
                    }
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
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
