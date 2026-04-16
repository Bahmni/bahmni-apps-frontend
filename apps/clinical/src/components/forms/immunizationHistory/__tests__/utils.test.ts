import { Immunization, Medication } from 'fhir/r4';
import { getMedicationDisplay } from '../../../../services/medicationService';
import {
  getValueSetComboBoxItems,
  getMedicationComboBoxItems,
  getLocationComboBoxItems,
  getComboBoxItems,
  createImmunizationBundleEntries,
} from '../utils';
import {
  mockVaccineValueSet,
  mockLocations,
  mockLocationsWithChildren,
  mockVaccineDrugs,
  mockImmunizationEntry,
  mockImmunizationEntryComplete,
  mockEncounterSubject,
} from './__mocks__/immunizationHistoryMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  generateUUID: jest.fn().mockReturnValue('mock-uuid'),
}));

jest.mock('../../../../services/medicationService');

const COMBO_BOX_MESSAGES = {
  loading: 'Loading...',
  error: 'Error occurred',
  empty: 'No results',
};

const BASE_BUNDLE_PARAMS = {
  selectedImmunizations: [],
  encounterSubject: mockEncounterSubject,
  encounterReference: 'Encounter/encounter-uuid',
  practitionerUUID: 'practitioner-uuid',
};

describe('getValueSetComboBoxItems', () => {
  it.each([[''], ['   ']])(
    'returns empty array for "%s" searchTerm',
    (searchTerm) => {
      expect(getValueSetComboBoxItems(searchTerm, mockVaccineValueSet)).toEqual(
        [],
      );
    },
  );

  it('returns empty array when valueSet is undefined', () => {
    expect(getValueSetComboBoxItems('covid', undefined)).toEqual([]);
  });

  it('filters items by search term case-insensitively', () => {
    expect(getValueSetComboBoxItems('COVID', mockVaccineValueSet)).toEqual([
      { code: 'covid-19', display: 'COVID-19 Vaccine' },
    ]);
  });

  it('returns all items matching the search term', () => {
    expect(
      getValueSetComboBoxItems('vaccine', mockVaccineValueSet),
    ).toHaveLength(2);
  });

  it('returns empty array when no items match', () => {
    expect(getValueSetComboBoxItems('mumps', mockVaccineValueSet)).toEqual([]);
  });
});

describe('getMedicationComboBoxItems', () => {
  it.each([[''], ['   ']])(
    'returns empty array for "%s" searchTerm',
    (searchTerm) => {
      expect(getMedicationComboBoxItems(searchTerm, mockVaccineDrugs)).toEqual(
        [],
      );
    },
  );

  it('returns empty array when medications is undefined', () => {
    expect(getMedicationComboBoxItems('bcg', undefined)).toEqual([]);
  });

  it('filters medications by display name and vaccineCode', () => {
    (getMedicationDisplay as jest.Mock).mockReturnValue('BCG Vaccine');
    expect(
      getMedicationComboBoxItems('BCG', mockVaccineDrugs, 'bcg-code'),
    ).toEqual([{ code: 'bcg-code', display: 'BCG Vaccine' }]);
  });

  it.each([
    ['no matching search term', 'flu', 'bcg-code', undefined],
    ['no matching vaccineCode', 'BCG', 'covid-19', undefined],
    [
      'medications exist but no search match with emptyMessage',
      'flu',
      'bcg-code',
      'No results',
    ],
  ])(
    'returns empty array when %s',
    (_, searchTerm, vaccineCode, emptyMessage) => {
      (getMedicationDisplay as jest.Mock).mockReturnValue('BCG Vaccine');
      expect(
        getMedicationComboBoxItems(
          searchTerm,
          mockVaccineDrugs,
          vaccineCode,
          emptyMessage,
        ),
      ).toEqual([]);
    },
  );

  it('falls back to empty string when first coding entry has no code', () => {
    (getMedicationDisplay as jest.Mock).mockReturnValue('BCG Vaccine');
    const medicationWithPartialCoding: Medication[] = [
      {
        resourceType: 'Medication',
        code: { coding: [{ system: 'some-system' }, { code: 'bcg-code' }] },
      },
    ];
    expect(
      getMedicationComboBoxItems(
        'BCG',
        medicationWithPartialCoding,
        'bcg-code',
      ),
    ).toEqual([{ code: '', display: 'BCG Vaccine' }]);
  });

  it('returns disabled sentinel when no medications match the vaccineCode and emptyMessage is provided', () => {
    (getMedicationDisplay as jest.Mock).mockReturnValue('BCG Vaccine');
    expect(
      getMedicationComboBoxItems(
        'BCG',
        mockVaccineDrugs,
        'covid-19',
        'No results',
      ),
    ).toEqual([{ code: '', display: 'No results', disabled: true }]);
  });
});

describe('getLocationComboBoxItems', () => {
  it.each([[''], ['   ']])(
    'returns empty array for "%s" searchTerm',
    (searchTerm) => {
      expect(getLocationComboBoxItems(searchTerm, mockLocations)).toEqual([]);
    },
  );

  it('returns empty array when locations is undefined', () => {
    expect(getLocationComboBoxItems('main', undefined)).toEqual([]);
  });

  it('matches top-level locations by display', () => {
    expect(getLocationComboBoxItems('main', mockLocations)).toEqual([
      { uuid: 'location-uuid-1', display: 'Main Clinic' },
    ]);
  });

  it('includes child locations in results', () => {
    expect(getLocationComboBoxItems('ward', mockLocationsWithChildren)).toEqual(
      [{ uuid: 'child-uuid', display: 'Ward A' }],
    );
  });

  it('returns both parent and child when both match the search term', () => {
    expect(
      getLocationComboBoxItems('a', mockLocationsWithChildren),
    ).toHaveLength(2);
  });

  it('returns empty array when no locations match', () => {
    expect(getLocationComboBoxItems('xyz', mockLocations)).toEqual([]);
  });
});

describe('getComboBoxItems', () => {
  it.each([[''], ['   ']])(
    'returns empty array for "%s" searchTerm',
    (searchTerm) => {
      expect(
        getComboBoxItems(
          searchTerm,
          mockVaccineValueSet,
          false,
          false,
          COMBO_BOX_MESSAGES,
        ),
      ).toEqual([]);
    },
  );

  it('returns disabled loading sentinel when isLoading is true', () => {
    expect(
      getComboBoxItems(
        'covid',
        mockVaccineValueSet,
        true,
        false,
        COMBO_BOX_MESSAGES,
      ),
    ).toEqual([{ display: 'Loading...', disabled: true }]);
  });

  it('returns disabled error sentinel when isError is true', () => {
    expect(
      getComboBoxItems(
        'covid',
        mockVaccineValueSet,
        false,
        true,
        COMBO_BOX_MESSAGES,
      ),
    ).toEqual([{ display: 'Error occurred', disabled: true }]);
  });

  it('returns disabled empty sentinel when no items match', () => {
    expect(
      getComboBoxItems(
        'mumps',
        mockVaccineValueSet,
        false,
        false,
        COMBO_BOX_MESSAGES,
      ),
    ).toEqual([{ display: 'No results', disabled: true }]);
  });

  it('returns filtered items when search matches', () => {
    expect(
      getComboBoxItems(
        'covid',
        mockVaccineValueSet,
        false,
        false,
        COMBO_BOX_MESSAGES,
      ),
    ).toEqual([{ code: 'covid-19', display: 'COVID-19 Vaccine' }]);
  });

  it('filters case-insensitively', () => {
    expect(
      getComboBoxItems(
        'COVID',
        mockVaccineValueSet,
        false,
        false,
        COMBO_BOX_MESSAGES,
      ),
    ).toEqual([{ code: 'covid-19', display: 'COVID-19 Vaccine' }]);
  });
});

describe('createImmunizationBundleEntries', () => {
  it('returns empty array when selectedImmunizations is empty', () => {
    expect(createImmunizationBundleEntries(BASE_BUNDLE_PARAMS)).toEqual([]);
  });

  it('returns one entry per selected immunization', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [
        mockImmunizationEntry,
        mockImmunizationEntryComplete,
      ],
    });
    expect(result).toHaveLength(2);
  });

  it('sets fullUrl using the generated UUID', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [mockImmunizationEntry],
    });
    expect(result[0].fullUrl).toBe('urn:uuid:mock-uuid');
  });

  it('constructs the core immunization resource correctly for a minimal entry', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [mockImmunizationEntry],
    });
    const resource = result[0].resource as Immunization;
    expect(resource).toMatchObject({
      resourceType: 'Immunization',
      status: 'completed',
      vaccineCode: {
        coding: [{ code: 'covid-19', display: 'COVID-19 Vaccine' }],
      },
      patient: mockEncounterSubject,
      encounter: { reference: 'Encounter/encounter-uuid' },
    });
  });

  it('omits optional fields when they are null on a minimal entry', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [mockImmunizationEntry],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.occurrenceDateTime).toBeUndefined();
    expect(resource.location).toBeUndefined();
    expect(resource.route).toBeUndefined();
    expect(resource.site).toBeUndefined();
    expect(resource.expirationDate).toBeUndefined();
    expect(resource.manufacturer).toBeUndefined();
    expect(resource.lotNumber).toBeUndefined();
  });

  it('includes all optional fields when set on a complete entry', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [mockImmunizationEntryComplete],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.location).toEqual({
      reference: 'Location/location-uuid-1',
    });
    expect(resource.route).toEqual({ coding: [{ code: 'im' }] });
    expect(resource.site).toEqual({ coding: [{ code: 'arm' }] });
    expect(resource.manufacturer).toEqual({ display: 'Pfizer' });
    expect(resource.lotNumber).toBe('BATCH-001');
    expect(resource.occurrenceDateTime).toBeDefined();
    expect(resource.expirationDate).toBeDefined();
  });

  it('sets the performer with the correct practitioner reference', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [mockImmunizationEntry],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.performer).toEqual([
      {
        function: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0443',
              code: 'AP',
              display: 'Administering Provider',
            },
          ],
        },
        actor: {
          reference: 'Practitioner/practitioner-uuid',
          type: 'Practitioner',
        },
      },
    ]);
  });

  it('sets the bundle request method to POST', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [mockImmunizationEntry],
    });
    expect(result[0].request?.method).toBe('POST');
  });
});
