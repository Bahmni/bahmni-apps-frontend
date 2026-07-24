import { formatCountry, formatGender, type Translator } from '@bahmni/services';
import { TextInput } from '../models';
import {
  initialRows,
  availableCriteriaForRow,
  criteriaAvailableToAdd,
  validateTextInput,
  getRangeOrderError,
  updateRow,
  validateRows,
  resolveRows,
  buildPayload,
  resultTransforms,
} from '../utils';
import {
  mockContextMultipleDefaults,
  mockPatientContext,
  mockPatientContextWithRangeNumeric,
  mockPatientContextWithRegex,
  mockContextNoDefaults,
} from './__mocks__/searchFormMocks';
import {
  mockRowGenderNoValue,
  mockRowGenderWithValue,
  mockRowNoCriterion,
  mockRowRangeNoBounds,
  mockRowRangePartial,
  mockRowRangeFull,
  mockRowRangeInvalidOrder,
  mockRowScalarEmpty,
  mockRowTextFailingRegex,
  mockRowTextNoValue,
  mockRowTextPassingRegex,
  mockRowTextWithValue,
  mockRowWithKeyTypeValue,
  mockResolvedScalarRow,
  mockResolvedKeyTypeRow,
  mockResolvedRangeRow,
} from './__mocks__/utilsMocks';

describe('initialRows', () => {
  it('returns one row per criterion marked as default', () => {
    const rows = initialRows(mockPatientContext);
    expect(rows).toHaveLength(1);
    expect(rows[0].criterionKey).toBe('patient.name.given');
    expect(rows[0].value).toBeNull();
    expect(rows[0].validationError).toBeNull();
  });

  it('falls back to first criterion when no default is set', () => {
    const rows = initialRows(mockContextNoDefaults);
    expect(rows).toHaveLength(1);
    expect(rows[0].criterionKey).toBe('episode.identifier');
  });

  it('returns one row per criterion when multiple defaults are set', () => {
    const rows = initialRows(mockContextMultipleDefaults);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.criterionKey)).toEqual([
      'patient.name.given',
      'patient.gender',
    ]);
  });

  it('assigns a unique rowId to each row', () => {
    const rows = initialRows(mockPatientContext);
    expect(rows[0].rowId).toBeTruthy();
  });
});

describe('availableCriteriaForRow', () => {
  it('returns full criteria list when no other rows are active', () => {
    const result = availableCriteriaForRow(
      mockPatientContext.criteria,
      [mockRowTextNoValue],
      mockRowTextNoValue.rowId,
    );
    expect(result).toHaveLength(mockPatientContext.criteria.length);
  });

  it('excludes criteria selected in other rows', () => {
    const result = availableCriteriaForRow(
      mockPatientContext.criteria,
      [mockRowTextNoValue, mockRowGenderNoValue],
      mockRowGenderNoValue.rowId,
    );
    expect(result.map((c) => c.field.key)).not.toContain('patient.name.given');
    expect(result.map((c) => c.field.key)).toContain('patient.gender');
  });

  it("includes the current row's own selection", () => {
    const result = availableCriteriaForRow(
      mockPatientContext.criteria,
      [mockRowTextNoValue, mockRowGenderNoValue],
      mockRowTextNoValue.rowId,
    );
    expect(result.map((c) => c.field.key)).toContain('patient.name.given');
  });

  it('does not count null-criterion rows against available criteria', () => {
    const result = availableCriteriaForRow(
      mockPatientContext.criteria,
      [mockRowNoCriterion, mockRowTextNoValue],
      mockRowTextNoValue.rowId,
    );
    expect(result).toHaveLength(mockPatientContext.criteria.length);
  });
});

describe('validateTextInput', () => {
  it.each([
    {
      label: 'text input with regex, value matches',
      value: { value: 'Rahul' },
      input: {
        kind: 'text' as const,
        placeholderTranslationKey: 'PH',
        regex: '^[A-Za-z]+$',
      },
      expected: null,
    },
    {
      label: 'text input with regex, value fails',
      value: { value: 'Rahul123' },
      input: {
        kind: 'text' as const,
        placeholderTranslationKey: 'PH',
        regex: '^[A-Za-z]+$',
      },
      expected: 'FORMAT_ERR',
    },
    {
      label: 'text input without regex',
      value: { value: 'Rahul' },
      input: { kind: 'text' as const, placeholderTranslationKey: 'PH' },
      expected: null,
    },
    {
      label: 'null value',
      value: null,
      input: {
        kind: 'text' as const,
        placeholderTranslationKey: 'PH',
        regex: '^[A-Za-z]+$',
      },
      expected: null,
    },
  ])('returns $expected when $label', ({ value, input, expected }) => {
    expect(validateTextInput(value, input as TextInput, 'FORMAT_ERR')).toBe(
      expected,
    );
  });
});

describe('getRangeOrderError', () => {
  const numericRangeInput =
    mockPatientContextWithRangeNumeric.criteria[0].input;
  const numericNonRangeInput = mockPatientContext.criteria[2].input;
  const dateRangeInput = {
    kind: 'date' as const,
    placeholderTranslationKey: 'DATE_PLACEHOLDER',
    rangeAllowed: true,
  };

  it.each([
    {
      label: 'non-range input',
      value: {
        from: { value: '50', comparator: null },
        to: { value: '20', comparator: null },
      },
      input: numericNonRangeInput,
      expected: null,
    },
    {
      label: 'null value',
      value: null,
      input: numericRangeInput,
      expected: null,
    },
    {
      label: 'from missing',
      value: {
        from: { value: null, comparator: null },
        to: { value: '20', comparator: null },
      },
      input: numericRangeInput,
      expected: null,
    },
    {
      label: 'to missing',
      value: { from: { value: '20', comparator: null } },
      input: numericRangeInput,
      expected: null,
    },
    {
      label: 'numeric: from < to (valid)',
      value: {
        from: { value: '20', comparator: null },
        to: { value: '50', comparator: null },
      },
      input: numericRangeInput,
      expected: null,
    },
    {
      label: 'numeric: from === to (valid)',
      value: {
        from: { value: '30', comparator: null },
        to: { value: '30', comparator: null },
      },
      input: numericRangeInput,
      expected: null,
    },
    {
      label: 'numeric: from > to (invalid)',
      value: {
        from: { value: '50', comparator: null },
        to: { value: '20', comparator: null },
      },
      input: numericRangeInput,
      expected: 'RANGE_ORDER_ERR',
    },
    {
      label: 'date: from > to (invalid)',
      value: {
        from: { value: '2024-12-31T00:00:00.000Z', comparator: null },
        to: { value: '2024-01-01T00:00:00.000Z', comparator: null },
      },
      input: dateRangeInput,
      expected: 'RANGE_ORDER_ERR',
    },
    {
      label: 'date: from === to (valid)',
      value: {
        from: { value: '2024-06-15T00:00:00.000Z', comparator: null },
        to: { value: '2024-06-15T00:00:00.000Z', comparator: null },
      },
      input: dateRangeInput,
      expected: null,
    },
  ])('returns $expected when $label', ({ value, input, expected }) => {
    expect(getRangeOrderError(value, input, 'RANGE_ORDER_ERR')).toBe(expected);
  });
});

const mockT = (key: string) => key;
const mockTFallback = (key: string, opts?: { defaultValue?: string }) =>
  opts?.defaultValue ?? key;

describe('validateRows', () => {
  it.each([
    {
      label: 'null criterionKey',
      row: mockRowNoCriterion,
      criteria: mockPatientContext.criteria,
      t: mockT,
      expectedError: 'CRITERION_ERR',
      expectedRangeOrderError: null,
    },
    {
      label: 'null value for non-range input',
      row: mockRowTextNoValue,
      criteria: mockPatientContext.criteria,
      t: mockT,
      expectedError: 'VALUE_ERR',
      expectedRangeOrderError: null,
    },
    {
      label: 'valid value for non-range input',
      row: mockRowTextWithValue,
      criteria: mockPatientContext.criteria,
      t: mockT,
      expectedError: null,
      expectedRangeOrderError: null,
    },
    {
      label: 'empty scalar value',
      row: mockRowScalarEmpty,
      criteria: mockPatientContext.criteria,
      t: mockT,
      expectedError: 'VALUE_ERR',
      expectedRangeOrderError: null,
    },
    {
      label: 'non-range numeric with from value filled',
      row: mockRowRangePartial,
      criteria: mockPatientContext.criteria,
      t: mockT,
      expectedError: null,
      expectedRangeOrderError: null,
    },
    {
      label: 'range numeric with neither bound filled',
      row: mockRowRangeNoBounds,
      criteria: mockPatientContextWithRangeNumeric.criteria,
      t: mockT,
      expectedError: 'VALUE_ERR',
      expectedRangeOrderError: null,
    },
    {
      label: 'range input with only from filled',
      row: mockRowRangePartial,
      criteria: mockPatientContextWithRangeNumeric.criteria,
      t: mockT,
      expectedError: 'VALUE_ERR',
      expectedRangeOrderError: null,
    },
    {
      label: 'range input with both bounds filled and valid order',
      row: mockRowRangeFull,
      criteria: mockPatientContextWithRangeNumeric.criteria,
      t: mockT,
      expectedError: null,
      expectedRangeOrderError: null,
    },
    {
      label: 'range input with both bounds filled but from > to',
      row: mockRowRangeInvalidOrder,
      criteria: mockPatientContextWithRangeNumeric.criteria,
      t: mockT,
      expectedError: null,
      expectedRangeOrderError: 'RANGE_ORDER_ERR',
    },
    {
      label: 'options criterion with filled value produces no errors',
      row: mockRowGenderWithValue,
      criteria: mockPatientContext.criteria,
      t: mockT,
      expectedError: null,
      expectedRangeOrderError: null,
    },
    {
      label: 'text with regex, empty value skips regex and returns value error',
      row: mockRowTextNoValue,
      criteria: mockPatientContextWithRegex.criteria,
      t: mockT,
      expectedError: 'VALUE_ERR',
      expectedRangeOrderError: null,
    },
    {
      label: 'text with regex, value passes regex',
      row: mockRowTextPassingRegex,
      criteria: mockPatientContextWithRegex.criteria,
      t: mockT,
      expectedError: null,
      expectedRangeOrderError: null,
    },
    {
      label: 'text with regex, value fails regex — derived key found',
      row: mockRowTextFailingRegex,
      criteria: mockPatientContextWithRegex.criteria,
      t: mockT,
      expectedError: 'PATIENT_GIVEN_NAME_INVALID_FORMAT',
      expectedRangeOrderError: null,
    },
    {
      label:
        'text with regex, value fails regex — derived key missing, falls back',
      row: mockRowTextFailingRegex,
      criteria: mockPatientContextWithRegex.criteria,
      t: mockTFallback,
      expectedError: 'COMMON_SEARCH_INVALID_FORMAT',
      expectedRangeOrderError: null,
    },
  ])(
    '$label: sets validationError=$expectedError rangeOrderError=$expectedRangeOrderError',
    ({ row, criteria, t, expectedError, expectedRangeOrderError }) => {
      const result = validateRows(
        [row],
        criteria,
        'CRITERION_ERR',
        'VALUE_ERR',
        'RANGE_ORDER_ERR',
        t,
      );
      expect(result[0].validationError).toBe(expectedError);
      expect(result[0].rangeOrderError).toBe(expectedRangeOrderError);
    },
  );

  it('validates each row independently', () => {
    const result = validateRows(
      [mockRowNoCriterion, mockRowTextWithValue],
      mockPatientContext.criteria,
      'CRITERION_ERR',
      'VALUE_ERR',
      'RANGE_ORDER_ERR',
      mockT,
    );
    expect(result[0].validationError).toBe('CRITERION_ERR');
    expect(result[1].validationError).toBeNull();
  });
});

describe('updateRow', () => {
  it('updates the matching row by merging the updater result and leaves other rows unchanged', () => {
    const rows = [mockRowTextNoValue, mockRowTextWithValue];
    const result = updateRow(rows, 'row-text-no-value', () => ({
      criterionKey: 'patient.gender',
    }));
    expect(result[0]).toEqual({
      ...mockRowTextNoValue,
      criterionKey: 'patient.gender',
    });
    expect(result[1]).toBe(mockRowTextWithValue);
  });

  it('passes the current row to the updater', () => {
    const rows = [mockRowTextWithValue];
    const result = updateRow(rows, 'row-text-with-value', (r) => ({
      validationError: r.criterionKey ? 'has-criterion' : null,
    }));
    expect(result[0].validationError).toBe('has-criterion');
  });
});

describe('resolveRows', () => {
  const criteria = [
    ...mockPatientContext.criteria,
    {
      field: { key: 'patient.identifiers', keyType: 'PASSPORT' },
      translationKey: 'PATIENT_PASSPORT',
      input: { kind: 'text' as const, placeholderTranslationKey: 'PH' },
    },
  ];

  it.each([
    {
      label: 'rows with null criterionKey are excluded',
      rows: [mockRowNoCriterion, mockRowTextWithValue],
      expectedLength: 1,
    },
    {
      label: 'rows with null value are excluded',
      rows: [mockRowTextNoValue, mockRowTextWithValue],
      expectedLength: 1,
    },
    {
      label: 'valid rows are all included',
      rows: [mockRowTextWithValue, mockRowWithKeyTypeValue],
      expectedLength: 2,
    },
  ])('$label', ({ rows, expectedLength }) => {
    expect(resolveRows(rows, criteria)).toHaveLength(expectedLength);
  });

  it('maps field from matching criterion config', () => {
    const result = resolveRows([mockRowWithKeyTypeValue], criteria);
    expect(result[0].field).toEqual({
      key: 'patient.identifiers',
      keyType: 'PASSPORT',
    });
  });

  it('preserves the row value', () => {
    const result = resolveRows([mockRowTextWithValue], criteria);
    expect(result[0].value).toEqual(mockRowTextWithValue.value);
  });
});

describe('buildPayload', () => {
  it.each([
    {
      label: 'scalar field → single leaf with eq comparator',
      resolvedRows: [mockResolvedScalarRow],
      entity: 'patient',
      expected: {
        entity: 'patient',
        criteria: {
          operator: 'AND',
          conditions: [
            { field: 'patient.givenName', comparator: 'eq', value: 'John' },
          ],
        },
      },
    },
    {
      label: 'keyType field → AND group with .kind and .value leaves',
      resolvedRows: [mockResolvedKeyTypeRow],
      entity: 'patient',
      expected: {
        entity: 'patient',
        criteria: {
          operator: 'AND',
          conditions: [
            {
              operator: 'AND',
              conditions: [
                {
                  field: 'patient.identifiers.kind',
                  comparator: 'eq',
                  value: 'PASSPORT',
                },
                {
                  field: 'patient.identifiers.value',
                  comparator: 'eq',
                  value: 'P123',
                },
              ],
            },
          ],
        },
      },
    },
    {
      label: 'range field → AND group with gt from and lt to',
      resolvedRows: [mockResolvedRangeRow],
      entity: 'patient',
      expected: {
        entity: 'patient',
        criteria: {
          operator: 'AND',
          conditions: [
            {
              operator: 'AND',
              conditions: [
                { field: 'patient.age', comparator: 'gt', value: '20' },
                { field: 'patient.age', comparator: 'lt', value: '50' },
              ],
            },
          ],
        },
      },
    },
  ])('$label', ({ resolvedRows, entity, expected }) => {
    expect(buildPayload(resolvedRows, entity)).toEqual(expected);
  });

  it('multiple rows → multiple top-level conditions', () => {
    const result = buildPayload(
      [mockResolvedScalarRow, mockResolvedKeyTypeRow, mockResolvedRangeRow],
      'patient',
    );
    expect(result.criteria.conditions).toHaveLength(3);
  });

  it('entity maps to different context values', () => {
    expect(buildPayload([mockResolvedScalarRow], 'appointment').entity).toBe(
      'appointment',
    );
    expect(buildPayload([mockResolvedScalarRow], 'episodeOfCare').entity).toBe(
      'episodeOfCare',
    );
  });
});

describe('criteriaAvailableToAdd', () => {
  it('returns full list when no rows are active', () => {
    const result = criteriaAvailableToAdd(mockPatientContext.criteria, []);
    expect(result).toHaveLength(mockPatientContext.criteria.length);
  });

  it('excludes criteria already selected in any row', () => {
    const result = criteriaAvailableToAdd(mockPatientContext.criteria, [
      mockRowTextNoValue,
    ]);
    expect(result.map((c) => c.field.key)).not.toContain('patient.name.given');
  });

  it('returns empty array when all criteria are active', () => {
    const rows = mockPatientContext.criteria.map((c, i) => ({
      rowId: `row-${i}`,
      criterionKey: c.field.key,
      value: null,
      validationError: null,
    }));
    const result = criteriaAvailableToAdd(mockPatientContext.criteria, rows);
    expect(result).toHaveLength(0);
  });
});

describe('resultTransforms', () => {
  const identityT: Translator = (key, options) => options?.defaultValue ?? key;

  it('registers all supported transform keys', () => {
    expect(Object.keys(resultTransforms).sort()).toEqual(
      [
        'formatAge',
        'formatCountry',
        'formatDate',
        'formatDateTime',
        'formatGender',
        'formatTime',
      ].sort(),
    );
  });

  it('wires formatGender into the map', () => {
    expect(resultTransforms.formatGender).toBe(formatGender);
  });

  it('wires formatCountry into the map', () => {
    expect(resultTransforms.formatCountry).toBe(formatCountry);
  });

  it('formatDate transform formats a date-only value', () => {
    expect(resultTransforms.formatDate('2024-03-28', identityT)).toContain(
      '2024',
    );
  });

  it('formatTime transform formats a time-only value', () => {
    expect(resultTransforms.formatTime('2024-03-28T14:30:00', identityT)).toBe(
      '2:30 PM',
    );
  });

  it('formatDateTime transform formats date and time together', () => {
    const result = resultTransforms.formatDateTime(
      '2024-03-28T14:30:00',
      identityT,
    );
    expect(result).toContain('2024');
    expect(result).toContain('2:30 PM');
  });

  it('formatAge transform derives a human-readable age from a birthdate', () => {
    expect(resultTransforms.formatAge('1990-01-01', identityT)).toMatch(
      /YEARS/,
    );
  });
});
