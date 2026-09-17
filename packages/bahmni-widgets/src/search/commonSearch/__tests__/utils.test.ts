import {
  formatCountry,
  formatGender,
  resolveComboBoxItems,
} from '@bahmni/services';
import {
  CriterionConfig,
  CriterionRow,
  LookupOption,
  TextInput,
} from '../models';
import {
  formatSearchResult,
  getLookupComboBoxItems,
  initialRows,
  availableCriteriaForRow,
  criteriaAvailableToAdd,
  processContextConfigs,
  validateTextInput,
  getRangeOrderError,
  updateRow,
  validateRows,
  reconcileAdditionalCriteriaErrors,
  resolveRows,
  buildPayload,
  buildPaginationMeta,
  extractSearchPage,
  resultTransforms,
  validateConfigForActions,
  validateConfigForCriteria,
  toSearchAuditEventType,
  needsDisplayKey,
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
  mockRowImeIdentifier,
  multiKeyTypeCriteria,
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
  mockRowUmiIdentifier,
  mockRowWithKeyTypeValue,
  mockResolvedScalarRow,
  mockResolvedKeyTypeRow,
  mockResolvedRangeRow,
  mockContextWithValidActions,
  mockContextWithUnknownActionKey,
  mockContextWithMissingActionsArray,
  mockActionsWithDuplicateKeys,
  mockRowDateScalar,
  mockRowDateRange,
  mockRowDateRangeFromOnly,
  mockUserPrivileges,
  makeMockContextWithCriteria,
  mockSimpleFieldCriterion,
  mockKeyTypeFieldCriterion,
} from './__mocks__/utilsMocks';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
jest.mock('date-fns', () => ({
  format: (_date: Date) => {
    const shifted = new Date(_date.getTime() + IST_OFFSET_MS);
    return shifted.toISOString().slice(0, -1) + '+0530';
  },
  endOfDay: (_date: Date) => {
    const ist = new Date(_date.getTime() + IST_OFFSET_MS);
    ist.setUTCHours(23, 59, 59, 999);
    return new Date(ist.getTime() - IST_OFFSET_MS);
  },
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  resolveComboBoxItems: jest.fn(),
}));

const mockResolveComboBoxItems = jest.mocked(resolveComboBoxItems);

describe('processContextConfigs', () => {
  it.each([
    {
      label: 'field without keyType gets id equal to key',
      criterion: mockSimpleFieldCriterion,
      expectedId: 'patient.name.given',
    },
    {
      label: 'field with keyType gets composite key:keyType id',
      criterion: mockKeyTypeFieldCriterion,
      expectedId: 'patient.identifiers:PASSPORT',
    },
  ])('$label', ({ criterion, expectedId }) => {
    const [result] = processContextConfigs(
      [makeMockContextWithCriteria([criterion])],
      mockUserPrivileges,
    );
    expect(result.criteria[0].id).toBe(expectedId);
  });

  it('two criteria sharing field.key but different keyType get distinct ids', () => {
    const [result] = processContextConfigs(
      [makeMockContextWithCriteria(multiKeyTypeCriteria)],
      mockUserPrivileges,
    );
    expect(result.criteria[0].id).not.toBe(result.criteria[1].id);
  });
});

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
    expect(rows[0].criterionKey).toBe('patientProgram.identifier');
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

  it('treats criteria with same field.key but different keyType as distinct', () => {
    const result = availableCriteriaForRow(
      multiKeyTypeCriteria,
      [mockRowUmiIdentifier],
      mockRowImeIdentifier.rowId,
    );
    expect(result).toHaveLength(1);
    expect(result[0].field.keyType).toBe('IME-UUID');
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

  describe('additionalCriteria', () => {
    const sexCriterion: CriterionConfig = {
      id: 'sex',
      field: { key: 'gender' },
      translationKey: 'PATIENT_SEX',
      additionalCriteria: ['givenName'],
      input: {
        kind: 'options',
        placeholderTranslationKey: 'PATIENT_SEX_PLACEHOLDER',
        options: [{ translationKey: 'MALE', value: 'M' }],
      },
    };
    const givenNameCriterion: CriterionConfig = {
      id: 'givenName',
      field: { key: 'names.givenName' },
      translationKey: 'PATIENT_GIVEN_NAME',
      input: {
        kind: 'text',
        placeholderTranslationKey: 'PATIENT_GIVEN_NAME_PLACEHOLDER',
      },
    };
    const otherCriterion: CriterionConfig = {
      id: 'other',
      field: { key: 'other' },
      translationKey: 'PATIENT_OTHER',
      input: {
        kind: 'text',
        placeholderTranslationKey: 'PATIENT_OTHER_PLACEHOLDER',
      },
    };
    const sexRow: CriterionRow = {
      rowId: 'row-sex',
      criterionKey: 'sex',
      value: { value: 'M' },
      validationError: null,
      rangeOrderError: null,
    };
    const givenNameRow: CriterionRow = {
      rowId: 'row-given-name',
      criterionKey: 'givenName',
      value: { value: 'Rahul' },
      validationError: null,
      rangeOrderError: null,
    };
    const otherRow: CriterionRow = {
      rowId: 'row-other',
      criterionKey: 'other',
      value: { value: 'x' },
      validationError: null,
      rangeOrderError: null,
    };
    const criteria = [sexCriterion, givenNameCriterion, otherCriterion];
    const translateWithCriteriaList = (
      key: string,
      options?: { criteriaList?: string },
    ) =>
      key === 'COMMON_SEARCH_ADDITIONAL_CRITERIA_REQUIRED'
        ? `Add another search criteria from one of the following: ${options?.criteriaList}`
        : key;

    it('blocks when the only active criterion is Sex, listing the configured criteria', () => {
      const result = validateRows(
        [sexRow],
        criteria,
        'CRITERION_ERR',
        'VALUE_ERR',
        'RANGE_ORDER_ERR',
        translateWithCriteriaList,
      );
      expect(result[0].validationError).toBe(
        'Add another search criteria from one of the following: PATIENT_GIVEN_NAME',
      );
    });

    it('allows the search when paired with an allow-listed criterion', () => {
      const result = validateRows(
        [sexRow, givenNameRow],
        criteria,
        'CRITERION_ERR',
        'VALUE_ERR',
        'RANGE_ORDER_ERR',
        translateWithCriteriaList,
      );
      expect(result[0].validationError).toBeNull();
    });

    it('still blocks when paired only with a criterion not on the allow-list', () => {
      const result = validateRows(
        [sexRow, otherRow],
        criteria,
        'CRITERION_ERR',
        'VALUE_ERR',
        'RANGE_ORDER_ERR',
        translateWithCriteriaList,
      );
      expect(result[0].validationError).toBe(
        'Add another search criteria from one of the following: PATIENT_GIVEN_NAME',
      );
    });
  });
});

describe('reconcileAdditionalCriteriaErrors', () => {
  const sexCriterion: CriterionConfig = {
    id: 'sex',
    field: { key: 'gender' },
    translationKey: 'PATIENT_SEX',
    additionalCriteria: ['givenName'],
    input: {
      kind: 'options',
      placeholderTranslationKey: 'PATIENT_SEX_PLACEHOLDER',
      options: [{ translationKey: 'MALE', value: 'M' }],
    },
  };
  const givenNameCriterion: CriterionConfig = {
    id: 'givenName',
    field: { key: 'names.givenName' },
    translationKey: 'PATIENT_GIVEN_NAME',
    input: {
      kind: 'text',
      placeholderTranslationKey: 'PATIENT_GIVEN_NAME_PLACEHOLDER',
    },
  };
  const stickySexRow: CriterionRow = {
    rowId: 'row-sex',
    criterionKey: 'sex',
    value: { value: 'M' },
    validationError:
      'Add another search criteria from one of the following: PATIENT_GIVEN_NAME',
    rangeOrderError: null,
  };
  const givenNameRow: CriterionRow = {
    rowId: 'row-given-name',
    criterionKey: 'givenName',
    value: { value: 'Rahul' },
    validationError: null,
    rangeOrderError: null,
  };

  it('clears the sticky error once a qualifying partner criterion becomes active', () => {
    const result = reconcileAdditionalCriteriaErrors(
      [stickySexRow, givenNameRow],
      [sexCriterion, givenNameCriterion],
    );
    expect(result[0].validationError).toBeNull();
  });
});

describe('validateConfigForCriteria', () => {
  const baseContext = {
    context: 'patient' as const,
    translationKey: 'CTX',
    requiredPrivileges: ['View Patients'],
    url: '/url',
    pageSize: 20,
    batchSize: 100,
    resultFields: [{ translationKey: 'RF', expression: 'x' }],
  };

  it('returns null when all criterion ids are unique and references are valid', () => {
    const result = validateConfigForCriteria([
      {
        ...baseContext,
        criteria: [
          {
            id: 'sex',
            field: { key: 'gender' },
            translationKey: 'SEX',
            additionalCriteria: ['givenName'],
            input: { kind: 'text', placeholderTranslationKey: 'PH' },
          },
          {
            id: 'givenName',
            field: { key: 'names.givenName' },
            translationKey: 'GIVEN_NAME',
            input: { kind: 'text', placeholderTranslationKey: 'PH' },
          },
        ],
      },
    ]);
    expect(result).toBeNull();
  });

  it('flags duplicate criterion ids within a context', () => {
    const result = validateConfigForCriteria([
      {
        ...baseContext,
        criteria: [
          {
            id: 'sex',
            field: { key: 'gender' },
            translationKey: 'SEX',
            input: { kind: 'text', placeholderTranslationKey: 'PH' },
          },
          {
            id: 'sex',
            field: { key: 'other' },
            translationKey: 'OTHER',
            input: { kind: 'text', placeholderTranslationKey: 'PH' },
          },
        ],
      },
    ]);
    expect(result).toBe(
      'COMMON_SEARCH_CONFIG_VALIDATION_DUPLICATE_CRITERION_ID',
    );
  });

  it('flags an additionalCriteria entry that references an unknown id', () => {
    const result = validateConfigForCriteria([
      {
        ...baseContext,
        criteria: [
          {
            id: 'sex',
            field: { key: 'gender' },
            translationKey: 'SEX',
            additionalCriteria: ['doesNotExist'],
            input: { kind: 'text', placeholderTranslationKey: 'PH' },
          },
        ],
      },
    ]);
    expect(result).toBe(
      'COMMON_SEARCH_CONFIG_VALIDATION_UNKNOWN_ADDITIONAL_CRITERION',
    );
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
      id: 'patient.identifiers:PASSPORT',
      field: { key: 'patient.identifiers', keyType: 'PASSPORT' },
      translationKey: 'PATIENT_PASSPORT',
      input: { kind: 'text' as const, placeholderTranslationKey: 'PH' },
    },
    {
      id: 'patient.birthdate',
      field: { key: 'patient.birthdate' },
      translationKey: 'PATIENT_BIRTHDATE',
      input: { kind: 'date' as const, placeholderTranslationKey: 'DATE_PH' },
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

  it('resolves distinct fields when two rows share field.key but have different keyType', () => {
    const result = resolveRows(
      [mockRowUmiIdentifier, mockRowImeIdentifier],
      multiKeyTypeCriteria,
    );
    expect(result).toHaveLength(2);
    expect(result[0].field.keyType).toBe('UMI-UUID');
    expect(result[1].field.keyType).toBe('IME-UUID');
  });

  it('preserves the row value', () => {
    const result = resolveRows([mockRowTextWithValue], criteria);
    expect(result[0].value).toEqual(mockRowTextWithValue.value);
  });

  it.each([
    {
      label: 'scalar date value',
      row: mockRowDateScalar,
      expected: { value: '2026-07-23T16:00:00.000+0530' },
    },
    {
      label: 'range date with from and to',
      row: mockRowDateRange,
      expected: {
        from: { value: '2026-01-15T05:30:00.000+0530', comparator: null },
        to: { value: '2026-07-23T23:59:59.999+0530', comparator: null },
      },
    },
    {
      label: 'range date with from only',
      row: mockRowDateRangeFromOnly,
      expected: {
        from: { value: '2026-01-15T05:30:00.000+0530', comparator: null },
      },
    },
  ])('converts $label to local timezone ISO format', ({ row, expected }) => {
    const result = resolveRows([row], criteria);
    expect(result[0].value).toEqual(expected);
  });
});

const mockLocationUuid = 'test-location-uuid';
const locationCondition = {
  field: 'location.uuid',
  comparator: 'eq',
  value: mockLocationUuid,
};

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
            locationCondition,
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
            locationCondition,
          ],
        },
      },
    },
    {
      label: 'range field → AND group with ge from and le to',
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
                { field: 'patient.age', comparator: 'ge', value: '20' },
                { field: 'patient.age', comparator: 'le', value: '50' },
              ],
            },
            locationCondition,
          ],
        },
      },
    },
  ])('$label', ({ resolvedRows, entity, expected }) => {
    expect(buildPayload(resolvedRows, entity, mockLocationUuid)).toEqual(
      expected,
    );
  });

  it('multiple rows → conditions include all rows plus location', () => {
    const result = buildPayload(
      [mockResolvedScalarRow, mockResolvedKeyTypeRow, mockResolvedRangeRow],
      'patient',
      mockLocationUuid,
    );
    expect(result.criteria.conditions).toHaveLength(4);
  });

  it('location condition always appears as last condition', () => {
    const result = buildPayload(
      [mockResolvedScalarRow],
      'patient',
      mockLocationUuid,
    );
    const last = result.criteria.conditions.at(-1);
    expect(last).toEqual(locationCondition);
  });

  it('entity maps to different context values', () => {
    expect(
      buildPayload([mockResolvedScalarRow], 'appointment', mockLocationUuid)
        .entity,
    ).toBe('appointment');
    expect(
      buildPayload([mockResolvedScalarRow], 'patientProgram', mockLocationUuid)
        .entity,
    ).toBe('patientProgram');
  });

  it('omits the location condition when locationUuid is not provided', () => {
    const result = buildPayload([mockResolvedScalarRow], 'patient');
    expect(result.criteria.conditions).toEqual([
      { field: 'patient.givenName', comparator: 'eq', value: 'John' },
    ]);
  });

  it('should include the pagination meta when it is supplied', () => {
    const meta = buildPaginationMeta(100, null);
    const result = buildPayload(
      [mockResolvedScalarRow],
      'patient',
      undefined,
      meta,
    );
    expect(result.meta).toEqual(meta);
  });

  it('should omit the meta key when no pagination meta is supplied', () => {
    const result = buildPayload([mockResolvedScalarRow], 'patient');
    expect(result).not.toHaveProperty('meta');
  });
});

describe('buildPaginationMeta', () => {
  it('should request the total count and use a null cursor for the first search request', () => {
    expect(buildPaginationMeta(100, null)).toEqual({
      includeTotalCount: true,
      pagination: { limit: 100, sortOrder: 'desc', cursor: null },
    });
  });

  it('should omit the direction from the first search request', () => {
    expect(buildPaginationMeta(100, null).pagination).not.toHaveProperty(
      'direction',
    );
  });

  it('should skip the total count and include the cursor and direction when navigating between sets', () => {
    expect(buildPaginationMeta(100, 'eyJpZCI6MjJ9', 'next')).toEqual({
      includeTotalCount: false,
      pagination: {
        limit: 100,
        sortOrder: 'desc',
        cursor: 'eyJpZCI6MjJ9',
        direction: 'next',
      },
    });
  });
});

describe('extractSearchPage', () => {
  it('should extract results, total count, and pagination cursors from the response', () => {
    const data = {
      context: 'patientProgram',
      meta: {
        timestamp: 1787203366489,
        totalCount: 300,
        pagination: { nextCursor: 'next-cursor', prevCursor: 'prev-cursor' },
      },
      results: [{ uuid: 'a' }, { uuid: 'b' }],
      error: null,
    };

    expect(extractSearchPage(data)).toEqual({
      results: [{ uuid: 'a' }, { uuid: 'b' }],
      totalCount: 300,
      nextCursor: 'next-cursor',
      prevCursor: 'prev-cursor',
    });
  });

  it('should return a null next cursor when the response represents the last set', () => {
    const data = {
      meta: {
        totalCount: 1,
        pagination: { nextCursor: null, prevCursor: 'prev-cursor' },
      },
      results: [{ uuid: 'a' }],
    };

    expect(extractSearchPage(data).nextCursor).toBeNull();
  });

  it('should return a null total count when the response omits pagination meta', () => {
    expect(extractSearchPage({ results: [] })).toEqual({
      results: [],
      totalCount: null,
      nextCursor: null,
      prevCursor: null,
    });
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
      criterionKey: c.id!,
      value: null,
      validationError: null,
      rangeOrderError: null,
    }));
    const result = criteriaAvailableToAdd(mockPatientContext.criteria, rows);
    expect(result).toHaveLength(0);
  });

  it('treats criteria with same field.key but different keyType as distinct', () => {
    const result = criteriaAvailableToAdd(multiKeyTypeCriteria, [
      mockRowUmiIdentifier,
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].field.keyType).toBe('IME-UUID');
  });
});

describe('toSearchAuditEventType', () => {
  it.each([
    { context: 'patient' as const, expected: 'SEARCHED_PATIENT' },
    { context: 'appointment' as const, expected: 'SEARCHED_APPOINTMENT' },
    {
      context: 'patientProgram' as const,
      expected: 'SEARCHED_PATIENT_PROGRAM',
    },
  ])('returns $expected for context $context', ({ context, expected }) => {
    expect(toSearchAuditEventType(context)).toBe(expected);
  });
});

describe('resultTransforms', () => {
  const identityT = (key: string) => key;

  it('registers all supported transform keys', () => {
    expect(Object.keys(resultTransforms).sort()).toEqual(
      [
        'formatAge',
        'formatCountry',
        'formatDate',
        'formatDateTime',
        'formatGender',
        'formatSearchResult',
        'formatTime',
      ].sort(),
    );
  });

  it.each([
    { key: 'formatGender', fn: formatGender },
    { key: 'formatCountry', fn: formatCountry },
  ])('wires $key into the map', ({ key, fn }) => {
    expect(resultTransforms[key]).toBe(fn);
  });

  it.each([
    { key: 'formatDate', value: '2024-03-28', contains: '2024' },
    { key: 'formatTime', value: '2024-03-28T14:30:00', contains: '2:30 PM' },
    { key: 'formatDateTime', value: '2024-03-28T14:30:00', contains: '2024' },
    { key: 'formatAge', value: '1990-01-01', contains: 'YEARS' },
  ])(
    '$key transform produces the expected output',
    ({ key, value, contains }) => {
      expect(resultTransforms[key](value, identityT)).toContain(contains);
    },
  );
});

describe('needsDisplayKey', () => {
  it.each(['formatDate', 'formatTime', 'formatDateTime', 'formatAge'])(
    'returns true for %s',
    (transform) => {
      expect(needsDisplayKey(transform)).toBe(true);
    },
  );

  it.each([
    undefined,
    'formatGender',
    'formatCountry',
    'formatSearchResult',
    'nonExistentTransform',
  ])('returns false for %s', (transform) => {
    expect(needsDisplayKey(transform)).toBe(false);
  });
});

describe('formatSearchResult', () => {
  const translations: Record<string, string> = {
    COMMON_SEARCH_RESULT_SCHEDULED: 'Scheduled',
    COMMON_SEARCH_RESULT_IN_PROGRESS: 'In Progress',
  };
  const t = (key: string) => translations[key] ?? key;

  it.each([
    {
      label: 'translates a simple value using its i18n key',
      value: 'Scheduled',
      expected: 'Scheduled',
    },
    {
      label: 'translates a camelCase value to its i18n key',
      value: 'inProgress',
      expected: 'In Progress',
    },
    {
      label: 'returns the i18n key when no translation is available',
      value: 'unknown',
      expected: 'COMMON_SEARCH_RESULT_UNKNOWN',
    },
    { label: 'returns null for empty string', value: '', expected: null },
    {
      label: 'returns null for whitespace-only string',
      value: '   ',
      expected: null,
    },
  ])('$label', ({ value, expected }) => {
    expect(formatSearchResult(value, t)).toBe(expected);
  });

  it('builds the translation key from the value', () => {
    const spy = jest.fn().mockReturnValue('Scheduled');
    formatSearchResult('Scheduled', spy);
    expect(spy).toHaveBeenCalledWith('COMMON_SEARCH_RESULT_SCHEDULED');
  });
});

describe('validateConfigForActions', () => {
  it('returns null when no actions are referenced', () => {
    const contexts = [
      {
        ...mockContextWithValidActions,
        resultFields: [{ translationKey: 'NAME', expression: 'name' }],
        actions: undefined,
      },
    ];
    expect(validateConfigForActions(contexts)).toBeNull();
  });

  it('returns null when actions are valid and properly referenced', () => {
    expect(validateConfigForActions([mockContextWithValidActions])).toBeNull();
  });

  it('returns error key when resultFields reference actions but no actions array is defined', () => {
    const result = validateConfigForActions([
      mockContextWithMissingActionsArray,
    ]);
    expect(result).toBe('COMMON_SEARCH_CONFIG_VALIDATION_UNKNOWN_ACTION');
  });

  it('returns error key when action key is duplicated', () => {
    const contexts = [
      {
        ...mockContextWithValidActions,
        actions: mockActionsWithDuplicateKeys,
      },
    ];
    const result = validateConfigForActions(contexts);
    expect(result).toBe('COMMON_SEARCH_CONFIG_VALIDATION_DUPLICATE_ACTION');
  });

  it('returns error key when resultField references unknown action key', () => {
    const result = validateConfigForActions([mockContextWithUnknownActionKey]);
    expect(result).toBe('COMMON_SEARCH_CONFIG_VALIDATION_UNKNOWN_ACTION');
  });
});

describe('getLookupComboBoxItems', () => {
  const messages = { loading: 'Loading', error: 'Error', empty: 'Empty' };
  const options: LookupOption[] = [
    { uuid: 'service-uuid-1', label: 'TB Program' },
    { uuid: 'service-uuid-2', label: 'HIV Program' },
  ];

  beforeEach(() => {
    mockResolveComboBoxItems.mockReturnValue([]);
  });

  it.each([
    { label: 'null', inputValue: null },
    { label: 'empty string', inputValue: '' },
  ])(
    'returns an empty array without calling resolveComboBoxItems when inputValue is $label',
    ({ inputValue }) => {
      const result = getLookupComboBoxItems(
        inputValue,
        options,
        false,
        false,
        messages,
      );

      expect(result).toEqual([]);
      expect(mockResolveComboBoxItems).not.toHaveBeenCalled();
    },
  );

  it('passes only the substring-matching options to resolveComboBoxItems once the user types', () => {
    getLookupComboBoxItems('tb', options, false, false, messages);

    expect(mockResolveComboBoxItems).toHaveBeenCalledWith(
      false,
      false,
      [options[0]],
      expect.any(Function),
      messages,
    );
  });
});
