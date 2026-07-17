import { DataTable } from '@bahmni/design-system';
import type { DataTableColumn } from '@bahmni/design-system';
import { generateUUID, useTranslation } from '@bahmni/services';
import jsonata from 'jsonata';
import { useEffect, useMemo, useState } from 'react';
import type { ResultFieldConfig } from './models';
import styles from './styles/CommonSearchWidget.module.scss';

interface ResultsTableProps {
  resultFields: ResultFieldConfig[];
  results: unknown[];
}

type ResultRow = Record<string, unknown> & { id: string };

type ResolvedField = { id: string; field: ResultFieldConfig };

const evaluateRows = async (
  results: unknown[],
  resolvedFields: ResolvedField[],
): Promise<ResultRow[]> => {
  const compiled = resolvedFields.map(({ id, field }) => ({
    key: id,
    expr: jsonata(field.expression),
  }));

  return Promise.all(
    results.map(async (item) => {
      const row: Record<string, unknown> = {
        id:
          (item as Record<string, unknown>).id != null
            ? String((item as Record<string, unknown>).id)
            : generateUUID(),
      };
      for (const { key, expr } of compiled) {
        row[key] = await expr.evaluate(item as Record<string, unknown>);
      }
      return row as ResultRow;
    }),
  );
};

const ResultsTable = ({ resultFields, results }: ResultsTableProps) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

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
    return null;
  }, [resultFields, t]);

  useEffect(() => {
    if (expressionError) return;
    setEvaluationError(null);
    evaluateRows(results, resolvedFields)
      .then(setRows)
      .catch(() => setEvaluationError(t('COMMON_SEARCH_EVALUATION_ERROR')));
  }, [results, resolvedFields, expressionError, t]);

  const errorStateMessage = expressionError ?? evaluationError;

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
      errorStateMessage={errorStateMessage}
      emptyStateMessage={t('COMMON_SEARCH_NO_RESULTS')}
      className={styles.dataTable}
    />
  );
};

export default ResultsTable;
