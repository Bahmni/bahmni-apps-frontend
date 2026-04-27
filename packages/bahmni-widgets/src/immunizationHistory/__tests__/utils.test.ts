import { Immunization } from 'fhir/r4';
import {
  createAdministeredImmunizationViewModel,
  createNotAdministeredImmunizationViewModel,
} from '../utils';
import {
  mockAdministeredImmunization,
  mockMinimalAdministeredImmunization,
  mockMinimalNotAdministeredImmunization,
  mockNotAdministeredImmunization,
} from './__mocks__/immunizationMocks';

describe('createAdministeredImmunizationViewModel', () => {
  it('maps all fields from a full immunization', () => {
    const result = createAdministeredImmunizationViewModel(
      mockAdministeredImmunization,
    );

    expect(result).toEqual({
      id: 'imm-uuid-1',
      code: 'Measles',
      doseSequence: '3',
      drugName: 'MisoPrime',
      administeredOn: '2026-03-24',
      administeredLocation: 'Test Hospital',
      route: 'Intravenous',
      site: 'Shoulder',
      manufacturer: 'Medsource',
      batchNumber: '12345',
      recordedBy: 'Aisha Khan',
      orderedBy: 'Dr S.Johnson',
      notes: 'Third dose completed successfully.',
      hasDetails: true,
    });
  });

  it('applies fallbacks for all missing optional fields', () => {
    const result = createAdministeredImmunizationViewModel(
      mockMinimalAdministeredImmunization,
    );

    expect(result.drugName).toBeNull();
    expect(result.administeredLocation).toBeNull();
    expect(result.route).toBeNull();
    expect(result.site).toBeNull();
    expect(result.manufacturer).toBeNull();
    expect(result.batchNumber).toBeNull();
    expect(result.recordedBy).toBeNull();
    expect(result.orderedBy).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.hasDetails).toBe(false);
  });

  it.each([
    { field: 'route', override: { route: { coding: [{ display: 'IV' }] } } },
    { field: 'site', override: { site: { coding: [{ display: 'Arm' }] } } },
    {
      field: 'manufacturer',
      override: { manufacturer: { display: 'ABC Corp' } },
    },
    { field: 'batchNumber', override: { lotNumber: 'LOT-001' } },
    {
      field: 'recordedBy',
      override: {
        performer: [
          {
            function: { coding: [{ code: 'EP' }] },
            actor: { display: 'Nurse' },
          },
        ],
      },
    },
    {
      field: 'orderedBy',
      override: {
        performer: [
          {
            function: { coding: [{ code: 'OP' }] },
            actor: { display: 'Doctor' },
          },
        ],
      },
    },
  ])(
    'sets hasDetails to true when $field is present',
    ({ override }: { field: string; override: Partial<Immunization> }) => {
      const result = createAdministeredImmunizationViewModel({
        ...mockMinimalAdministeredImmunization,
        ...override,
      });
      expect(result.hasDetails).toBe(true);
    },
  );

  it.each([
    { field: 'id', override: { id: undefined }, key: 'id', expected: '' },
    {
      field: 'code',
      override: { vaccineCode: undefined },
      key: 'code',
      expected: null,
    },
    {
      field: 'administeredOn',
      override: { occurrenceDateTime: undefined },
      key: 'administeredOn',
      expected: null,
    },
  ])(
    'falls back $field to $expected when absent',
    ({
      override,
      key,
      expected,
    }: {
      field: string;
      override: Partial<Immunization>;
      key: string;
      expected: string | null;
    }) => {
      const result = createAdministeredImmunizationViewModel({
        ...mockMinimalAdministeredImmunization,
        ...override,
      });
      expect(result[key as keyof typeof result]).toBe(expected);
    },
  );

  it.each([
    {
      description: 'doseNumberPositiveInt',
      protocolApplied: [{ doseNumberPositiveInt: 3 }],
      expected: '3',
    },
    {
      description: 'doseNumberString',
      protocolApplied: [{ doseNumberString: 'Booster' }],
      expected: 'Booster',
    },
    {
      description: 'absent protocolApplied',
      protocolApplied: undefined,
      expected: null,
    },
  ])(
    'maps doseSequence from $description',
    ({
      protocolApplied,
      expected,
    }: {
      description: string;
      protocolApplied: Immunization['protocolApplied'];
      expected: string | null;
    }) => {
      const result = createAdministeredImmunizationViewModel({
        ...mockMinimalAdministeredImmunization,
        protocolApplied,
      });
      expect(result.doseSequence).toBe(expected);
    },
  );
});

describe('createNotAdministeredImmunizationViewModel', () => {
  it('maps all fields from a full immunization', () => {
    const result = createNotAdministeredImmunizationViewModel(
      mockNotAdministeredImmunization,
    );

    expect(result).toEqual({
      id: 'waiver-uuid-1',
      code: 'Hepatitis B',
      reason: 'Patient refused',
      date: '2026-03-19',
      recordedBy: 'John Davis',
    });
  });

  it('returns null for missing reason and recordedBy', () => {
    const result = createNotAdministeredImmunizationViewModel(
      mockMinimalNotAdministeredImmunization,
    );

    expect(result.reason).toBeNull();
    expect(result.recordedBy).toBeNull();
  });

  it.each([
    { field: 'id', override: { id: undefined }, key: 'id', expected: '' },
    {
      field: 'code',
      override: { vaccineCode: undefined },
      key: 'code',
      expected: null,
    },
    {
      field: 'date',
      override: { occurrenceDateTime: undefined },
      key: 'date',
      expected: null,
    },
  ])(
    'falls back $field to $expected when absent',
    ({
      override,
      key,
      expected,
    }: {
      field: string;
      override: Partial<Immunization>;
      key: string;
      expected: string | null;
    }) => {
      const result = createNotAdministeredImmunizationViewModel({
        ...mockMinimalNotAdministeredImmunization,
        ...override,
      });
      expect(result[key as keyof typeof result]).toBe(expected);
    },
  );
});
