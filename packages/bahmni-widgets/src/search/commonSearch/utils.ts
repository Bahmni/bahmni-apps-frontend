import { v4 as uuidv4 } from 'uuid';
import {
  CriterionConfig,
  CriterionRow,
  CriterionValue,
  InputConfig,
  ScalarValue,
  SearchContextConfig,
  TextInput,
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

export const validateTextInput = (
  value: CriterionValue | null,
  input: TextInput,
  errorMessage: string,
): string | null => {
  if (!input.regex || !value) return null;
  if (!isScalarValue(value)) return null;
  return new RegExp(input.regex).test(value.value) ? null : errorMessage;
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
    const fromNum = Number.parseFloat(fromVal);
    const toNum = Number.parseFloat(toVal);
    return !Number.isNaN(fromNum) && !Number.isNaN(toNum) && fromNum > toNum
      ? errorMessage
      : null;
  }
  return new Date(fromVal) > new Date(toVal) ? errorMessage : null;
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

const validateByType = (
  value: CriterionValue | null,
  criterion: CriterionConfig,
  rangeOrderMessage: string,
  t: (key: string, options?: { defaultValue?: string }) => string,
): { validationError: string | null; rangeOrderError: string | null } => {
  switch (criterion.input.kind) {
    case 'text':
      return {
        validationError: validateTextInput(
          value,
          criterion.input,
          t(`${criterion.translationKey}_INVALID_FORMAT`, {
            defaultValue: t('COMMON_SEARCH_INVALID_FORMAT'),
          }),
        ),
        rangeOrderError: null,
      };
    case 'numeric':
    case 'date':
      return {
        validationError: null,
        rangeOrderError: getRangeOrderError(
          value,
          criterion.input,
          rangeOrderMessage,
        ),
      };
    default:
      return { validationError: null, rangeOrderError: null };
  }
};

export const validateRows = (
  rows: CriterionRow[],
  criteria: CriterionConfig[],
  criterionError: string,
  valueError: string,
  rangeOrderMessage: string,
  t: (key: string, options?: { defaultValue?: string }) => string,
): CriterionRow[] =>
  rows.map((r) => {
    if (!r.criterionKey)
      return { ...r, validationError: criterionError, rangeOrderError: null };
    const criterion = criteria.find((c) => c.field.key === r.criterionKey)!;
    const valueValidationError = getValueError(
      r.value,
      criterion.input,
      valueError,
    );
    if (valueValidationError)
      return {
        ...r,
        validationError: valueValidationError,
        rangeOrderError: null,
      };
    const { validationError, rangeOrderError } = validateByType(
      r.value,
      criterion,
      rangeOrderMessage,
      t,
    );
    return { ...r, validationError, rangeOrderError };
  });
