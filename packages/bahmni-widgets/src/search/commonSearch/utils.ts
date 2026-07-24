import { AuditEventType, camelToScreamingSnakeCase } from '@bahmni/services';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import {
  KEY_TYPE_KIND_SUFFIX,
  KEY_TYPE_VALUE_SUFFIX,
  LOCAL_ISO_DATE_FORMAT,
  LOCATION_UUID_FIELD,
} from './constants';
import {
  CriterionConfig,
  CriterionRow,
  CriterionValue,
  InputConfig,
  ResolvedRow,
  ScalarValue,
  SearchCondition,
  SearchPayload,
  SearchContextConfig,
  TextInput,
} from './models';

export const toSearchAuditEventType = (
  context: SearchContextConfig['context'],
): AuditEventType =>
  `SEARCHED_${camelToScreamingSnakeCase(context)}` as AuditEventType;

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

const buildCondition = ({ field, value }: ResolvedRow): SearchCondition => {
  if (!isScalarValue(value)) {
    return {
      operator: 'AND',
      conditions: [
        { field: field.key, comparator: 'gt', value: value.from.value! },
        { field: field.key, comparator: 'lt', value: value.to!.value! },
      ],
    };
  }
  if (field.keyType) {
    return {
      operator: 'AND',
      conditions: [
        {
          field: `${field.key}${KEY_TYPE_KIND_SUFFIX}`,
          comparator: 'eq',
          value: field.keyType,
        },
        {
          field: `${field.key}${KEY_TYPE_VALUE_SUFFIX}`,
          comparator: 'eq',
          value: value.value,
        },
      ],
    };
  }
  return { field: field.key, comparator: 'eq', value: value.value };
};

const toLocalIso = (v: string): string =>
  format(new Date(v), LOCAL_ISO_DATE_FORMAT);

const localizeDateTime = (value: CriterionValue): CriterionValue => {
  if (isScalarValue(value)) return { value: toLocalIso(value.value) };
  return {
    from: {
      ...value.from,
      value: value.from.value ? toLocalIso(value.from.value) : null,
    },
    ...(value.to && {
      to: {
        ...value.to,
        value: value.to.value ? toLocalIso(value.to.value) : null,
      },
    }),
  };
};

export const resolveRows = (
  rows: CriterionRow[],
  criteria: CriterionConfig[],
): ResolvedRow[] =>
  rows
    .filter(
      (
        r,
      ): r is CriterionRow & { criterionKey: string; value: CriterionValue } =>
        r.criterionKey !== null && r.value !== null,
    )
    .map((r) => {
      const criterion = criteria.find((c) => c.field.key === r.criterionKey)!;
      const value =
        criterion.input.kind === 'date' ? localizeDateTime(r.value) : r.value;
      return { field: criterion.field, value };
    });

export const buildPayload = (
  resolvedRows: ResolvedRow[],
  entity: string,
  locationUuid: string,
): SearchPayload => ({
  entity,
  criteria: {
    operator: 'AND',
    conditions: [
      ...resolvedRows.map(buildCondition),
      { field: LOCATION_UUID_FIELD, comparator: 'eq', value: locationUuid },
    ],
  },
});

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
