import { formatUrl } from '@bahmni/services';
import { NavigateFunction } from 'react-router-dom';

/**
 * Handles navigation based on URL pattern
 * @param navigationUrl - The URL to navigate to
 * @param options - Object containing key-value pairs for URL placeholder replacement
 * @param navigate - React Router navigate function
 */
export const handleExtensionNavigation = (
  navigationUrl: string,
  options: Record<string, string>,
  navigate: NavigateFunction,
) => {
  if (!navigationUrl) return;

  const url = formatUrl(navigationUrl, options, true);
  if (url.startsWith('#')) {
    // In-app navigation with React Router
    navigate(url.slice(1));
  } else {
    // Cross-app navigation
    window.location.href = url;
  }
};
