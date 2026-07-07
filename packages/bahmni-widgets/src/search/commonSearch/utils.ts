import { v4 as uuidv4 } from 'uuid';
import {
  CriterionConfig,
  CriterionRow,
  CriterionValue,
  InputConfig,
  ScalarValue,
  SearchContextConfig,
} from './models';

const isRangeInput = (input: InputConfig): boolean =>
  (input.kind === 'date' || input.kind === 'numeric') && !!input.rangeAllowed;

const isScalarValue = (v: CriterionValue): v is ScalarValue => 'value' in v;

export const getValueError = (
  value: CriterionValue | null,
  input: InputConfig,
  errorMessage: string,
): string | null => {
  if (!value) return errorMessage;
  if (isScalarValue(value)) return value.value ? null : errorMessage;
  const valid = isRangeInput(input)
    ? !!value.from.value && !!value.to?.value
    : !!value.from.value;
  return valid ? null : errorMessage;
};

export const getRangeOrderError = (
  value: CriterionValue | null,
  input: InputConfig,
  errorMessage: string,
): string | null => {
  if (!isRangeInput(input) || !value || isScalarValue(value)) return null;
  const fromVal = value.from.value;
  const toVal = value.to?.value;
  if (!fromVal || !toVal) return null;
  if (input.kind === 'numeric') {
    const f = Number.parseFloat(fromVal);
    const t = Number.parseFloat(toVal);
    return !Number.isNaN(f) && !Number.isNaN(t) && f > t ? errorMessage : null;
  }
  if (input.kind === 'date') {
    return new Date(fromVal) > new Date(toVal) ? errorMessage : null;
  }
  return null;
};

export const makeRow = (criterionKey: string | null): CriterionRow => ({
  rowId: uuidv4(),
  criterionKey,
  value: null,
  validationError: null,
  rangeOrderError: null,
});

export const initialRows = (context: SearchContextConfig): CriterionRow[] => {
  const defaults = context.criteria.filter((c) => c.default);
  if (defaults.length > 0) return defaults.map((c) => makeRow(c.field.key));
  return [makeRow(context.criteria[0].field.key)];
};

const activeKeysFrom = (
  rows: CriterionRow[],
  excludeRowId?: string,
): Set<string> =>
  new Set(
    rows
      .filter(
        (r): r is CriterionRow & { criterionKey: string } =>
          r.criterionKey !== null && r.rowId !== excludeRowId,
      )
      .map((r) => r.criterionKey),
  );

export const availableCriteriaForRow = (
  criteria: CriterionConfig[],
  rows: CriterionRow[],
  currentRowId: string,
): CriterionConfig[] => {
  const activeKeys = activeKeysFrom(rows, currentRowId);
  return criteria.filter((c) => !activeKeys.has(c.field.key));
};

export const criteriaAvailableToAdd = (
  criteria: CriterionConfig[],
  rows: CriterionRow[],
): CriterionConfig[] => {
  const activeKeys = activeKeysFrom(rows);
  return criteria.filter((c) => !activeKeys.has(c.field.key));
};

export const updateRow = (
  rows: CriterionRow[],
  rowId: string,
  updater: (row: CriterionRow) => Partial<CriterionRow>,
): CriterionRow[] =>
  rows.map((r) => (r.rowId === rowId ? { ...r, ...updater(r) } : r));

export const validateRows = (
  rows: CriterionRow[],
  criteria: CriterionConfig[],
  criterionError: string,
  valueError: string,
  rangeOrderMessage: string,
): CriterionRow[] =>
  rows.map((r) => {
    if (!r.criterionKey)
      return { ...r, validationError: criterionError, rangeOrderError: null };
    const criterion = criteria.find((c) => c.field.key === r.criterionKey)!;
    const validationError = getValueError(r.value, criterion.input, valueError);
    const rangeOrderError = validationError
      ? null
      : getRangeOrderError(r.value, criterion.input, rangeOrderMessage);
    return { ...r, validationError, rangeOrderError };
  });
