import { SortableDataTable } from '@bahmni/design-system';
import { getConditionPage, useTranslation } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNotification } from '../notification';
import { ConditionViewModel } from './models';
import styles from './styles/ConditionsTable.module.scss';
import { createConditionViewModels } from './utils';

interface ConditionsTabContentProps {
  patientUUID: string;
  configPageSize: number;
  clinicalStatus: 'active' | 'inactive';
  emptyStateMessageKey: string;
  headers: Array<{ key: string; header: string }>;
  renderCell: (
    condition: ConditionViewModel,
    cellId: string,
  ) => React.ReactNode;
  /**
   * If true, the tab's query is enabled immediately on mount.
   * If false (default for lazy tabs), query is deferred until `enabled` flips to true externally.
   */
  enabled?: boolean;
}

const ConditionsTabContent: React.FC<ConditionsTabContentProps> = ({
  patientUUID,
  configPageSize,
  clinicalStatus,
  emptyStateMessageKey,
  headers,
  renderCell,
  enabled = true,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(configPageSize);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'conditions',
      clinicalStatus,
      patientUUID,
      currentPage,
      selectedPageSize,
    ],
    enabled: enabled && !!patientUUID,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const page = await getConditionPage(
        patientUUID,
        selectedPageSize,
        currentPage,
        clinicalStatus,
      );
      return {
        conditions: createConditionViewModels(page.conditions),
        total: page.total,
      };
    },
  });

  // Track whether patientUUID was previously set to reset page on change
  const prevPatientUUIDRef = useRef(patientUUID);
  useEffect(() => {
    if (prevPatientUUIDRef.current !== patientUUID) {
      prevPatientUUIDRef.current = patientUUID;
      setCurrentPage(1);
    }
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

  return (
    <div data-testid={`condition-table-${clinicalStatus}`}>
      <SortableDataTable
        headers={headers}
        ariaLabel={t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}
        rows={data?.conditions ?? []}
        loading={isLoading}
        errorStateMessage={isError ? error.message : null}
        emptyStateMessage={t(emptyStateMessageKey)}
        renderCell={renderCell}
        className={styles.conditionsTableBody}
        dataTestId={`conditions-table-${clinicalStatus}`}
        pageSize={selectedPageSize}
        totalItems={data?.total}
        page={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default ConditionsTabContent;
