import {
  Button,
  StatusTag,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@bahmni/design-system';
import {
  markConditionAsInactive,
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  type AuditEventType,
  useTranslation,
  FormatDateResult,
  formatDateDistance,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import ConfirmationModal from '../confirmationModal/ConfirmationModal';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetActionConfig, WidgetProps } from '../registry/model';
import { useHasPrivilege } from '../userPrivileges/useHasPrivilege';
import ConditionsTabContent from './ConditionsTabContent';
import { ConditionViewModel, ConditionStatus } from './models';
import styles from './styles/ConditionsTable.module.scss';

// TODO: Take UUID As A Prop
const ConditionsTable: React.FC<WidgetProps> = ({
  config,
  disableActions = false,
  activeEncounter,
  activeEncounterMatched,
}) => {
  // Number() safely handles non-numeric config values (NaN → falsy → fallback 5)
  const configPageSize = Number(config?.pageSize) || 5;
  const encounterTypeName = config?.encounterType as string | undefined;
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const [selectedIndex, setSelectedIndex] = useState(0);
  // Lazy-load: only enable inactive query once user has visited the inactive tab
  const [inactiveTabEverOpened, setInactiveTabEverOpened] = useState(false);

  const [conditionToMarkInactive, setConditionToMarkInactive] =
    useState<ConditionViewModel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const configActions = useMemo(
    () => (config?.actions as WidgetActionConfig[] | undefined) ?? [],
    [config?.actions],
  );
  const actionPrivileges = useMemo(
    () => configActions.flatMap((a) => a.requiredPrivilege ?? []),
    [configActions],
  );
  const hasActionPrivilege = useHasPrivilege(
    actionPrivileges.length > 0 ? actionPrivileges : undefined,
  );
  const showActions =
    configActions.length > 0 &&
    (actionPrivileges.length === 0 || hasActionPrivilege);

  const handleTabChange = useCallback(
    ({ selectedIndex: idx }: { selectedIndex: number }) => {
      setSelectedIndex(idx);
      if (idx === 1) {
        setInactiveTabEverOpened(true);
      }
    },
    [],
  );

  useSubscribeConsultationSaved(
    (payload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.conditions
      ) {
        // Invalidate both tabs' queries (they share the 'conditions' prefix)
        queryClient.invalidateQueries({ queryKey: ['conditions'] });
      }
    },
    [patientUUID, queryClient],
  );

  const handleConfirmMarkInactive = async () => {
    if (!conditionToMarkInactive?.rawFhirResource) return;
    setIsSubmitting(true);
    try {
      await markConditionAsInactive(
        conditionToMarkInactive.rawFhirResource,
        activeEncounter ?? undefined,
        activeEncounterMatched ?? false,
        encounterTypeName,
        patientUUID ?? undefined,
      );
      dispatchAuditEvent({
        eventType: AUDIT_LOG_EVENT_DETAILS.EDIT_ENCOUNTER
          .eventType as AuditEventType,
        patientUuid: patientUUID!,
        messageParams: { conditionDisplay: conditionToMarkInactive.display },
      });
    } catch {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: t('CONDITION_MARK_INACTIVE_ERROR'),
        type: 'error',
        timeout: 5000,
      });
    } finally {
      setIsSubmitting(false);
      setConditionToMarkInactive(null);
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
    }
  };

  const baseHeaders = useMemo(
    () => [
      { key: 'display', header: t('CONDITION_LIST_CONDITION') },
      { key: 'onsetDate', header: t('CONDITION_TABLE_DURATION') },
      { key: 'recorder', header: t('CONDITION_TABLE_RECORDED_BY') },
      { key: 'status', header: t('CONDITION_LIST_STATUS') },
    ],
    [t],
  );

  const activeHeaders = useMemo(
    () =>
      showActions
        ? [...baseHeaders, { key: 'actions', header: t('ACTIONS') }]
        : baseHeaders,
    [baseHeaders, showActions, t],
  );

  const inactiveHeaders = baseHeaders;

  const renderCell = useCallback(
    (condition: ConditionViewModel, cellId: string) => {
      switch (cellId) {
        case 'display':
          return (
            <span className={styles.conditionName}>{condition.display}</span>
          );
        case 'status':
          return (
            <StatusTag
              label={
                condition.status === ConditionStatus.Active
                  ? t('CONDITION_LIST_ACTIVE')
                  : t('CONDITION_LIST_INACTIVE')
              }
              dotClassName={
                condition.status === ConditionStatus.Active
                  ? styles.activeStatus
                  : styles.inactiveStatus
              }
              testId={`condition-status-${condition.code}`}
            />
          );
        case 'onsetDate': {
          const onsetDate: FormatDateResult = formatDateDistance(
            condition.onsetDate ?? '',
            t,
          );
          if (onsetDate.error) {
            return t('CONDITION_TABLE_NOT_AVAILABLE');
          }
          return t('CONDITION_ONSET_SINCE_FORMAT', {
            timeAgo: onsetDate.formattedResult,
          });
        }
        case 'recorder':
          return condition.recorder;
        case 'actions': {
          const isActive = condition.status === ConditionStatus.Active;
          const isDisabled = !isActive || disableActions;
          return (
            <Button
              kind="ghost"
              size="sm"
              disabled={isDisabled}
              data-testid={`condition-mark-inactive-${condition.code}`}
              onClick={() =>
                !isDisabled && setConditionToMarkInactive(condition)
              }
            >
              {t('CONDITION_MARK_AS_INACTIVE')}
            </Button>
          );
        }
        default:
          return undefined;
      }
    },
    [t, disableActions, setConditionToMarkInactive],
  );

  return (
    <>
      <Tabs
        selectedIndex={selectedIndex}
        onChange={handleTabChange}
        testId="conditions-tabs"
      >
        <TabList
          aria-label={t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}
          className={styles.conditionsTabList}
        >
          <Tab>{t('CONDITION_LIST_ACTIVE_TAB')}</Tab>
          <Tab>{t('CONDITION_LIST_INACTIVE_TAB')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel className={styles.conditionsTabPanel}>
            {patientUUID && (
              <ConditionsTabContent
                patientUUID={patientUUID}
                configPageSize={configPageSize}
                clinicalStatus="active"
                emptyStateMessageKey="CONDITION_LIST_NO_ACTIVE_CONDITIONS"
                headers={activeHeaders}
                renderCell={renderCell}
                enabled
              />
            )}
          </TabPanel>
          <TabPanel className={styles.conditionsTabPanel}>
            {patientUUID && (
              <ConditionsTabContent
                patientUUID={patientUUID}
                configPageSize={configPageSize}
                clinicalStatus="inactive"
                emptyStateMessageKey="CONDITION_LIST_NO_INACTIVE_CONDITIONS"
                headers={inactiveHeaders}
                renderCell={renderCell}
                enabled={inactiveTabEverOpened}
              />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ConfirmationModal
        open={!!conditionToMarkInactive}
        heading={t('CONDITION_MARK_INACTIVE_CONFIRM_TITLE')}
        body={t('CONDITION_MARK_INACTIVE_CONFIRM_BODY')}
        confirmLabel={t('YES')}
        cancelLabel={t('NO')}
        isSubmitting={isSubmitting}
        testId="mark-inactive-confirm-modal"
        onConfirm={handleConfirmMarkInactive}
        onCancel={() => setConditionToMarkInactive(null)}
      />
    </>
  );
};

export default ConditionsTable;
