import {
  Button,
  SortableDataTable,
  StatusTag,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@bahmni/design-system';
import {
  getConditionPage,
  markConditionAsInactive,
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  type AuditEventType,
  useTranslation,
  FormatDateResult,
  formatDateDistance,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmationModal from '../confirmationModal/ConfirmationModal';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetActionConfig, WidgetProps } from '../registry/model';
import { useHasPrivilege } from '../userPrivileges/useHasPrivilege';
import { ConditionViewModel, ConditionStatus } from './models';
import styles from './styles/ConditionsTable.module.scss';
import { createConditionViewModels } from './utils';

// TODO: Take UUID As A Prop
const ConditionsTable: React.FC<WidgetProps> = ({
  config,
  disableActions = false,
}) => {
  // Number() safely handles non-numeric config values (NaN → falsy → fallback 10)
  const configPageSize = Number(config?.pageSize) || 5;
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const [tabIndex, setTabIndex] = useState(0);

  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(configPageSize);

  const [inactiveCurrentPage, setInactiveCurrentPage] = useState(1);
  const [inactivePageSize, setInactivePageSize] = useState(configPageSize);

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

  const {
    data: activeData,
    isLoading: activeIsLoading,
    isError: activeIsError,
    error: activeError,
    refetch: activeRefetch,
  } = useQuery({
    queryKey: [
      'conditions',
      patientUUID!,
      'active',
      activeCurrentPage,
      activePageSize,
    ],
    enabled: !!patientUUID,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const page = await getConditionPage(
        patientUUID!,
        activePageSize,
        activeCurrentPage,
        'active',
      );
      return {
        conditions: createConditionViewModels(page.conditions),
        total: page.total,
      };
    },
  });

  const {
    data: inactiveData,
    isLoading: inactiveIsLoading,
    isError: inactiveIsError,
    error: inactiveError,
    refetch: inactiveRefetch,
  } = useQuery({
    queryKey: [
      'conditions',
      patientUUID!,
      'inactive',
      inactiveCurrentPage,
      inactivePageSize,
    ],
    enabled: !!patientUUID,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const page = await getConditionPage(
        patientUUID!,
        inactivePageSize,
        inactiveCurrentPage,
        'inactive',
      );
      return {
        conditions: createConditionViewModels(page.conditions),
        total: page.total,
      };
    },
  });

  useSubscribeConsultationSaved(
    (payload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.conditions
      ) {
        activeRefetch();
        inactiveRefetch();
      }
    },
    [patientUUID, activeRefetch, inactiveRefetch],
  );

  useEffect(() => {
    setActiveCurrentPage(1);
    setInactiveCurrentPage(1);
  }, [patientUUID]);

  useEffect(() => {
    const isError = activeIsError || inactiveIsError;
    const error = activeIsError ? activeError : inactiveError;
    if (isError && error)
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
      });
  }, [
    activeIsError,
    activeError,
    inactiveIsError,
    inactiveError,
    addNotification,
    t,
  ]);

  const handleActivePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      if (newPageSize !== activePageSize) {
        setActivePageSize(newPageSize);
        setActiveCurrentPage(1);
      } else {
        setActiveCurrentPage(newPage);
      }
    },
    [activePageSize],
  );

  const handleInactivePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      if (newPageSize !== inactivePageSize) {
        setInactivePageSize(newPageSize);
        setInactiveCurrentPage(1);
      } else {
        setInactiveCurrentPage(newPage);
      }
    },
    [inactivePageSize],
  );

  const handleConfirmMarkInactive = async () => {
    if (!conditionToMarkInactive?.rawFhirResource) return;
    setIsSubmitting(true);
    try {
      await markConditionAsInactive(conditionToMarkInactive.rawFhirResource);
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
      await activeRefetch();
      await inactiveRefetch();
    }
  };

  const headers = useMemo(() => {
    const base = [
      { key: 'display', header: t('CONDITION_LIST_CONDITION') },
      { key: 'onsetDate', header: t('CONDITION_TABLE_DURATION') },
      { key: 'recorder', header: t('CONDITION_TABLE_RECORDED_BY') },
      { key: 'status', header: t('CONDITION_LIST_STATUS') },
    ];
    if (showActions) {
      base.push({ key: 'actions', header: t('ACTIONS') });
    }
    return base;
  }, [t, showActions]);

  const renderCell = (condition: ConditionViewModel, cellId: string) => {
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
            onClick={() => !isDisabled && setConditionToMarkInactive(condition)}
          >
            {t('CONDITION_MARK_AS_INACTIVE')}
          </Button>
        );
      }
      default:
        return undefined;
    }
  };

  return (
    <>
      <div data-testid="condition-table">
        <Tabs
          selectedIndex={tabIndex}
          onChange={(state) => setTabIndex(state.selectedIndex)}
        >
          <TabList aria-label={t('CONDITION_TAB_LIST_ARIA_LABEL')}>
            <Tab>{t('CONDITION_TAB_ACTIVE')}</Tab>
            <Tab>{t('CONDITION_TAB_INACTIVE')}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <SortableDataTable
                headers={headers}
                ariaLabel={t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}
                rows={activeData?.conditions ?? []}
                loading={activeIsLoading}
                errorStateMessage={activeIsError ? activeError.message : null}
                emptyStateMessage={t('CONDITION_LIST_NO_ACTIVE_CONDITIONS')}
                renderCell={renderCell}
                className={styles.conditionsTableBody}
                dataTestId="conditions-active-table"
                pageSize={activePageSize}
                totalItems={activeData?.total}
                page={activeCurrentPage}
                onPageChange={handleActivePageChange}
              />
            </TabPanel>
            <TabPanel>
              <SortableDataTable
                headers={headers}
                ariaLabel={t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}
                rows={inactiveData?.conditions ?? []}
                loading={inactiveIsLoading}
                errorStateMessage={
                  inactiveIsError ? inactiveError.message : null
                }
                emptyStateMessage={t('CONDITION_LIST_NO_INACTIVE_CONDITIONS')}
                renderCell={renderCell}
                className={styles.conditionsTableBody}
                dataTestId="conditions-inactive-table"
                pageSize={inactivePageSize}
                totalItems={inactiveData?.total}
                page={inactiveCurrentPage}
                onPageChange={handleInactivePageChange}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>

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
