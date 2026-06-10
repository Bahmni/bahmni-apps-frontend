import { Button, Edit, IconButton } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { MedicationRequest } from 'fhir/r4';
import React, { useMemo } from 'react';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { MedicationAction } from '../models';
import { handleAction } from './actionHandlers';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  edit: <Edit />,
};

type ActionsProps = {
  actions: MedicationAction[];
  medication: MedicationRequest;
  startDate?: string;
  disabledActionTypes?: string[];
};

const Actions: React.FC<ActionsProps> = ({
  actions,
  medication,
  startDate,
  disabledActionTypes = [],
}) => {
  const { t } = useTranslation();
  const { userPrivileges } = useUserPrivilege();

  // Filter out actions the user doesn't have privilege for — completely hidden, not disabled
  const permittedActions = useMemo(
    () =>
      actions.filter((action) =>
        hasPrivilege(userPrivileges, action.requiredPrivilege),
      ),
    [actions, userPrivileges],
  );

  if (permittedActions.length === 0) return null;

  const isActionDisabled = (action: MedicationAction) =>
    disabledActionTypes.includes(action.type);

  if (permittedActions.length === 1) {
    const action = permittedActions[0];
    const disabled = isActionDisabled(action);
    const icon = ACTION_ICONS[action.type];

    if (icon) {
      return (
        <IconButton
          label={t(action.label)}
          kind="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => !disabled && handleAction(action, medication, startDate)}
          testId={`medication-action-${action.type}-${medication.id}`}
        >
          {icon}
        </IconButton>
      );
    }

    return (
      <Button
        id={`medication-action-${action.type}-button`}
        data-testid={`medication-action-${action.type}-${medication.id}`}
        aria-label={t(action.label)}
        kind={action.type === 'stop' ? 'danger--ghost' : 'ghost'}
        disabled={disabled}
        onClick={() => handleAction(action, medication, startDate)}
      >
        {t(action.label)}
      </Button>
    );
  }

  return (
    <OverflowMenu
      id={`medication-actions-menu-${medication.id}`}
      data-testid={`medication-actions-menu-${medication.id}`}
      aria-label={t('MEDICATIONS_ACTIONS_MENU_LABEL')}
      flipped
      size="sm"
    >
      {permittedActions.map((action) => (
        <OverflowMenuItem
          id={`medication-action-${action.type}-${medication.id}`}
          data-testid={`medication-action-${action.type}-${medication.id}`}
          key={action.type}
          itemText={t(action.label)}
          isDelete={action.type === 'stop'}
          disabled={isActionDisabled(action)}
          onClick={() => handleAction(action, medication, startDate)}
        />
      ))}
    </OverflowMenu>
  );
};

export default Actions;
