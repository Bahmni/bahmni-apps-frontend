import { type UserPrivilege } from '@bahmni/services';
import {
  ActionConfig,
  CriterionConfig,
  CriterionRow,
  RangeValue,
  ResolvedRow,
  ScalarValue,
  SearchContextConfig,
} from '../../models';

export const mockRowNoCriterion: CriterionRow = {
  rowId: 'row-no-criterion',
  criterionKey: null,
  value: null,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowTextNoValue: CriterionRow = {
  rowId: 'row-text-no-value',
  criterionKey: 'patient.name.given',
  value: null,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowTextWithValue: CriterionRow = {
  rowId: 'row-text-with-value',
  criterionKey: 'patient.name.given',
  value: { value: 'Rahul' } satisfies ScalarValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowScalarEmpty: CriterionRow = {
  rowId: 'row-scalar-empty',
  criterionKey: 'patient.name.given',
  value: { value: '' } satisfies ScalarValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowGenderNoValue: CriterionRow = {
  rowId: 'row-gender-no-value',
  criterionKey: 'patient.gender',
  value: null,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowGenderWithValue: CriterionRow = {
  rowId: 'row-gender-with-value',
  criterionKey: 'patient.gender',
  value: { value: 'M' } satisfies ScalarValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowRangeNoBounds: CriterionRow = {
  rowId: 'row-range-no-bounds',
  criterionKey: 'patient.age',
  value: { from: { value: null, comparator: null } } satisfies RangeValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowRangePartial: CriterionRow = {
  rowId: 'row-range-partial',
  criterionKey: 'patient.age',
  value: { from: { value: '20', comparator: null } } satisfies RangeValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowRangeFull: CriterionRow = {
  rowId: 'row-range-full',
  criterionKey: 'patient.age',
  value: {
    from: { value: '20', comparator: null },
    to: { value: '30', comparator: null },
  } satisfies RangeValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowRangeInvalidOrder: CriterionRow = {
  rowId: 'row-range-invalid-order',
  criterionKey: 'patient.age',
  value: {
    from: { value: '50', comparator: null },
    to: { value: '20', comparator: null },
  } satisfies RangeValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowTextFailingRegex: CriterionRow = {
  rowId: 'row-text-failing-regex',
  criterionKey: 'patient.name.given',
  value: { value: 'Rahul123' } satisfies ScalarValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowTextPassingRegex: CriterionRow = {
  rowId: 'row-text-passing-regex',
  criterionKey: 'patient.name.given',
  value: { value: 'Rahul' } satisfies ScalarValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowWithKeyTypeValue: CriterionRow = {
  rowId: 'row-key-type',
  criterionKey: 'patient.identifiers:PASSPORT',
  value: { value: 'P123' } satisfies ScalarValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowUmiIdentifier: CriterionRow = {
  rowId: 'row-umi',
  criterionKey: 'patient.identifiers:UMI-UUID',
  value: { value: 'UMI-001' } satisfies ScalarValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowImeIdentifier: CriterionRow = {
  rowId: 'row-ime',
  criterionKey: 'patient.identifiers:IME-UUID',
  value: { value: 'IME-001' } satisfies ScalarValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockResolvedScalarRow: ResolvedRow = {
  field: { key: 'patient.givenName' },
  value: { value: 'John' } satisfies ScalarValue,
};

export const mockResolvedKeyTypeRow: ResolvedRow = {
  field: { key: 'patient.identifiers', keyType: 'PASSPORT' },
  value: { value: 'P123' } satisfies ScalarValue,
};

export const mockResolvedRangeRow: ResolvedRow = {
  field: { key: 'patient.age' },
  value: {
    from: { value: '20', comparator: null },
    to: { value: '50', comparator: null },
  } satisfies RangeValue,
};

export const mockValidActions: ActionConfig[] = [
  {
    key: 'viewPatient',
    type: 'navigate',
    requiredPrivileges: ['View Patients'],
    navigationURL: '/patient/{name}',
  },
];

export const mockActionsWithDuplicateKeys: ActionConfig[] = [
  {
    key: 'viewPatient',
    type: 'navigate',
    requiredPrivileges: [],
    navigationURL: '/patient/{name}',
  },
  {
    key: 'viewPatient',
    type: 'navigate',
    requiredPrivileges: [],
    navigationURL: '/patient/{id}',
  },
];

export const mockContextWithValidActions: SearchContextConfig = {
  context: 'patient',
  translationKey: 'PATIENT_CONTEXT',
  requiredPrivileges: [],
  locationAware: 'loggedInLocation',
  url: '/api/patient',
  pageSize: 10,
  criteria: [],
  resultFields: [
    {
      translationKey: 'PATIENT_NAME',
      expression: 'name',
      action: 'viewPatient',
    },
  ],
  actions: mockValidActions,
};

export const mockContextWithUnknownActionKey: SearchContextConfig = {
  ...mockContextWithValidActions,
  resultFields: [
    {
      translationKey: 'PATIENT_NAME',
      expression: 'name',
      action: 'unknownAction',
    },
  ],
};

export const mockContextWithMissingActionsArray: SearchContextConfig = {
  ...mockContextWithValidActions,
  actions: undefined,
};

export const mockRowDateScalar: CriterionRow = {
  rowId: 'row-date-scalar',
  criterionKey: 'patient.birthdate',
  value: { value: '2026-07-23T10:30:00.000Z' } satisfies ScalarValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowDateRange: CriterionRow = {
  rowId: 'row-date-range',
  criterionKey: 'patient.birthdate',
  value: {
    from: { value: '2026-01-15T00:00:00.000Z', comparator: null },
    to: { value: '2026-07-23T23:59:59.000Z', comparator: null },
  } satisfies RangeValue,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowDateRangeFromOnly: CriterionRow = {
  rowId: 'row-date-range-from-only',
  criterionKey: 'patient.birthdate',
  value: {
    from: { value: '2026-01-15T00:00:00.000Z', comparator: null },
  } satisfies RangeValue,
  validationError: null,
  rangeOrderError: null,
};

export const multiKeyTypeCriteria: CriterionConfig[] = [
  {
    id: 'patient.identifiers:UMI-UUID',
    field: { key: 'patient.identifiers', keyType: 'UMI-UUID' },
    translationKey: 'UMI',
    input: { kind: 'text', placeholderTranslationKey: 'UMI_PH' },
  },
  {
    id: 'patient.identifiers:IME-UUID',
    field: { key: 'patient.identifiers', keyType: 'IME-UUID' },
    translationKey: 'IME',
    input: { kind: 'text', placeholderTranslationKey: 'IME_PH' },
  },
];

export const mockUserPrivileges: UserPrivilege[] = [{ name: 'test-privilege' }];

export const mockSimpleFieldCriterion: CriterionConfig = {
  field: { key: 'patient.name.given' },
  translationKey: 'T',
  input: { kind: 'text', placeholderTranslationKey: 'PH' },
};

export const mockKeyTypeFieldCriterion: CriterionConfig = {
  field: { key: 'patient.identifiers', keyType: 'PASSPORT' },
  translationKey: 'T',
  input: { kind: 'text', placeholderTranslationKey: 'PH' },
};

export const makeMockContextWithCriteria = (
  criteria: CriterionConfig[],
  requiredPrivileges: string[] = [],
): SearchContextConfig => ({
  context: 'patient',
  translationKey: 'T',
  requiredPrivileges,
  locationAware: 'loggedInLocation',
  url: '/test',
  pageSize: 10,
  resultFields: [],
  criteria,
});
