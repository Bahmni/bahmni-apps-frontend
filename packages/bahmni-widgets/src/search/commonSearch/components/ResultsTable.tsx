import { DataTable, Link } from '@bahmni/design-system';
import type {
  DataTableColumn,
  DataTableInstance,
  DataTableSetDirection,
} from '@bahmni/design-system';
import { generateUUID, hasPrivilege, useTranslation } from '@bahmni/services';
import jsonata from 'jsonata';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useUserPrivilege } from '../../../userPrivileges/useUserPrivilege';
import { resolveNavigationURL } from '../../../utils/urlUtils';
import { ActionConfig, CursorDirection, ResultFieldConfig } from '../models';
import styles from '../styles/CommonSearchWidget.module.scss';
import { needsDisplayKey, resultTransforms } from '../utils';

interface ResultsTablePagination {
  batchSize: number;
  pageSize: number;
  currentSet: number;
  searchId: string;
  hasNextSet: boolean;
  hasPreviousSet: boolean;
  onSetChange: (direction: CursorDirection) => void;
}

interface ResultsTableProps {
  resultFields: ResultFieldConfig[];
  results: unknown[];
  actions?: ActionConfig[];
  cursorPagination?: ResultsTablePagination;
  totalCount?: number;
}

type ResultRow = Record<string, unknown> & { id: string };

const navigateSet = (
  direction: DataTableSetDirection,
  table: DataTableInstance<ResultRow>,
  fetchSet: (direction: CursorDirection) => void,
) => {
  fetchSet(direction);
  table.resetColumnFilters();
  table.resetGlobalFilter();
};

type ResolvedField = { id: string; field: ResultFieldConfig };

const evaluateRows = async (
  results: unknown[],
  resolvedFields: ResolvedField[],
  t: (key: string) => string,
  actions?: ActionConfig[],
): Promise<ResultRow[]> => {
  const compiled = resolvedFields.map(({ id, field }) => ({
    key: id,
    expr: jsonata(field.expression),
    field,
    transform: field.transform ? resultTransforms[field.transform] : undefined,
  }));

  return Promise.all(
    results.map(async (item) => {
      const row: Record<string, unknown> = {
        id:
          (item as Record<string, unknown>).id != null
            ? String((item as Record<string, unknown>).id)
            : generateUUID(),
      };
      for (const { key, expr, field, transform } of compiled) {
        const value = await expr.evaluate(item as Record<string, unknown>);

        if (field.action && actions) {
          const action = actions.find((a) => a.key === field.action);
          if (action?.type === 'navigate') {
            const href = await resolveNavigationURL(action.navigationURL, item);
            row[`${key}_href`] = href;
          }
        }

        if (!value) {
          row[key] = '-';
          continue;
        }
        if (needsDisplayKey(field.transform)) {
          row[key] = value;
          row[`${key}_display`] = transform
            ? transform(String(value), t)
            : String(value);
        } else {
          row[key] = transform ? transform(String(value), t) : value;
        }
      }
      return row as ResultRow;
    }),
  );
};

const ResultsTable = ({
  resultFields,
  results,
  actions,
  cursorPagination,
  totalCount,
}: ResultsTableProps) => {
  const { t } = useTranslation();
  const { userPrivileges } = useUserPrivilege();
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const allowedActions = useMemo(() => {
    if (!actions) return new Set<string>();
    return new Set(
      actions
        .filter((action) =>
          hasPrivilege(userPrivileges, action.requiredPrivileges ?? []),
        )
        .map((action) => action.key),
    );
  }, [actions, userPrivileges]);

  const resolvedFields = useMemo(
    () => resultFields.map((field) => ({ id: generateUUID(), field })),
    [resultFields],
  );

  const expressionError = useMemo(() => {
    for (const field of resultFields) {
      try {
        jsonata(field.expression);
      } catch {
        return t('COMMON_SEARCH_INVALID_EXPRESSION');
      }
    }

    if (actions) {
      for (const action of actions) {
        if (action.type === 'navigate') {
          const placeholders = [
            ...action.navigationURL.matchAll(/\{([^}]+)\}/g),
          ];
          for (const [, expression] of placeholders) {
            try {
              jsonata(expression);
            } catch {
              return t('COMMON_SEARCH_INVALID_EXPRESSION');
            }
          }
        }
      }
    }

    return null;
  }, [resultFields, actions]);

  useEffect(() => {
    if (expressionError) return;
    setEvaluationError(null);
    evaluateRows(results, resolvedFields, t, actions)
      .then(setRows)
      .catch(() => setEvaluationError(t('COMMON_SEARCH_EVALUATION_ERROR')));
  }, [results, resolvedFields, actions, expressionError, t]);

  const errorStateMessage = expressionError ?? evaluationError;

  const renderCell = useCallback(
    (row: ResultRow, columnId: string): ReactNode => {
      const cellValue = (row[`${columnId}_display`] ?? row[columnId]) as string;
      const href = row[`${columnId}_href`] as string | null | undefined;

      const field = resolvedFields.find((rf) => rf.id === columnId)?.field;

      const isNavigable =
        field?.action && href && allowedActions.has(field.action);

      if (isNavigable) {
        return (
          <Link href={href} data-testid={`link-${row.id}-${columnId}`}>
            {cellValue}
          </Link>
        );
      }

      return <span>{cellValue ?? '-'}</span>;
    },
    [resolvedFields, allowedActions],
  );

  const columns: DataTableColumn<ResultRow>[] = useMemo(
    () =>
      resolvedFields.map(({ id, field }) => ({
        key: id,
        header: t(field.translationKey),
        enableSorting: field.enableSort ?? false,
        defaultSortDirection: field.enableSort
          ? (field.sortOrder ?? undefined)
          : field.sortOrder,
        enableFiltering: !!field.filterType,
        filterType: field.filterType,
      })),
    [resolvedFields],
  );

  const startPage = cursorPagination
    ? cursorPagination.currentSet *
        Math.max(
          Math.ceil(cursorPagination.batchSize / cursorPagination.pageSize),
          1,
        ) +
      1
    : undefined;

  return (
    <DataTable
      key={cursorPagination?.searchId}
      id="common-search-results-table"
      dataTestId="common-search-results-table"
      ariaLabel="common-search-results-table-aria-label"
      title={
        totalCount === undefined
          ? t('COMMON_SEARCH_RESULTS_TABLE_TITLE')
          : t('COMMON_SEARCH_RESULTS_TABLE_TITLE_WITH_COUNT', {
              total: totalCount,
            })
      }
      columns={columns}
      rows={rows}
      renderCell={renderCell}
      errorStateMessage={errorStateMessage}
      emptyStateMessage={t('COMMON_SEARCH_NO_RESULTS')}
      className={styles.dataTable}
      pagination={
        cursorPagination && {
          mode: 'cursor',
          pageSize: cursorPagination.pageSize,
          startPage,
          hasNext: cursorPagination.hasNextSet,
          hasPrevious: cursorPagination.hasPreviousSet,
          onSetChange: (direction, table) =>
            navigateSet(direction, table, cursorPagination.onSetChange),
          previousLabel: t('COMMON_SEARCH_PREVIOUS_SET'),
          nextLabel: t('COMMON_SEARCH_NEXT_SET'),
        }
      }
    />
  );
};

export default ResultsTable;
