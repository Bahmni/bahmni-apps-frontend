import { DataTable, Link } from '@bahmni/design-system';
import type { DataTableColumn } from '@bahmni/design-system';
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
import type { ActionConfig, ResultFieldConfig } from './models';
import styles from './styles/CommonSearchWidget.module.scss';
import { resolveNavigationURL, resultTransforms } from './utils';

interface ResultsTableProps {
  resultFields: ResultFieldConfig[];
  results: unknown[];
  actions?: ActionConfig[];
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
      for (const { key, expr, field } of compiled) {
        row[key] = await expr.evaluate(item as Record<string, unknown>);

        if (field.action && actions) {
          const action = actions.find((a) => a.key === field.action);
          if (action?.type === 'navigate') {
            const href = await resolveNavigationURL(action.navigationURL, item);
            row[`${key}_href`] = href;
          }
        }
      }

      for (const { key, expr, transform } of compiled) {
        const value = await expr.evaluate(item as Record<string, unknown>);
        if (!value) {
          row[key] = '-';
          continue;
        }
        row[key] = transform ? transform(String(value), t) : value;
      }
      return row as ResultRow;
    }),
  );
};

const ResultsTable = ({
  resultFields,
  results,
  actions,
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
  }, [resultFields, actions, t]);

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
      const cellValue = row[columnId] as string;
      const href = row[`${columnId}_href`] as string | null | undefined;

      const field = resolvedFields.find((rf) => rf.id === columnId)?.field;

      if (!field?.action || !href) {
        return <span>{cellValue ?? '-'}</span>;
      }

      if (!allowedActions.has(field.action)) {
        return <span>{cellValue ?? '-'}</span>;
      }

      return (
        <Link href={href} data-testid={`link-${row.id}-${columnId}`}>
          {cellValue}
        </Link>
      );
    },
    [resolvedFields, allowedActions],
  );

  const columns: DataTableColumn<ResultRow>[] = resolvedFields.map(
    ({ id, field }) => ({
      key: id,
      header: t(field.translationKey),
      enableSorting: field.enableSort ?? false,
      enableFiltering: !!field.filterType,
      filterType: field.filterType,
    }),
  );

  return (
    <DataTable
      id="common-search-results-table"
      dataTestId="common-search-results-table"
      ariaLabel="common-search-results-table-aria-label"
      title={t('COMMON_SEARCH_RESULTS_TABLE_TITLE')}
      columns={columns}
      rows={rows}
      renderCell={renderCell}
      errorStateMessage={errorStateMessage}
      emptyStateMessage={t('COMMON_SEARCH_NO_RESULTS')}
      className={styles.dataTable}
    />
  );
};

export default ResultsTable;
