import { Edit, IconButton } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { MedicationRequest } from 'fhir/r4';
import React from 'react';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { MedicationAction } from '../models';
import { handleAction } from './actionHandlers';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  edit: <Edit />,
};

type ActionsProps = {
  actions: MedicationAction[];
  medication: MedicationRequest;
  disabledActionTypes?: string[];
};

const Actions: React.FC<ActionsProps> = ({
  actions,
  medication,
  disabledActionTypes = [],
}) => {
  const { t } = useTranslation();
  const { userPrivileges } = useUserPrivilege();

  if (actions.length === 0) return null;

  const isActionDisabled = (action: MedicationAction) =>
    disabledActionTypes.includes(action.type) ||
    !hasPrivilege(userPrivileges, action.requiredPrivilege);

  if (actions.length === 1) {
    const action = actions[0];
    const disabled = isActionDisabled(action);
    return (
      <IconButton
        label={t(action.label)}
        kind="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => !disabled && handleAction(action, medication)}
        testId={`medication-action-${action.type}-${medication.id}`}
      >
        {ACTION_ICONS[action.type] ?? <Edit />}
      </IconButton>
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
      {actions.map((action) => (
        <OverflowMenuItem
          id={`medication-action-${action.type}-${medication.id}`}
          data-testid={`medication-action-${action.type}-${medication.id}`}
          key={action.type}
          itemText={t(action.label)}
          disabled={isActionDisabled(action)}
          onClick={() => handleAction(action, medication)}
        />
      ))}
    </OverflowMenu>
  );
};

export default Actions;
