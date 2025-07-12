import React from 'react';
import {
  HeaderContainer,
  Header,
  HeaderGlobalBar,
  HeaderGlobalAction,
  Breadcrumb,
  BreadcrumbItem,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/Header.module.scss';

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export interface GlobalAction {
  id: string;
  label: string;
  renderIcon: React.ReactNode;
  onClick: () => void;
}

export interface HeaderProps {
  breadcrumbItems?: BreadcrumbItem[];
  globalActions?: GlobalAction[];
  ariaLabel?: string;
}

/**
 * Header component provides a consistent header with breadcrumbs and global actions
 * without sidebar navigation functionality.
 *
 * @component
 * @param {HeaderProps} props - The component props
 * @returns {React.ReactElement} The rendered component
 */
const HeaderComponent: React.FC<HeaderProps> = ({
  breadcrumbItems = [],
  globalActions = [],
  ariaLabel = 'Header',
}) => {
  const { t } = useTranslation();

  const renderBreadcrumbs = () => {
    if (breadcrumbItems.length === 0) return null;

    return (
      <Breadcrumb
        noTrailingSlash
        data-testid="breadcrumb"
        className={styles.breadcrumb}
      >
        {breadcrumbItems.map((item) => (
          <BreadcrumbItem
            key={item.id}
            href={item.href}
            isCurrentPage={item.isCurrentPage}
          >
            {t(item.label)}
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
    );
  };

  const renderGlobalActions = () => {
    if (globalActions.length === 0) return null;

    return (
      <HeaderGlobalBar data-testid="header-global-bar">
        {globalActions.map((action) => (
          <HeaderGlobalAction
            key={action.id}
            aria-label={t(action.label)}
            onClick={action.onClick}
            tooltipAlignment="end"
            data-testid={`global-action-${action.id}`}
          >
            {action.renderIcon}
          </HeaderGlobalAction>
        ))}
      </HeaderGlobalBar>
    );
  };

  return (
    <HeaderContainer
      render={() => (
        <>
          <Header
            aria-label={ariaLabel}
            data-testid="header"
            className={styles.header}
          >
            {renderBreadcrumbs()}
            {renderGlobalActions()}
          </Header>
        </>
      )}
    />
  );
};

export default React.memo(HeaderComponent);
