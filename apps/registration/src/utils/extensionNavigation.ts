import { AppExtensionConfig } from '@bahmni/services';
import { NavigateFunction } from 'react-router-dom';

/**
 * Interpolates URL template variables with actual values
 * @param url - URL string with template variables like {{patientUuid}}
 * @param context - Object containing key-value pairs for interpolation
 * @returns Interpolated URL with actual values
 */
export const interpolateUrl = (
  url: string,
  context: Record<string, string | number | null | undefined>,
): string => {
  let interpolatedUrl = url;
  Object.entries(context).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      interpolatedUrl = interpolatedUrl.replace(
        new RegExp(`{{${key}}}`, 'g'),
        String(value),
      );
    }
  });
  return interpolatedUrl;
};

/**
 * Handles navigation based on URL pattern
 * @param url - The URL to navigate to
 * @param navigate - React Router navigate function
 * @param state - Optional state to pass with navigation (for React Router)
 */
export const handleExtensionNavigation = (
  url: string,
  navigate: NavigateFunction,
  state?: Record<string, unknown>,
): void => {
  if (!url) return;

  // Determine navigation type based on URL pattern
  if (url.startsWith('#')) {
    // URL starts with # - in-app navigation using React Router
    // Remove the # prefix before navigating
    const route = url.substring(1);
    // Pass state with navigation if provided
    navigate(route, { state });
  } else if (url.startsWith('/')) {
    // URL starts with / - cross-app navigation (full page reload)
    // For cross-app navigation, encode state in URL or use sessionStorage
    if (state && Object.keys(state).length > 0) {
      sessionStorage.setItem('extensionState', JSON.stringify(state));
    }
    window.location.href = url;
  } else {
    // Fallback: external URL or other patterns
    window.location.href = url;
  }
};

/**
 * Processes extension click - interpolates URL and handles navigation
 * @param extension - The extension configuration
 * @param navigate - React Router navigate function
 * @param urlContext - Context for URL interpolation
 * @param onExtensionClick - Optional callback before navigation
 */
export const processExtensionClick = (
  extension: AppExtensionConfig,
  navigate: NavigateFunction,
  urlContext: Record<string, string | number | null | undefined>,
  onExtensionClick?: (extension: AppExtensionConfig) => void,
): void => {
  // Call callback if provided
  onExtensionClick?.(extension);

  if (!extension.url) return;

  // Interpolate URL with context values
  const processedUrl = interpolateUrl(extension.url, urlContext);

  // Pass customProperties as navigation state
  const navigationState = extension.customProperties
    ? { customProperties: extension.customProperties, extension }
    : undefined;

  // Handle navigation with state
  handleExtensionNavigation(processedUrl, navigate, navigationState);
};
