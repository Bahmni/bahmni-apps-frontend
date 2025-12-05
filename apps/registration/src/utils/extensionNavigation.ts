import { formatUrl } from '@bahmni/services';
import { NavigateFunction } from 'react-router-dom';

/**
 * Handles navigation based on URL pattern
 * @param navigationUrl - The URL to navigate to
 * @param options - Object containing key-value pairs for URL placeholder replacement
 * @param navigate - React Router navigate function
 * @param customProperties - Optional custom properties to pass as navigation state
 */
export const handleExtensionNavigation = (
  navigationUrl: string,
  options: Record<string, string>,
  navigate: NavigateFunction,
  customProperties?: Record<string, unknown>,
) => {
  if (!navigationUrl) return;

  const url = formatUrl(navigationUrl, options, true);
  if (url.startsWith('#')) {
    // In-app navigation with React Router
    navigate(url.slice(1), {
      state: customProperties ? { customProperties } : undefined,
    });
  } else {
    // Cross-app navigation - store state in sessionStorage
    if (customProperties) {
      sessionStorage.setItem(
        'extensionState',
        JSON.stringify(customProperties),
      );
    }
    window.location.href = url;
  }
};
