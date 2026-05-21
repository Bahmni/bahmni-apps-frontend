import { SortableDataTable, StatusTag, Tile } from '@bahmni/design-system';
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
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ConfirmationModal from '../confirmationModal/ConfirmationModal';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import { useHasPrivilege } from '../userPrivileges/useHasPrivilege';
import { ConditionViewModel, ConditionStatus } from './models';
import styles from './styles/ConditionsTable.module.scss';
import { createConditionViewModels } from './utils';

const MARK_AS_INACTIVE = 'Mark as inactive';
const MARK_INACTIVE_CONFIRM_TITLE = 'CONDITION_MARK_INACTIVE_CONFIRM_TITLE';
const MARK_INACTIVE_CONFIRM_BODY = 'CONDITION_MARK_INACTIVE_CONFIRM_BODY';

interface ConditionActionConfig {
  label: string;
  type: string;
  requiredPrivilege?: string[];
}

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

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(configPageSize);
  const [conditionToMarkInactive, setConditionToMarkInactive] =
    useState<ConditionViewModel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const configActions = useMemo(
    () => (config?.actions as ConditionActionConfig[] | undefined) ?? [],
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

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['conditions', patientUUID!, currentPage, selectedPageSize],
    enabled: !!patientUUID,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const page = await getConditionPage(
        patientUUID!,
        selectedPageSize,
        currentPage,
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
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [patientUUID]);

  useEffect(() => {
    if (isError)
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
      });
  }, [isError, error, addNotification, t]);

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      if (newPageSize !== selectedPageSize) {
        setSelectedPageSize(newPageSize);
        setCurrentPage(1);
      } else {
        setCurrentPage(newPage);
      }
    },
    [selectedPageSize],
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
      refetch();
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
          <OverflowMenu
            size="sm"
            flipped
            disabled={isDisabled}
            data-testid={`condition-actions-menu-${condition.code}`}
            selectorPrimaryFocus=""
          >
            <OverflowMenuItem
              itemText={MARK_AS_INACTIVE}
              data-testid={`condition-mark-inactive-${condition.code}`}
              onClick={() =>
                !isDisabled && setConditionToMarkInactive(condition)
              }
            />
          </OverflowMenu>
        );
      }
      default:
        return undefined;
    }
  };

  return (
    <>
      {/* Recent and all Tabs will come inplace of Tile */}
      <Tile
        title={t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}
        data-testid="conditions-title"
        className={styles.conditionsTableTitle}
      >
        <p>{t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}</p>
      </Tile>
      <div data-testid="condition-table">
        <SortableDataTable
          headers={headers}
          ariaLabel={t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}
          rows={data?.conditions ?? []}
          loading={isLoading}
          errorStateMessage={isError ? error.message : null}
          emptyStateMessage={t('CONDITION_LIST_NO_CONDITIONS')}
          renderCell={renderCell}
          className={styles.conditionsTableBody}
          dataTestId="conditions-table"
          pageSize={selectedPageSize}
          totalItems={data?.total}
          page={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {/* AC 9-10: Confirmation modal for "Mark as inactive" */}
      <ConfirmationModal
        open={!!conditionToMarkInactive}
        heading={t(MARK_INACTIVE_CONFIRM_TITLE)}
        body={t(MARK_INACTIVE_CONFIRM_BODY)}
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
