import { hasPrivilege, useTranslation } from '@bahmni/services';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { MedicationRequest } from 'fhir/r4';
import React from 'react';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { MedicationAction } from '../models';
import { handleAction } from './actionHandlers';

type ActionsProps = {
  actions: MedicationAction[];
  medication: MedicationRequest;
  hiddenActionTypes?: string[];
};

const Actions: React.FC<ActionsProps> = ({
  actions,
  medication,
  hiddenActionTypes = [],
}) => {
  const { t } = useTranslation();
  const { userPrivileges } = useUserPrivilege();

  if (actions.length === 0) return null;

  const visibleActions = actions.filter(
    (a) => !hiddenActionTypes.includes(a.type),
  );

  return (
    <OverflowMenu
      id={`medication-actions-menu-${medication.id}`}
      data-testid={`medication-actions-menu-${medication.id}`}
      aria-label={t('MEDICATIONS_ACTIONS_MENU_LABEL')}
      flipped
      size="sm"
      disabled={visibleActions.length === 0}
    >
      {visibleActions.map((action) => (
        <OverflowMenuItem
          id={`medication-action-${action.type}-${medication.id}`}
          data-testid={`medication-action-${action.type}-${medication.id}`}
          key={action.type}
          itemText={t(action.label)}
          disabled={!hasPrivilege(userPrivileges, action.requiredPrivilege)}
          onClick={() => handleAction(action, medication)}
        />
      ))}
    </OverflowMenu>
  );
};

export default Actions;
