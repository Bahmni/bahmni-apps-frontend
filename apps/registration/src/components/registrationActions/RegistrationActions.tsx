import { Button, Icon, ICON_SIZE } from '@bahmni/design-system';
import { AppExtensionConfig, useTranslation } from '@bahmni/services';
import { useNavigate, useParams } from 'react-router-dom';
import { useFilteredExtensions } from '../../hooks/useFilteredExtensions';
import { VisitTypeSelector } from '../../pages/PatientRegister/visitTypeSelector';
import { handleExtensionNavigation } from '../../utils/extensionNavigation';

export interface RegistrationActionsProps {
  extensionPointId?: string;
  buttonKind?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
  urlContext?: Record<string, string>;
  onVisitSave?: () => Promise<string | null>;
}

/**
 * Component that renders extensions based on type
 * Auto-extracts URL params from route and merges with provided urlContext
 * type="startVisit": renders VisitTypeSelector
 * Other types: renders Button with navigation
 */
export const RegistrationActions = ({
  extensionPointId,
  buttonKind = 'tertiary',
  urlContext = {},
  onVisitSave,
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

  const handleClick = (extension: AppExtensionConfig) => {
    if (!extension.url) return;
    handleExtensionNavigation(extension.url, mergedUrlContext, navigate);
  };

  return (
    <>
      {filteredExtensions.map((extension) => {
        if (extension.type === 'startVisit' && onVisitSave) {
          return (
            <VisitTypeSelector
              key={extension.id}
              onVisitSave={onVisitSave}
              patientUuid={mergedUrlContext.patientUuid}
              onNavigate={() => handleClick(extension)}
            />
          );
        }

        return (
          <Button
            key={extension.id}
            kind={buttonKind}
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
