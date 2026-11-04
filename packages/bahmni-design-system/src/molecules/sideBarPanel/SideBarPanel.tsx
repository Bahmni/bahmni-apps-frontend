import { Close } from '@carbon/icons-react';
import classNames from 'classnames';
import React, { ReactNode } from 'react';
import { IconButton } from '../../atoms/iconButton';
import styles from './styles/SideBarPanel.module.scss';

export interface SideBarPanelProps {
  title: string;
  children: ReactNode;
  closeSideBar: () => void;
  className?: string;
  dataTestId?: string;
  ariaLabel?: string;
}

export const SideBarPanel: React.FC<SideBarPanelProps> = ({
  title,
  children,
  closeSideBar,
  className,
  dataTestId = 'side-bar-panel',
  ariaLabel,
}) => {
  return (
    <div
      className={classNames(styles.sideBarNav, className)}
      data-testid={dataTestId}
      role="complementary"
      aria-label={ariaLabel ?? title}
    >
      <div className={styles.sideBarHeader}>
        <div className={styles.title}>{title}</div>
        <div className={styles.closeIcon}>
          <IconButton
            renderIcon={Close}
            iconDescription="Close"
            kind="ghost"
            onClick={closeSideBar}
            aria-label="Close sidebar"
          />
        </div>
      </div>
      <div className={styles.sideBarChildren}>{children}</div>
    </div>
  );
};

export default SideBarPanel;
