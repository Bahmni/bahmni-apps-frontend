import React from 'react';
import { SideNav, SideNavItems, SideNavLink } from '@carbon/react';
import BahmniIcon from '@components/common/bahmniIcon/BahmniIcon';
import { ICON_SIZE } from '@constants/icon';
import * as styles from './styles/Sidebar.module.scss';
import { useTranslation } from 'react-i18next';

/**
 * Interface defining the properties for sidebar items.
 * Each item represents a navigation option in the sidebar.
 *
 * @interface
 * @property {string} id - Unique identifier for the item
 * @property {string} icon - Icon name in FontAwesome format (e.g., "fa-clipboard-list")
 * @property {string} label - Display text for the item
 */
export interface SidebarItemProps {
  id: string;
  icon: string;
  label: string;
}

/**
 * Sidebar component that renders a vertical list of navigation items using Carbon SideNav.
 * Manages active state and click events at the component level.
 *
 * @component
 * @param {SidebarItemProps[]} items - Array of sidebar items to render
 * @param {string | null} activeItemId - ID of the currently active/selected item
 * @param {function} onItemClick - Callback function executed when an item is clicked, receives the item ID as parameter
 */
interface SidebarProps {
  items: SidebarItemProps[];
  activeItemId: string | null;
  onItemClick: (itemId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeItemId,
  onItemClick,
}) => {
  const { t } = useTranslation();

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
            onClick={(e) => handleOnClick(e, () => onItemClick(item.id))}
            isActive={item.id === activeItemId}
            data-testid={`sidebar-item-${item.id}`}
          >
            {t(item.label)}
          </SideNavLink>
        ))}
      </SideNavItems>
    </SideNav>
  );
};

export default Sidebar;
