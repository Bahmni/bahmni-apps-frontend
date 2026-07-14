import { Immunization, Medication, MedicationRequest } from 'fhir/r4';
import { getMedicationDisplay } from '../../../../services/medicationService';
import {
  ADMINISTERED_PRODUCT_EXTENSION_URL,
  BASED_ON_EXTENSION_URL,
  STOCK_LOCATION_EXTENSION_URL,
} from '../constants';
import {
  buildBasedOnImmunizationEntry,
  createImmunizationBundleEntries,
  findAttr,
  formatBatchItemDisplay,
  getBatchNumberComboBoxItems,
  getComboBoxItems,
  getLocationComboBoxItems,
  getMedicationComboBoxItems,
  getValueSetComboBoxItems,
  getVaccineComboBoxItems,
} from '../utils';
import {
  mockAvailableStockResponse,
  mockAvailableStockWithEmptyBatch,
  mockDuplicateCovidVaccineMedication,
  mockEmptyAvailableStockResponse,
  mockEncounterSubject,
  mockFetchedMedication,
  mockImmunizationEntry,
  mockImmunizationEntryComplete,
  mockImmunizationEntryWaiver,
  mockImmunizationEntryWithBasedOn,
  mockImmunizationEntryWithBasedOnNoDrug,
  mockLocations,
  mockLocationsWithChildren,
  mockMedicationRequest,
  mockVaccineDrugs,
  mockVaccineMedicationsWithDisplay,
  mockVaccineMedicationWithoutCoding,
  mockVaccineValueSet,
  mockValueSetWithPartialItem,
  mockValueSetWithoutContains,
} from './__mocks__/immunizationMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  generateUUID: jest.fn().mockReturnValue('mock-uuid'),
  formatDateTime: jest.fn().mockReturnValue({ formattedResult: '31 Dec 2026' }),
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
  isAdministration: false,
  isWaiver: false,
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

describe('getVaccineComboBoxItems', () => {
  it.each([[''], ['   ']])(
    'returns empty array for "%s" searchTerm',
    (searchTerm) => {
      expect(
        getVaccineComboBoxItems(
          searchTerm,
          mockVaccineMedicationsWithDisplay,
          'No results',
        ),
      ).toEqual([]);
    },
  );

  it('returns disabled sentinel when medications is undefined', () => {
    expect(getVaccineComboBoxItems('covid', undefined, 'No results')).toEqual([
      { code: '', display: 'No results', disabled: true },
    ]);
  });

  it('filters medications by coding display, case-insensitively', () => {
    expect(
      getVaccineComboBoxItems(
        'COVID',
        mockVaccineMedicationsWithDisplay,
        'No results',
      ),
    ).toEqual([{ code: '213', display: 'COVID-19 vaccine' }]);
  });

  it('deduplicates medications sharing the same coding code, keeping the first', () => {
    const result = getVaccineComboBoxItems(
      'covid',
      [
        mockDuplicateCovidVaccineMedication,
        mockVaccineMedicationsWithDisplay[0],
      ],
      'No results',
    );
    expect(result).toEqual([
      { code: '213', display: 'COVID-19 vaccine (brand B)' },
    ]);
  });

  it('falls back to code.text when coding has no display', () => {
    const medication = {
      resourceType: 'Medication' as const,
      id: 'med-with-text',
      code: { coding: [{ code: 'bcg-code' }], text: 'BCG Vaccine' },
    };
    expect(
      getVaccineComboBoxItems('BCG', [medication], 'No results'),
    ).toEqual([{ code: 'bcg-code', display: 'BCG Vaccine' }]);
  });

  it('falls back to the code itself when neither coding display nor code.text is set', () => {
    expect(
      getVaccineComboBoxItems('covid-19', mockVaccineDrugs, 'No results'),
    ).toEqual([{ code: '', display: 'No results', disabled: true }]);
    expect(
      getVaccineComboBoxItems(
        'bcg-code',
        mockVaccineDrugs,
        'No results',
      ),
    ).toEqual([{ code: 'bcg-code', display: 'bcg-code' }]);
  });

  it('skips medications without a coding code', () => {
    expect(
      getVaccineComboBoxItems(
        'anything',
        [mockVaccineMedicationWithoutCoding],
        'No results',
      ),
    ).toEqual([{ code: '', display: 'No results', disabled: true }]);
  });

  it('returns disabled sentinel when no medications match the search term', () => {
    expect(
      getVaccineComboBoxItems(
        'mumps',
        mockVaccineMedicationsWithDisplay,
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

describe('getBatchNumberComboBoxItems', () => {
  it('returns empty array when availableStocks is undefined', () => {
    expect(getBatchNumberComboBoxItems(undefined)).toEqual([]);
  });

  it('returns mapped BatchNumberComboBoxItems from availableStocks.data', () => {
    expect(getBatchNumberComboBoxItems(mockAvailableStockResponse)).toEqual([
      {
        batchNumber: 'BATCH-001',
        expiryDate: '2026-12-31',
        stockLocationName: 'Nurse Station',
      },
      {
        batchNumber: 'BATCH-002',
        expiryDate: '2027-06-30',
        stockLocationName: 'Nurse Station',
      },
    ]);
  });

  it('returns disabled error item when errorMessage is provided', () => {
    expect(
      getBatchNumberComboBoxItems(
        mockAvailableStockResponse,
        'Error loading stock batches',
      ),
    ).toEqual([
      {
        batchNumber: 'Error loading stock batches',
        expiryDate: '',
        stockLocationName: '',
        disabled: true,
      },
    ]);
  });

  it('returns disabled empty item when emptyMessage is provided', () => {
    expect(
      getBatchNumberComboBoxItems(
        mockEmptyAvailableStockResponse,
        undefined,
        'No stock batches available',
      ),
    ).toEqual([
      {
        batchNumber: 'No stock batches available',
        expiryDate: '',
        stockLocationName: '',
        disabled: true,
      },
    ]);
  });

  it('filters out items with empty or whitespace-only batch numbers', () => {
    expect(
      getBatchNumberComboBoxItems(mockAvailableStockWithEmptyBatch),
    ).toEqual([
      {
        batchNumber: 'BATCH-001',
        expiryDate: '2026-12-31',
        stockLocationName: 'Nurse Station',
      },
    ]);
  });
});

describe('formatBatchItemDisplay', () => {
  const mockT = (key: string) => key;

  it('returns empty string for null item', () => {
    expect(formatBatchItemDisplay(null, mockT)).toBe('');
  });

  it.each([
    ['no expiry date or location', 'BATCH-001', '', '', 'BATCH-001'],
    [
      'expiry date only',
      'BATCH-001',
      '2026-12-31',
      '',
      'BATCH-001 [31 Dec 2026]',
    ],
    [
      'stock location only',
      'BATCH-001',
      '',
      'Nurse Station',
      'BATCH-001 - Nurse Station',
    ],
    [
      'both expiry date and location',
      'BATCH-001',
      '2026-12-31',
      'Nurse Station',
      'BATCH-001 [31 Dec 2026] - Nurse Station',
    ],
  ])(
    'formats correctly with %s',
    (_, batchNumber, expiryDate, stockLocationName, expected) => {
      expect(
        formatBatchItemDisplay(
          { batchNumber, expiryDate, stockLocationName },
          mockT,
        ),
      ).toBe(expected);
    },
  );
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
    expect(result[0].fullUrl).toBe('urn:uuid:test-id-1');
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

  it('includes basedOn extension when basedOnReference is set and drug is absent', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [mockImmunizationEntryWithBasedOnNoDrug],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.extension).toEqual([
      {
        url: BASED_ON_EXTENSION_URL,
        valueReference: { reference: 'MedicationRequest/med-request-uuid' },
      },
    ]);
  });

  it('includes both administeredProduct and basedOn extensions when both drug and basedOnReference are set', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [mockImmunizationEntryWithBasedOn],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.extension).toEqual([
      {
        url: ADMINISTERED_PRODUCT_EXTENSION_URL,
        valueReference: {
          reference: 'Medication/covid-drug-uuid',
          display: 'COVID-19 Drug',
        },
      },
      {
        url: BASED_ON_EXTENSION_URL,
        valueReference: { reference: 'MedicationRequest/med-request-uuid' },
      },
    ]);
  });

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

  it('includes stockLocation extension when stockLocation is set', () => {
    const entryWithStockLocation = {
      ...mockImmunizationEntry,
      stockLocation: 'Nurse Station',
    };
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [entryWithStockLocation],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.extension).toEqual([
      {
        url: STOCK_LOCATION_EXTENSION_URL,
        valueString: 'Nurse Station',
      },
    ]);
  });

  it.each([
    ['null', null],
    ['empty string', ''],
    ['whitespace', '   '],
  ])('omits stockLocation extension when value is %s', (_, stockLocation) => {
    const entry = {
      ...mockImmunizationEntry,
      stockLocation,
    };
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [entry],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.extension).toBeUndefined();
  });

  it('appends stockLocation extension alongside administeredProduct and basedOn extensions', () => {
    const entry = {
      ...mockImmunizationEntryWithBasedOn,
      stockLocation: 'Nurse Station',
    };
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      selectedImmunizations: [entry],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.extension).toEqual([
      {
        url: ADMINISTERED_PRODUCT_EXTENSION_URL,
        valueReference: {
          reference: 'Medication/covid-drug-uuid',
          display: 'COVID-19 Drug',
        },
      },
      {
        url: BASED_ON_EXTENSION_URL,
        valueReference: { reference: 'MedicationRequest/med-request-uuid' },
      },
      {
        url: STOCK_LOCATION_EXTENSION_URL,
        valueString: 'Nurse Station',
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

  it('sets primarySource to false for immunization history', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      isAdministration: false,
      selectedImmunizations: [mockImmunizationEntry],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.primarySource).toBe(false);
  });

  it('sets primarySource to true for immunization administration', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      isAdministration: true,
      selectedImmunizations: [mockImmunizationEntry],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.primarySource).toBe(true);
  });

  it('sets status to not-done and includes statusReason coding when isWaiver is true', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      isWaiver: true,
      selectedImmunizations: [mockImmunizationEntryWaiver],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.status).toBe('not-done');
    expect(resource.statusReason).toEqual({
      coding: [{ code: 'not-age-appropriate', display: 'Not age appropriate' }],
    });
  });

  it('sets status to completed when isWaiver is false, regardless of statusReason', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      isWaiver: false,
      selectedImmunizations: [mockImmunizationEntryWaiver],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.status).toBe('completed');
  });

  it('omits route, site, manufacturer, lotNumber, protocolApplied and expirationDate when isWaiver is true, even if set on the entry', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      isWaiver: true,
      selectedImmunizations: [mockImmunizationEntryWaiver],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.route).toBeUndefined();
    expect(resource.site).toBeUndefined();
    expect(resource.manufacturer).toBeUndefined();
    expect(resource.lotNumber).toBeUndefined();
    expect(resource.protocolApplied).toBeUndefined();
    expect(resource.expirationDate).toBeUndefined();
  });

  it('omits statusReason when the entry has no statusReason set, even if isWaiver is true', () => {
    const result = createImmunizationBundleEntries({
      ...BASE_BUNDLE_PARAMS,
      isWaiver: true,
      selectedImmunizations: [mockImmunizationEntry],
    });
    const resource = result[0].resource as Immunization;
    expect(resource.statusReason).toBeUndefined();
  });
});

describe('buildBasedOnImmunizationEntry', () => {
  const mockLoginLocation = {
    uuid: 'loc-uuid',
    display: 'Main Clinic',
    name: 'Main Clinic',
  };

  it('extracts vaccineCode from basedOnMedication coding and medicationReference display', () => {
    const { vaccineCode } = buildBasedOnImmunizationEntry(
      mockMedicationRequest,
      mockFetchedMedication,
      mockLoginLocation,
    );
    expect(vaccineCode).toEqual({ code: 'covid-19', display: 'COVID-19 Drug' });
  });

  it('sets drug code from basedOnMedication.id and display from medicationReference', () => {
    const { defaults } = buildBasedOnImmunizationEntry(
      mockMedicationRequest,
      mockFetchedMedication,
      mockLoginLocation,
    );
    expect(defaults.drug).toEqual({
      code: 'covid-drug-uuid',
      display: 'COVID-19 Drug',
    });
  });

  it('sets drug to null when medicationReference has no display', () => {
    const basedOnNoDisplay = {
      ...mockMedicationRequest,
      medicationReference: { reference: 'Medication/covid-drug-uuid' },
    } as MedicationRequest;
    const { defaults } = buildBasedOnImmunizationEntry(
      basedOnNoDisplay,
      mockFetchedMedication,
      mockLoginLocation,
    );
    expect(defaults.drug).toBeNull();
  });

  it.each([
    [
      'display is set',
      { uuid: 'loc-uuid', display: 'Main Clinic', name: 'Fallback' },
      'Main Clinic',
    ],
    [
      'display is absent',
      { uuid: 'loc-uuid', name: 'Fallback Name' },
      'Fallback Name',
    ],
  ])(
    'uses loginLocation.%s for administeredLocation.display',
    (_, loginLocation, expectedDisplay) => {
      const { defaults } = buildBasedOnImmunizationEntry(
        mockMedicationRequest,
        mockFetchedMedication,
        loginLocation,
      );
      expect(defaults.administeredLocation).toMatchObject({
        uuid: loginLocation.uuid,
        display: expectedDisplay,
      });
    },
  );

  it('sets basedOnReference to basedOn.id', () => {
    const { defaults } = buildBasedOnImmunizationEntry(
      mockMedicationRequest,
      mockFetchedMedication,
      mockLoginLocation,
    );
    expect(defaults.basedOnReference).toBe('med-request-uuid');
  });

  it('sets administeredOn to a current Date instance', () => {
    const before = new Date();
    const { defaults } = buildBasedOnImmunizationEntry(
      mockMedicationRequest,
      mockFetchedMedication,
      mockLoginLocation,
    );
    expect(defaults.administeredOn).toBeInstanceOf(Date);
    expect(defaults.administeredOn.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
  });
});
