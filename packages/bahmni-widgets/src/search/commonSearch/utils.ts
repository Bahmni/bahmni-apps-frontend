import {
  AuditEventType,
  camelToScreamingSnakeCase,
  DEFAULT_TIME_FORMAT,
  formatCountry,
  formatDateTime,
  formatGender,
  getFormattedAge,
  hasPrivilege,
  type UserPrivilege,
} from '@bahmni/services';
import { format } from 'date-fns';
import jsonata from 'jsonata';
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
  FieldConfig,
  InputConfig,
  ResolvedRow,
  ScalarValue,
  SearchCondition,
  SearchPayload,
  SearchContextConfig,
  TextInput,
} from './models';

export type ResultTransform = (
  value: string,
  t: (key: string) => string,
) => string | null;

export type DateTimeValue = string | Date | number;

export const formatSearchResult = (
  value: string,
  t: (key: string) => string,
): string | null => {
  const raw = value.trim();
  if (!raw) return null;
  return t(`COMMON_SEARCH_RESULT_${camelToScreamingSnakeCase(raw)}`);
};

const TRANSFORM_KEYS = {
  formatDate: 'formatDate',
  formatTime: 'formatTime',
  formatDateTime: 'formatDateTime',
  formatAge: 'formatAge',
  formatGender: 'formatGender',
  formatCountry: 'formatCountry',
  formatSearchResult: 'formatSearchResult',
} as const;

export const resultTransforms: Record<string, ResultTransform> = {
  [TRANSFORM_KEYS.formatDate]: (value: unknown, t: (key: string) => string) =>
    formatDateTime(value as DateTimeValue, t).formattedResult,
  [TRANSFORM_KEYS.formatTime]: (value: unknown, t: (key: string) => string) =>
    formatDateTime(value as DateTimeValue, t, false, DEFAULT_TIME_FORMAT)
      .formattedResult,
  [TRANSFORM_KEYS.formatDateTime]: (
    value: unknown,
    t: (key: string) => string,
  ) => formatDateTime(value as DateTimeValue, t, true).formattedResult,
  [TRANSFORM_KEYS.formatAge]: (value: unknown, t: (key: string) => string) =>
    getFormattedAge(value as string | number, t),
  [TRANSFORM_KEYS.formatGender]: formatGender,
  [TRANSFORM_KEYS.formatCountry]: formatCountry,
  [TRANSFORM_KEYS.formatSearchResult]: formatSearchResult,
};

const DISPLAY_KEY_TRANSFORMS: string[] = [
  TRANSFORM_KEYS.formatDate,
  TRANSFORM_KEYS.formatTime,
  TRANSFORM_KEYS.formatDateTime,
  TRANSFORM_KEYS.formatAge,
];

export const needsDisplayKey = (transform?: string): boolean =>
  !!transform && DISPLAY_KEY_TRANSFORMS.includes(transform);

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

const getCriterionId = (field: FieldConfig): string =>
  field.keyType ? `${field.key}:${field.keyType}` : field.key;

export const processContextConfigs = (
  contexts: SearchContextConfig[],
  userPrivileges: UserPrivilege[] | null,
): SearchContextConfig[] =>
  contexts
    .filter((ctx) => hasPrivilege(userPrivileges, ctx.requiredPrivileges))
    .map((ctx) => ({
      ...ctx,
      criteria: ctx.criteria.map((c) => ({
        ...c,
        id: getCriterionId(c.field),
      })),
    }));

export const makeRow = (criterionKey: string | null): CriterionRow => ({
  rowId: uuidv4(),
  criterionKey,
  value: null,
  validationError: null,
  rangeOrderError: null,
});

export const initialRows = (context: SearchContextConfig): CriterionRow[] => {
  const defaults = context.criteria.filter((c) => c.default);
  if (defaults.length > 0) return defaults.map((c) => makeRow(c.id!));
  return [makeRow(context.criteria[0].id!)];
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
  return criteria.filter((c) => !activeKeys.has(c.id!));
};

export const criteriaAvailableToAdd = (
  criteria: CriterionConfig[],
  rows: CriterionRow[],
): CriterionConfig[] => {
  const activeKeys = activeKeysFrom(rows);
  return criteria.filter((c) => !activeKeys.has(c.id!));
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
    .flatMap((r) => {
      const criterion = criteria.find((c) => c.id === r.criterionKey);
      if (!criterion) return [];
      const value =
        criterion.input.kind === 'date' ? localizeDateTime(r.value) : r.value;
      return [{ field: criterion.field, value }];
    });

export const buildPayload = (
  resolvedRows: ResolvedRow[],
  entity: string,
  locationUuid?: string | undefined,
): SearchPayload => ({
  entity,
  criteria: {
    operator: 'AND',
    conditions: [
      ...resolvedRows.map(buildCondition),
      ...(locationUuid
        ? [
            {
              field: LOCATION_UUID_FIELD,
              comparator: 'eq' as const,
              value: locationUuid,
            },
          ]
        : []),
    ],
  },
});

export const validateRows = (
  rows: CriterionRow[],
  criteria: CriterionConfig[],
  criterionError: string,
  valueError: string,
  rangeOrderMessage: string,
  additionalCriterionRequiredMessage: string,
  t: (key: string, options?: { defaultValue?: string }) => string,
): CriterionRow[] => {
  const activeCriteriaCount = rows.filter(
    (r) => r.criterionKey !== null,
  ).length;
  return rows.map((r) => {
    if (!r.criterionKey)
      return { ...r, validationError: criterionError, rangeOrderError: null };
    const criterion = criteria.find((c) => c.id === r.criterionKey);
    if (!criterion) return r;
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
    if (
      !validationError &&
      !rangeOrderError &&
      criterion.requiresAdditionalCriterion &&
      activeCriteriaCount <= 1
    ) {
      return {
        ...r,
        validationError: additionalCriterionRequiredMessage,
        rangeOrderError: null,
      };
    }
    return { ...r, validationError, rangeOrderError };
  });
};

export const reconcileAdditionalCriterionErrors = (
  rows: CriterionRow[],
  criteria: CriterionConfig[],
  additionalCriterionRequiredMessage: string,
): CriterionRow[] => {
  const activeCriteriaCount = rows.filter(
    (r) => r.criterionKey !== null,
  ).length;
  if (activeCriteriaCount <= 1) return rows;
  return rows.map((r) =>
    r.validationError === additionalCriterionRequiredMessage
      ? { ...r, validationError: null }
      : r,
  );
};

export const validateConfigForActions = (
  contexts: SearchContextConfig[],
): string | null => {
  for (const context of contexts) {
    const hasActionReferences = context.resultFields.some((f) => f.action);

    if (
      hasActionReferences &&
      (!context.actions || context.actions.length === 0)
    ) {
      return 'COMMON_SEARCH_CONFIG_VALIDATION_UNKNOWN_ACTION';
    }

    if (context.actions) {
      const actionKeys = context.actions.map((a) => a.key);
      const duplicates = actionKeys.filter(
        (key, idx) => actionKeys.indexOf(key) !== idx,
      );
      if (duplicates.length > 0) {
        return 'COMMON_SEARCH_CONFIG_VALIDATION_DUPLICATE_ACTION';
      }

      const actionKeySet = new Set(actionKeys);

      for (const field of context.resultFields) {
        if (field.action && !actionKeySet.has(field.action)) {
          return 'COMMON_SEARCH_CONFIG_VALIDATION_UNKNOWN_ACTION';
        }
      }
    }
  }
  return null;
};

export const resolveNavigationURL = async (
  template: string,
  rowData: unknown,
): Promise<string | null> => {
  try {
    const placeholders = [...template.matchAll(/\{([^}]+)\}/g)];
    let resolved = template;

    for (const [fullMatch, expression] of placeholders) {
      const compiled = jsonata(expression);
      const value = await compiled.evaluate(rowData as Record<string, unknown>);
      if (value == null) return null;
      resolved = resolved.replace(fullMatch, encodeURIComponent(String(value)));
    }

    return resolved;
  } catch {
    return null;
  }
};
