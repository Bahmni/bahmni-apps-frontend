import { Button, Icon, ICON_SIZE } from '@bahmni/design-system';
import {
  useTranslation,
  filterExtensionsByPrivileges,
  type VisitType,
  type ActionExtension,
} from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateVisit } from '../../hooks/useVisit';
import { VisitTypeSelector } from '../../pages/PatientRegister/visitTypeSelector';
import { useRegistrationConfig } from '../../providers/registrationConfig';
import { handleExtensionNavigation } from '../../utils/extensionNavigation';

export interface RegistrationActionsProps {
  extensionPointId?: string;
  onBeforeNavigate?: () => Promise<string | null>;
  disabled?: boolean;
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
  disabled = false,
}: RegistrationActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routeParams = useParams();
  const { createVisit } = useCreateVisit();
  const { registrationConfig, isLoading: configLoading } =
    useRegistrationConfig();
  const { userPrivileges, isLoading: privilegesLoading } = useUserPrivilege();
  const isLoading = configLoading || privilegesLoading;

  const filteredExtensions = useMemo<ActionExtension[]>(() => {
    const registrationExtensions = registrationConfig?.extensions ?? [];
    const extensions = extensionPointId
      ? registrationExtensions.filter(
          (ext) => ext.extensionPointId === extensionPointId,
        )
      : registrationExtensions;
    return filterExtensionsByPrivileges(extensions, userPrivileges)
      .filter(
        (ext): ext is ActionExtension =>
          !!ext.extensionParams && 'type' in ext.extensionParams,
      )
      .sort(
        (a, b) =>
          (a.extensionParams?.order ?? 0) - (b.extensionParams?.order ?? 0),
      );
  }, [registrationConfig, userPrivileges, extensionPointId]);

  const routeContext: Record<string, string> = Object.fromEntries(
    Object.entries(routeParams).filter(([, value]) => value !== undefined) as [
      string,
      string,
    ][],
  );

  if (isLoading || filteredExtensions.length === 0) {
    return null;
  }

  const handleVisitTypeSelect = async (visitType: VisitType) => {
    if (!onBeforeNavigate) return;

    const patientUuid = await onBeforeNavigate();
    if (!patientUuid) return;

    await createVisit(patientUuid, visitType);
  };

  const navigateToExtension = async (extension: ActionExtension) => {
    if (!onBeforeNavigate) return;

    const patientUuid = await onBeforeNavigate();
    if (!patientUuid) return;

    const url = extension.extensionParams?.url;
    if (url) {
      handleExtensionNavigation(
        url,
        { ...routeContext, patientUuid },
        navigate,
      );
    }
  };

  return (
    <>
      {filteredExtensions.map((extension) => {
        if (extension.extensionParams?.type === 'startVisit') {
          return (
            <VisitTypeSelector
              key={extension.id}
              onVisitTypeSelect={(visitType) =>
                handleVisitTypeSelect(visitType)
              }
              activeVisitLabel={t('PATIENT_DASHBOARD_REDIRECT')}
              onActiveVisitClick={() => navigateToExtension(extension)}
              disabled={disabled}
              data-testid="visit-type-selector"
            />
          );
        }

        const { id, icon, extensionParams } = extension;

        return (
          <Button
            key={id}
            kind={extensionParams?.buttonKind ?? 'primary'}
            onClick={() => navigateToExtension(extension)}
            disabled={disabled}
            data-testid="registration-action-button"
            renderIcon={
              icon
                ? () => <Icon id={id} name={icon} size={ICON_SIZE.SM} />
                : undefined
            }
          >
            {t(extension.translationKey!)}
          </Button>
        );
      })}
    </>
  );
};
