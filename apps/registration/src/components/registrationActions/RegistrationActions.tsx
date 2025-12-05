import { Button } from '@bahmni/design-system';
import { AppExtensionConfig, useTranslation } from '@bahmni/services';
import { useNavigate } from 'react-router-dom';
import { useFilteredExtensions } from '../../hooks/useFilteredExtensions';
import { handleExtensionNavigation } from '../../utils/extensionNavigation';

export interface RegistrationActionsProps {
  extensionPointId?: string;
  buttonKind?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
  urlContext?: Record<string, string>;
}

/**
 * Component that renders app extension buttons filtered by privilege
 * Can filter by extensionPointId (show all extensions in a location)
 * Handles navigation internally based on extension type
 */
export const RegistrationActions = ({
  extensionPointId,
  buttonKind = 'tertiary',
  urlContext = {},
}: RegistrationActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { filteredExtensions, isLoading } = useFilteredExtensions({
    extensionPointId,
  });

  if (isLoading || filteredExtensions.length === 0) {
    return null;
  }

  const handleClick = (extension: AppExtensionConfig) => {
    if (!extension.url) return;
    handleExtensionNavigation(extension.url, urlContext, navigate);
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
          {t(extension.translationKey)}
        </Button>
      ))}
    </>
  );
};
