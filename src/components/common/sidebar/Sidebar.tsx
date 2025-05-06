import React from 'react';
import SidebarItem, { SidebarItemProps } from './SidebarItem';
import * as styles from './styles/Sidebar.module.scss';

/**
 * Sidebar component that renders a vertical list of sidebar items.
 *
 * @component
 * @param {SidebarItemProps[]} items - Array of sidebar items to render
 * @param {string} [className] - Optional CSS class name for additional styling
 */
interface SidebarProps {
  items: SidebarItemProps[];
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ items, className = '' }) => {
  return (
    <div className={`${styles.sidebar} ${className}`} data-testid="sidebar">
      {items.map((item) => (
        <SidebarItem
          key={item.id}
          id={item.id}
          icon={item.icon}
          label={item.label}
          active={item.active}
          action={item.action}
        />
      ))}
    </div>
  );
};

export default Sidebar;
