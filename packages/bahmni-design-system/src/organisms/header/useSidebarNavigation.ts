import { useState, useMemo, useCallback } from 'react';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
}

/**
 * Custom hook to manage sidebar navigation state
 * Handles active item selection and provides unified interface for sidebar interactions
 *
 * @param items - Array of sidebar items
 * @returns Object containing active item ID and click handler
 */
export const useSidebarNavigation = (items: SidebarItem[]) => {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const effectiveActiveItemId = useMemo(() => {
    if (!items.length) return null;

    // If activeItemId is valid and exists in items, use it
    if (activeItemId && items.some((item) => item.id === activeItemId)) {
      return activeItemId;
    }

    // Default to first item
    return items[0].id;
  }, [activeItemId, items]);

  const handleItemClick = useCallback((itemId: string) => {
    setActiveItemId(itemId);
  }, []);

  return {
    activeItemId: effectiveActiveItemId,
    handleItemClick,
  };
};
