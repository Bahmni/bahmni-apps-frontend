import { Button, Icon, ICON_SIZE } from '@bahmni/design-system';
import {
  AppExtensionConfig,
  useTranslation,
  type VisitType,
} from '@bahmni/services';
import { useNavigate, useParams } from 'react-router-dom';
import { useFilteredExtensions } from '../../hooks/useFilteredExtensions';
import { useCreateVisit } from '../../hooks/useVisit';
import { VisitTypeSelector } from '../../pages/PatientRegister/visitTypeSelector';
import { handleExtensionNavigation } from '../../utils/extensionNavigation';

export interface RegistrationActionsProps {
  extensionPointId?: string;
  onBeforeNavigate?: () => Promise<string | null>;
}

/**
 * Component that renders extensions based on type
 * Auto-extracts URL params from route as key-value pairs
 * type="startVisit": renders VisitTypeSelector
 * Other types: renders Button with navigation
 *
 * @param onBeforeNavigate - Optional callback executed before navigation
 *   Parent should handle validation and save patient data
 *   If validation fails, parent should show error notification and throw to prevent navigation
 */
export const RegistrationActions = ({
  extensionPointId,
  onBeforeNavigate,
}: RegistrationActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routeParams = useParams();
  const { createVisit } = useCreateVisit();
  const { filteredExtensions, isLoading } = useFilteredExtensions({
    extensionPointId,
  });

  // Auto-extract URL context from route params as key-value pairs, filtering out undefined values
  const routeContext: Record<string, string> = Object.fromEntries(
    Object.entries(routeParams).filter(([, value]) => value !== undefined) as [
      string,
      string,
    ][],
  );

  if (isLoading || filteredExtensions.length === 0) {
    return null;
  }

  const handleVisitTypeSelect = async (
    visitType: VisitType,
    extension: AppExtensionConfig,
  ) => {
    if (!onBeforeNavigate) return;

    const patientUuid = await onBeforeNavigate();
    if (!patientUuid) return;

    await createVisit(patientUuid, visitType);

    if (extension.url) {
      handleExtensionNavigation(extension.url, routeContext, navigate);
    }
  };

  const handleClick = async (extension: AppExtensionConfig) => {
    if (!onBeforeNavigate) return;

    const result = await onBeforeNavigate();
    if (!result) return;

    if (extension.url) {
      handleExtensionNavigation(extension.url, routeContext, navigate);
    }
  };

  return (
    <>
      {filteredExtensions.map((extension) => {
        if (extension.type === 'startVisit') {
          return (
            <VisitTypeSelector
              key={extension.id}
              onVisitTypeSelect={(visitType) =>
                handleVisitTypeSelect(visitType, extension)
              }
              data-testid="visit-type-selector"
            />
          );
        }

        return (
          <Button
            key={extension.id}
            kind={extension.kind ?? 'primary'}
            onClick={() => handleClick(extension)}
            data-testid="registration-action-button"
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
