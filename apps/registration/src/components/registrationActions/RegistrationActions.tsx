import { Button, Icon, ICON_SIZE } from '@bahmni/design-system';
import { AppExtensionConfig, useTranslation } from '@bahmni/services';
import { useNavigate, useParams } from 'react-router-dom';
import { useFilteredExtensions } from '../../hooks/useFilteredExtensions';
import { VisitTypeSelector } from '../../pages/PatientRegister/visitTypeSelector';
import { handleExtensionNavigation } from '../../utils/extensionNavigation';

export interface RegistrationActionsProps {
  extensionPointId?: string;
  urlContext?: Record<string, string>;
  onBeforeNavigate?: () => Promise<unknown>;
}

/**
 * Component that renders extensions based on type
 * Auto-extracts URL params from route and merges with provided urlContext
 * type="startVisit": renders VisitTypeSelector
 * Other types: renders Button with navigation
 *
 * @param onBeforeNavigate - Optional callback executed before navigation
 *   Parent should handle validation and save patient data
 *   If validation fails, parent should show error notification and throw to prevent navigation
 */
export const RegistrationActions = ({
  extensionPointId,
  urlContext = {},
  onBeforeNavigate,
}: RegistrationActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routeParams = useParams();
  const { filteredExtensions, isLoading } = useFilteredExtensions({
    extensionPointId,
  });

  // Auto-extract URL context from route params and merge with provided context
  const mergedUrlContext: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(routeParams).filter(
        ([, value]) => value !== undefined,
      ) as [string, string][],
    ),
    ...urlContext,
  };

  if (isLoading || filteredExtensions.length === 0) {
    return null;
  }

  const handleClick = async (extension: AppExtensionConfig) => {
    try {
      if (extension.type !== 'startVisit' && onBeforeNavigate) {
        const result = await onBeforeNavigate();

        if (!result) {
          return;
        }
      }

      if (extension.url) {
        handleExtensionNavigation(
          extension.url,
          mergedUrlContext,
          navigate,
          extension.customProperties,
        );
      }
    } catch {
      // Parent callback threw an error (e.g., validation failed)
      // Error should have already been handled by parent (notification shown)
      // Simply prevent navigation by not proceeding
    }
  };

  return (
    <>
      {filteredExtensions.map((extension) => {
        if (extension.type === 'startVisit') {
          return (
            <VisitTypeSelector
              key={extension.id}
              patientUuid={mergedUrlContext.patientUuid}
              onVisitSave={onBeforeNavigate as () => Promise<string | null>}
              onNavigate={() => handleClick(extension)}
            />
          );
        }

        return (
          <Button
            key={extension.id}
            kind={extension.kind ?? 'primary'}
            onClick={() => handleClick(extension)}
            renderIcon={
              extension.icon
                ? () => (
                    <Icon
                      id={extension.id}
                      name={extension.icon!}
                      size={ICON_SIZE.SM}
                    />
                  )
                : undefined
            }
          >
            {t(extension.translationKey)}
          </Button>
        );
      })}
    </>
  );
};
