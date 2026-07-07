import {
  initialRows,
  availableCriteriaForRow,
  criteriaAvailableToAdd,
  getRangeOrderError,
  updateRow,
  validateRows,
} from '../utils';
import {
  mockContextMultipleDefaults,
  mockPatientContext,
  mockPatientContextWithRangeNumeric,
  mockContextNoDefaults,
} from './__mocks__/searchFormMocks';
import {
  mockRowGenderNoValue,
  mockRowNoCriterion,
  mockRowRangeNoBounds,
  mockRowRangePartial,
  mockRowRangeFull,
  mockRowRangeInvalidOrder,
  mockRowScalarEmpty,
  mockRowTextNoValue,
  mockRowTextWithValue,
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

describe('validateRows', () => {
  it.each([
    {
      label: 'null criterionKey',
      row: mockRowNoCriterion,
      criteria: mockPatientContext.criteria,
      expectedError: 'CRITERION_ERR',
      expectedRangeOrderError: null,
    },
    {
      label: 'null value for non-range input',
      row: mockRowTextNoValue,
      criteria: mockPatientContext.criteria,
      expectedError: 'VALUE_ERR',
      expectedRangeOrderError: null,
    },
    {
      label: 'valid value for non-range input',
      row: mockRowTextWithValue,
      criteria: mockPatientContext.criteria,
      expectedError: null,
      expectedRangeOrderError: null,
    },
    {
      label: 'empty scalar value',
      row: mockRowScalarEmpty,
      criteria: mockPatientContext.criteria,
      expectedError: 'VALUE_ERR',
      expectedRangeOrderError: null,
    },
    {
      label: 'non-range numeric with from value filled',
      row: mockRowRangePartial,
      criteria: mockPatientContext.criteria,
      expectedError: null,
      expectedRangeOrderError: null,
    },
    {
      label: 'range numeric with neither bound filled',
      row: mockRowRangeNoBounds,
      criteria: mockPatientContextWithRangeNumeric.criteria,
      expectedError: 'VALUE_ERR',
      expectedRangeOrderError: null,
    },
    {
      label: 'range input with only from filled',
      row: mockRowRangePartial,
      criteria: mockPatientContextWithRangeNumeric.criteria,
      expectedError: 'VALUE_ERR',
      expectedRangeOrderError: null,
    },
    {
      label: 'range input with both bounds filled and valid order',
      row: mockRowRangeFull,
      criteria: mockPatientContextWithRangeNumeric.criteria,
      expectedError: null,
      expectedRangeOrderError: null,
    },
    {
      label: 'range input with both bounds filled but from > to',
      row: mockRowRangeInvalidOrder,
      criteria: mockPatientContextWithRangeNumeric.criteria,
      expectedError: null,
      expectedRangeOrderError: 'RANGE_ORDER_ERR',
    },
  ])(
    '$label: sets validationError=$expectedError rangeOrderError=$expectedRangeOrderError',
    ({ row, criteria, expectedError, expectedRangeOrderError }) => {
      const result = validateRows(
        [row],
        criteria,
        'CRITERION_ERR',
        'VALUE_ERR',
        'RANGE_ORDER_ERR',
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
