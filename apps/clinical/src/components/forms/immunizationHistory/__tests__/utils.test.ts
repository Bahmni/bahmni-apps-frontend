import { Immunization, Medication } from 'fhir/r4';
import { getMedicationDisplay } from '../../../../services/medicationService';
import { ADMINISTERED_PRODUCT_EXTENSION_URL } from '../constants';
import {
  findAttr,
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
  mockValueSetWithPartialItem,
  mockValueSetWithoutContains,
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

describe('findAttr', () => {
  const attributes = [
    { name: 'administeredOn', required: true },
    { name: 'route', required: false },
  ];

  it.each([
    ['administeredOn', { name: 'administeredOn', required: true }],
    ['route', { name: 'route', required: false }],
  ])('returns the attribute config for "%s"', (name, expected) => {
    expect(findAttr(name, attributes)).toEqual(expected);
  });

  it('returns undefined when attribute name is not in the list', () => {
    expect(findAttr('site', attributes)).toBeUndefined();
  });

  it('returns undefined when attributes is undefined', () => {
    expect(findAttr('administeredOn', undefined)).toBeUndefined();
  });
});

describe('getValueSetComboBoxItems', () => {
  it.each([[''], ['   ']])(
    'returns empty array for "%s" searchTerm',
    (searchTerm) => {
      expect(
        getValueSetComboBoxItems(searchTerm, mockVaccineValueSet, 'No results'),
      ).toEqual([]);
    },
  );

  it('returns disabled sentinel when valueSet is undefined', () => {
    expect(getValueSetComboBoxItems('covid', undefined, 'No results')).toEqual([
      { code: '', display: 'No results', disabled: true },
    ]);
  });

  it('filters items by search term case-insensitively', () => {
    expect(
      getValueSetComboBoxItems('COVID', mockVaccineValueSet, 'No results'),
    ).toEqual([{ code: 'covid-19', display: 'COVID-19 Vaccine' }]);
  });

  it('returns all items matching the search term', () => {
    expect(
      getValueSetComboBoxItems('vaccine', mockVaccineValueSet, 'No results'),
    ).toHaveLength(2);
  });

  it('returns disabled sentinel when no items match', () => {
    expect(
      getValueSetComboBoxItems('mumps', mockVaccineValueSet, 'No results'),
    ).toEqual([{ code: '', display: 'No results', disabled: true }]);
  });

  it('defaults code and display to empty string when missing on a matching item', () => {
    expect(
      getValueSetComboBoxItems(
        'Partial',
        mockValueSetWithPartialItem,
        'No results',
      ),
    ).toEqual([{ code: '', display: 'Partial Vaccine' }]);
  });

  it('returns disabled sentinel when expansion has no contains and emptyMessage is provided', () => {
    expect(
      getValueSetComboBoxItems(
        'covid',
        mockValueSetWithoutContains,
        'No results',
      ),
    ).toEqual([{ code: '', display: 'No results', disabled: true }]);
  });
});

describe('getMedicationComboBoxItems', () => {
  it.each([[''], ['   ']])(
    'returns empty array for "%s" searchTerm',
    (searchTerm) => {
      expect(
        getMedicationComboBoxItems(
          searchTerm,
          mockVaccineDrugs,
          'bcg-code',
          'No results',
        ),
      ).toEqual([]);
    },
  );

  it('returns disabled sentinel when medications is undefined', () => {
    expect(
      getMedicationComboBoxItems('bcg', undefined, 'bcg-code', 'No results'),
    ).toEqual([{ code: '', display: 'No results', disabled: true }]);
  });

  it('filters medications by display name and vaccineCode', () => {
    (getMedicationDisplay as jest.Mock).mockReturnValue('BCG Vaccine');
    expect(
      getMedicationComboBoxItems(
        'BCG',
        mockVaccineDrugs,
        'bcg-code',
        'No results',
      ),
    ).toEqual([{ code: 'bcg-drug-uuid', display: 'BCG Vaccine' }]);
  });

  it('returns empty array when no medications match the search term', () => {
    (getMedicationDisplay as jest.Mock).mockReturnValue('BCG Vaccine');
    expect(
      getMedicationComboBoxItems(
        'flu',
        mockVaccineDrugs,
        'bcg-code',
        'No results',
      ),
    ).toEqual([]);
  });

  it('falls back to empty string when medication has no id', () => {
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
        'No results',
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

  it.each([['covid'], ['COVID']])(
    'returns filtered items matching "%s" case-insensitively',
    (searchTerm) => {
      expect(
        getComboBoxItems(
          searchTerm,
          mockVaccineValueSet,
          false,
          false,
          COMBO_BOX_MESSAGES,
        ),
      ).toEqual([{ code: 'covid-19', display: 'COVID-19 Vaccine' }]);
    },
  );
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
    expect(resource.extension).toBeUndefined();
    expect(resource.note).toBeUndefined();
    expect(resource.protocolApplied).toBeUndefined();
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
    expect(resource.extension).toEqual([
      {
        url: ADMINISTERED_PRODUCT_EXTENSION_URL,
        valueReference: {
          reference: 'Medication/covid-drug-uuid',
          display: 'COVID-19 Drug',
        },
      },
    ]);
    expect(resource.note).toEqual([
      {
        text: 'Third dose completed successfully.',
        authorReference: {
          reference: 'Practitioner/practitioner-uuid',
          type: 'Practitioner',
        },
      },
    ]);
    expect(resource.protocolApplied).toEqual([{ doseNumberPositiveInt: 3 }]);
  });

  it.each([
    [3, [{ doseNumberPositiveInt: 3 }]],
    [null, undefined],
  ])(
    'maps doseSequence %s to protocolApplied %j',
    (doseSequence, expectedProtocolApplied) => {
      const entry = { ...mockImmunizationEntry, doseSequence };
      const result = createImmunizationBundleEntries({
        ...BASE_BUNDLE_PARAMS,
        selectedImmunizations: [entry],
      });
      const resource = result[0].resource as Immunization;
      expect(resource.protocolApplied).toEqual(expectedProtocolApplied);
    },
  );

  it('includes administeredProduct extension with display only when drug has no code', () => {
    const entryWithFreetextDrug = {
      ...mockImmunizationEntry,
      drug: { display: 'Custom Vaccine' },
    };
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [entryWithFreetextDrug],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.extension).toEqual([
      {
        url: ADMINISTERED_PRODUCT_EXTENSION_URL,
        valueReference: { display: 'Custom Vaccine' },
      },
    ]);
  });

  it('uses location.display when administeredLocation has no uuid (custom value)', () => {
    const entryWithCustomLocation = {
      ...mockImmunizationEntry,
      administeredLocation: { display: 'Custom Ward' },
    };
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [entryWithCustomLocation],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.location).toEqual({ display: 'Custom Ward' });
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
              code: 'EP',
              display: 'Entering Provider',
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
