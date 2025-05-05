import React from 'react';
import BahmniIcon from '@components/common/bahmniIcon/BahmniIcon';
import * as styles from './styles/Sidebar.module.scss';
import { ICON_SIZE } from '@constants/icon';

/**
 * SidebarItem component displays a single item in the sidebar with an icon and label.
 * It can be in an active or inactive state and can handle click actions.
 *
 * @component
 * @param {string} id - Unique identifier for the item
 * @param {string} icon - Icon name in FontAwesome format (e.g., "fa-clipboard-list")
 * @param {string} label - Display text for the item
 * @param {boolean} [active=false] - Whether the item is currently active/selected
 * @param {function} [action] - Callback function executed when the item is clicked
 */
export interface SidebarItemProps {
  id: string;
  icon: string;
  label: string;
  active?: boolean;
  action?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  id,
  icon,
  label,
  active = false,
  action,
}) => {
  const handleClick = () => {
    if (action) {
      action();
    }
  };

  return (
    <div
      className={`${styles.sidebarItem} ${active ? styles.active : ''}`}
      onClick={handleClick}
      data-testid={`sidebar-item-${id}`}
    >
      <BahmniIcon
        name={icon}
        id={`sidebar-icon-${id}`}
        color={active ? 'var(--cds-link-primary)' : 'var(--cds-text-secondary)'}
        size={ICON_SIZE.SM}
      />
      <span className={styles.label}>{label}</span>
    </div>
  );
};

export default SidebarItem;
