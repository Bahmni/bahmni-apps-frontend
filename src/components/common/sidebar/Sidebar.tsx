import React from 'react';
import { SideNav, SideNavItems, SideNavLink } from '@carbon/react';
import BahmniIcon from '@components/common/bahmniIcon/BahmniIcon';
import { ICON_SIZE } from '@constants/icon';
import * as styles from './styles/Sidebar.module.scss';

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
  action: () => void;
}

/**
 * Sidebar component that renders a vertical list of sidebar items using Carbon SideNav.
 *
 * @component
 * @param {SidebarItemProps[]} items - Array of sidebar items to render
 */
interface SidebarProps {
  items: SidebarItemProps[];
}

const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const handleOnClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    action();
  };

  return (
    <SideNav
      isFixedNav
      expanded
      className={`${styles.sidebar}`}
      aria-label="Side Navigation"
      data-testid="sidebar"
    >
      <SideNavItems>
        {items.map((item) => (
          <SideNavLink
            key={item.id}
            renderIcon={() => (
              <BahmniIcon
                name={item.icon}
                id={`sidebar-icon-${item.id}`}
                size={ICON_SIZE.SM}
              />
            )}
            href="#"
            onClick={(e) => handleOnClick(e, item.action)}
            isActive={item.active}
            data-testid={`sidebar-item-${item.id}`}
          >
            {item.label}
          </SideNavLink>
        ))}
      </SideNavItems>
    </SideNav>
  );
};

export default Sidebar;
