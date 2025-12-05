import { AppExtensionConfig, hasPrivilege } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { useRegistrationConfig } from './useRegistrationConfig';

interface UseFilteredExtensionsProps {
  extensionPointId?: string;
}

interface UseFilteredExtensionsReturn {
  filteredExtensions: AppExtensionConfig[];
  isLoading: boolean;
}

/**
 * Custom hook to filter and validate app extensions
 * Handles extension point validation, privilege filtering, and sorting
 */
export const useFilteredExtensions = ({
  extensionPointId,
}: UseFilteredExtensionsProps): UseFilteredExtensionsReturn => {
  const { registrationConfig, isLoading: configLoading } =
    useRegistrationConfig();
  const { userPrivileges, isLoading: privilegesLoading } = useUserPrivilege();

  // Return empty array while loading
  if (configLoading || privilegesLoading) {
    return {
      filteredExtensions: [],
      isLoading: true,
    };
  }

  const extensions: AppExtensionConfig[] =
    registrationConfig?.registrationAppExtensions ?? [];
  const extensionPoints = registrationConfig?.extensionPoints ?? [];

  // Validate extensionPointId if provided
  if (extensionPointId && extensionPoints.length > 0) {
    const isValidExtensionPoint = extensionPoints.some(
      (point) => point.id === extensionPointId,
    );
    if (!isValidExtensionPoint) {
      // Invalid extension point - return empty array
      return {
        filteredExtensions: [],
        isLoading: false,
      };
    }
  }

  // Filter extensions by extension point ID
  let filtered = extensions;

  if (extensionPointId) {
    // Filter by extension point ID (location)
    filtered = extensions.filter(
      (ext) => ext.extensionPointId === extensionPointId,
    );
  }

  // Apply privilege filter and sort
  filtered = filtered
    .filter(
      (ext) =>
        !ext.requiredPrivilege ||
        hasPrivilege(userPrivileges, ext.requiredPrivilege),
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    filteredExtensions: filtered,
    isLoading: false,
  };
};
