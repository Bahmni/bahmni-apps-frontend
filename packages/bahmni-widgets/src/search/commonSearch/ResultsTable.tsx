import { DataTable, Link } from '@bahmni/design-system';
import type {
  CursorPaginationConfig,
  DataTableColumn,
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
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { resolveNavigationURL } from '../../utils/urlUtils';
import { ActionConfig, ResultFieldConfig } from './models';
import styles from './styles/CommonSearchWidget.module.scss';
import { needsDisplayKey, resultTransforms } from './utils';

type ResultsTablePagination = Omit<
  CursorPaginationConfig,
  'previousSetLabel' | 'nextSetLabel' | 'previousPageLabel' | 'nextPageLabel'
>;

interface ResultsTableProps {
  resultFields: ResultFieldConfig[];
  results: unknown[];
  actions?: ActionConfig[];
  cursorPagination?: ResultsTablePagination;
  totalCount?: number;
}

type ResultRow = Record<string, unknown> & { id: string };

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

  return (
    <DataTable
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
      enablePagination={!!cursorPagination}
      cursorPagination={
        cursorPagination && {
          ...cursorPagination,
          previousSetLabel: t('COMMON_SEARCH_PREVIOUS_SET'),
          nextSetLabel: t('COMMON_SEARCH_NEXT_SET'),
          previousPageLabel: t('COMMON_SEARCH_PREVIOUS_PAGE'),
          nextPageLabel: t('COMMON_SEARCH_NEXT_PAGE'),
        }
      }
    />
  );
};

export default ResultsTable;
