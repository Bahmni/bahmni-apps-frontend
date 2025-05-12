import { useState, useCallback, useEffect } from 'react';
import { breakpoints, baseFontSize } from '@carbon/layout';

/**
 * Custom hook to manage header side navigation state and interactions
 *
 * @param onItemClick - Callback for when an item is clicked
 * @param initialExpanded - Whether the side nav should start expanded
 * @returns Object containing state and handlers for side navigation
 */
export const useHeaderSideNav = (
  onItemClick: (itemId: string) => void,
  initialExpanded: boolean = true,
) => {
  const [isSideNavExpanded, setIsSideNavExpanded] = useState(initialExpanded);

  useEffect(() => {
    const handleResize = () => {
      // Parse the breakpoint width to a number for proper comparison
      const breakpointWidth = parseInt(breakpoints.lg.width);
      const mobile = window.innerWidth < breakpointWidth * baseFontSize;

      // Set expanded state based on device width
      setIsSideNavExpanded(!mobile);
    };

    // Run once on mount to set initial state
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSideNavItemClick = useCallback(
    (e: React.MouseEvent<HTMLElement>, itemId: string) => {
      e.preventDefault();
      onItemClick(itemId);
    },
    [onItemClick],
  );

  return {
    isSideNavExpanded,
    handleSideNavItemClick,
  };
};
