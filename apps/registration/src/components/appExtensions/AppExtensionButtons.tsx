import { Button } from '@bahmni/design-system';
import { AppExtensionConfig, hasPrivilege } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { useNavigate } from 'react-router-dom';
import { useRegistrationConfig } from '../../hooks/useRegistrationConfig';

export interface AppExtensionButtonsProps {
  extensionPointId?: string;
  extensionId?: string;
  onExtensionClick?: (extension: AppExtensionConfig) => void;
  buttonKind?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
}

/**
 * Component that renders app extension buttons filtered by privilege
 * Can filter by extensionPointId (show all extensions in a location) or extensionId (show specific extension)
 * Handles navigation internally based on extension type
 */
export const AppExtensionButtons = ({
  extensionPointId,
  extensionId,
  onExtensionClick,
  buttonKind = 'tertiary',
}: AppExtensionButtonsProps) => {
  const { registrationConfig, isLoading: configLoading } =
    useRegistrationConfig();
  const { userPrivileges, isLoading: privilegesLoading } = useUserPrivilege();
  const navigate = useNavigate();

  // Don't render while loading
  if (configLoading || privilegesLoading) {
    return null;
  }

  const extensions: AppExtensionConfig[] =
    registrationConfig?.registrationAppExtensions ?? [];

  // Filter extensions by extension point or specific extension ID
  let filteredExtensions = extensions;

  if (extensionId) {
    // Filter by specific extension ID
    filteredExtensions = extensions.filter((ext) => ext.id === extensionId);
  } else if (extensionPointId) {
    // Filter by extension point ID (location)
    filteredExtensions = extensions.filter(
      (ext) => ext.extensionPointId === extensionPointId,
    );
  }

  // Apply privilege filter and sort
  filteredExtensions = filteredExtensions
    .filter(
      (ext) =>
        !ext.requiredPrivilege ||
        hasPrivilege(userPrivileges, ext.requiredPrivilege),
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (filteredExtensions.length === 0) {
    return null;
  }

  const handleClick = (extension: AppExtensionConfig) => {
    // Call parent callback if provided
    onExtensionClick?.(extension);

    // Handle navigation based on extension type
    if (!extension.url) return;

    if (extension.type === 'link') {
      // For 'link' type: navigate to the absolute URL (external navigation)
      window.location.href = extension.url;
    } else if (extension.type === 'startVisit') {
      // For 'startVisit' type: navigate within registration app using React Router
      navigate(extension.url);
    }
  };

  return (
    <>
      {filteredExtensions.map((extension) => (
        <Button
          key={extension.id}
          kind={buttonKind}
          onClick={() => handleClick(extension)}
        >
          {extension.icon && <i className={extension.icon} />}
          {/* Translation will be handled by parent component */}
          {extension.translationKey}
        </Button>
      ))}
    </>
  );
};
