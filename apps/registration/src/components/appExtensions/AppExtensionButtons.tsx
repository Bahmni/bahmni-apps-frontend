import { Button } from '@bahmni/design-system';
import { AppExtensionConfig, useTranslation } from '@bahmni/services';
import { useNavigate } from 'react-router-dom';
import { useFilteredExtensions } from '../../hooks/useFilteredExtensions';
import { processExtensionClick } from '../../utils/extensionNavigation';

export interface AppExtensionButtonsProps {
  extensionPointId?: string;
  extensionId?: string;
  onExtensionClick?: (extension: AppExtensionConfig) => void;
  buttonKind?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
  urlContext?: Record<string, string | number | null | undefined>;
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
  urlContext = {},
}: AppExtensionButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { filteredExtensions, isLoading } = useFilteredExtensions({
    extensionPointId,
    extensionId,
  });

  if (isLoading || filteredExtensions.length === 0) {
    return null;
  }

  const handleClick = (extension: AppExtensionConfig) => {
    processExtensionClick(extension, navigate, urlContext, onExtensionClick);
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
