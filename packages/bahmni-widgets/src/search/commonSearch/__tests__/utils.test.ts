import {
  initialRows,
  availableCriteriaForRow,
  criteriaAvailableToAdd,
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

describe('validateRows', () => {
  it.each([
    {
      label: 'null criterionKey',
      row: mockRowNoCriterion,
      criteria: mockPatientContext.criteria,
      expectedError: 'CRITERION_ERR',
    },
    {
      label: 'null value for non-range input',
      row: mockRowTextNoValue,
      criteria: mockPatientContext.criteria,
      expectedError: 'VALUE_ERR',
    },
    {
      label: 'valid value for non-range input',
      row: mockRowTextWithValue,
      criteria: mockPatientContext.criteria,
      expectedError: null,
    },
    {
      label: 'empty scalar value',
      row: mockRowScalarEmpty,
      criteria: mockPatientContext.criteria,
      expectedError: 'VALUE_ERR',
    },
    {
      label: 'non-range numeric with from value filled',
      row: mockRowRangePartial,
      criteria: mockPatientContext.criteria,
      expectedError: null,
    },
    {
      label: 'range numeric with neither bound filled',
      row: mockRowRangeNoBounds,
      criteria: mockPatientContextWithRangeNumeric.criteria,
      expectedError: 'VALUE_ERR',
    },
    {
      label: 'range input with only from filled',
      row: mockRowRangePartial,
      criteria: mockPatientContextWithRangeNumeric.criteria,
      expectedError: 'VALUE_ERR',
    },
    {
      label: 'range input with both bounds filled',
      row: mockRowRangeFull,
      criteria: mockPatientContextWithRangeNumeric.criteria,
      expectedError: null,
    },
  ])(
    '$label: sets validationError to $expectedError',
    ({ row, criteria, expectedError }) => {
      const result = validateRows(
        [row],
        criteria,
        'CRITERION_ERR',
        'VALUE_ERR',
      );
      expect(result[0].validationError).toBe(expectedError);
    },
  );

  it('validates each row independently', () => {
    const result = validateRows(
      [mockRowNoCriterion, mockRowTextWithValue],
      mockPatientContext.criteria,
      'CRITERION_ERR',
      'VALUE_ERR',
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
