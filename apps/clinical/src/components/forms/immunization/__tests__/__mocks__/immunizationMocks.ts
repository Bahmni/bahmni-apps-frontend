import { Location, type AvailableStockResponse } from '@bahmni/services';
import { Medication, MedicationRequest, Reference } from 'fhir/r4';
import { InputControlAttributes } from '../../../../../providers/clinicalConfig/models';
import { ImmunizationInputEntry } from '../../models';

const MEDICINE_EXTENSION_URL = 'http://fhir.openmrs.org/ext/medicine'; // NOSONAR
const MEDICINE_DRUG_NAME_EXTENSION_URL =
  'http://fhir.openmrs.org/ext/medicine#drugName'; // NOSONAR

const buildMedicationEntry = (
  drugName: string,
  resourceType = 'Medication',
  vaccineCode?: string,
) => ({
  resource: {
    resourceType,
    extension: [
      {
        url: MEDICINE_EXTENSION_URL,
        extension: [
          { url: MEDICINE_DRUG_NAME_EXTENSION_URL, valueString: drugName },
        ],
      },
    ],
    ...(vaccineCode ? { code: { coding: [{ code: vaccineCode }] } } : {}),
  } as Medication,
});

const buildValueSet = (contains?: { code?: string; display: string }[]) => ({
  resourceType: 'ValueSet' as const,
  status: 'active' as const,
  expansion: {
    timestamp: '2024-01-01T00:00:00Z',
    ...(contains === undefined ? {} : { contains }),
  },
});

const baseMetadata = {
  routeConceptUuid: 'route-concept-uuid',
  vaccineConceptSetUuid: 'vaccine-concept-set-uuid',
  siteConceptUuid: 'site-concept-uuid',
  administeredLocationTag: 'login-location',
};

const baseAttributes: InputControlAttributes[] = [
  { name: 'drug', required: true },
  { name: 'administeredOn', required: true },
  { name: 'administeredLocation', required: true },
  { name: 'route', required: false },
  { name: 'site', required: false },
];

const baseInputControlConfig = {
  encounterTypes: ['Immunization'],
  privileges: ['app:clinical;addHistory'],
  attributes: baseAttributes,
  metadata: baseMetadata,
};

export const mockImmunizationInputControlConfig = {
  ...baseInputControlConfig,
  type: 'immunizationHistory',
};

export const mockAdministrationInputControlConfigAllowed = {
  ...baseInputControlConfig,
  type: 'immunizationAdministration',
};

export const mockAdministrationInputControlConfig = {
  ...baseInputControlConfig,
  type: 'immunizationAdministration',
  metadata: { ...baseMetadata, disableAdditionalAdministrations: true },
};

export const mockImmunizationInputControlConfigWithFetchStockBatches = {
  ...mockImmunizationInputControlConfig,
  metadata: {
    ...baseMetadata,
    fetchStockBatches: true,
  },
};

export const mockClinicalConfigContext = {
  clinicalConfig: {
    consultationPad: {
      inputControls: [
        {
          type: 'immunizationHistory',
          metadata: baseMetadata,
          encounterType: ['Immunization'],
          privilege: ['app:clinical;addHistory'],
          attributes: baseAttributes,
        },
      ],
    },
  },
  isLoading: false,
  error: null,
};

export const mockVaccineValueSet = buildValueSet([
  { code: 'covid-19', display: 'COVID-19 Vaccine' },
  { code: 'flu', display: 'Influenza Vaccine' },
]);

export const mockValueSetWithPartialItem = buildValueSet([
  { display: 'Partial Vaccine' },
]);

export const mockValueSetWithoutContains = buildValueSet();

export const mockRoutesValueSet = buildValueSet([
  { code: 'im', display: 'Intramuscular' },
]);

export const mockSitesValueSet = buildValueSet([
  { code: 'arm', display: 'Left Arm' },
]);

export const mockLocations: Location[] = [
  { uuid: 'location-uuid-1', display: 'Main Clinic', childLocations: [] },
];

export const mockLocationsWithChildren: Location[] = [
  {
    uuid: 'parent-uuid',
    display: 'Hospital',
    childLocations: [{ uuid: 'child-uuid', display: 'Ward A', retired: false }],
  },
];

export const mockVaccinationBundle = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [],
};

export const mockMixedVaccinationBundle = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    buildMedicationEntry('Paracetamol', 'Medication', 'covid-19'),
    buildMedicationEntry('ShouldBeExcluded', 'Observation'),
  ],
};

export const mockImmunizationEntry: ImmunizationInputEntry = {
  id: 'test-id-1',
  drug: null,
  vaccineCode: { code: 'covid-19', display: 'COVID-19 Vaccine' },
  administeredOn: null,
  administeredLocation: null,
  route: null,
  site: null,
  expiryDate: null,
  manufacturer: null,
  batchNumber: null,
  stockLocation: null,
  doseSequence: null,
  errors: {},
  hasBeenValidated: false,
};

export const mockVaccineCode = {
  code: 'covid-19',
  display: 'COVID-19 Vaccine',
};

/** All 10 form fields present, drug and administered fields required, others optional */
export const mockFullAttributes: InputControlAttributes[] = [
  { name: 'drug', required: true },
  { name: 'administeredOn', required: true },
  { name: 'administeredLocation', required: true },
  { name: 'route', required: false },
  { name: 'site', required: false },
  { name: 'manufacturer', required: false },
  { name: 'batchNumber', required: false },
  { name: 'doseSequence', required: false },
  { name: 'expiryDate', required: false },
  { name: 'note', required: false },
];

/** All 10 form fields present, all fields required */
export const mockAllRequiredAttributes: InputControlAttributes[] =
  mockFullAttributes.map((a) => ({ ...a, required: true }));

/** All 10 form fields present, all fields optional */
export const mockAttributesWithOptionalAdministered: InputControlAttributes[] =
  mockFullAttributes.map((a) => ({ ...a, required: false }));

export const mockImmunizationEntryWithDate: ImmunizationInputEntry = {
  ...mockImmunizationEntry,
  administeredOn: new Date('2025-01-01'),
};

export const mockImmunizationEntryWithErrors: ImmunizationInputEntry = {
  ...mockImmunizationEntry,
  errors: {
    drug: 'IMMUNIZATION_INPUT_CONTROL_DRUG_CODE_REQUIRED',
    administeredOn: 'IMMUNIZATION_INPUT_CONTROL_ADMINISTERED_ON_REQUIRED',
    administeredLocation:
      'IMMUNIZATION_INPUT_CONTROL_ADMINISTERED_LOCATION_REQUIRED',
    route: 'IMMUNIZATION_INPUT_CONTROL_ROUTE_REQUIRED',
    site: 'IMMUNIZATION_INPUT_CONTROL_SITE_REQUIRED',
    expiryDate: 'IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE_REQUIRED',
    manufacturer: 'IMMUNIZATION_INPUT_CONTROL_MANUFACTURER_REQUIRED',
    batchNumber: 'IMMUNIZATION_INPUT_CONTROL_BATCH_NUMBER_REQUIRED',
    doseSequence: 'IMMUNIZATION_INPUT_CONTROL_DOSE_SEQUENCE_REQUIRED',
    note: 'IMMUNIZATION_INPUT_CONTROL_NOTE_REQUIRED',
  },
  hasBeenValidated: true,
};

export const mockVaccineDrugs: Medication[] = [
  {
    resourceType: 'Medication',
    id: 'bcg-drug-uuid',
    extension: [
      {
        url: MEDICINE_EXTENSION_URL,
        extension: [
          { url: MEDICINE_DRUG_NAME_EXTENSION_URL, valueString: 'BCG Vaccine' },
        ],
      },
    ],
    code: { coding: [{ code: 'bcg-code' }] },
  },
];

export const mockCovid19VaccineDrug: Medication = {
  resourceType: 'Medication',
  id: 'covid-drug-uuid',
  extension: [
    {
      url: MEDICINE_EXTENSION_URL,
      extension: [
        { url: MEDICINE_DRUG_NAME_EXTENSION_URL, valueString: 'COVID-19 Drug' },
      ],
    },
  ],
  code: { coding: [{ code: 'covid-19' }] },
};

export const mockCovid19VaccineDrugs: Medication[] = [mockCovid19VaccineDrug];

export const mockEncounterSubject: Reference = {
  reference: 'Patient/patient-uuid',
};

export const mockImmunizationEntryComplete: ImmunizationInputEntry = {
  ...mockImmunizationEntry,
  drug: { code: 'covid-drug-uuid', display: 'COVID-19 Drug' },
  administeredOn: new Date('2025-01-01'),
  administeredLocation: { uuid: 'location-uuid-1', display: 'Main Clinic' },
  route: 'im',
  site: 'arm',
  expiryDate: new Date('2026-06-01'),
  manufacturer: 'Pfizer',
  batchNumber: 'BATCH-001',
  doseSequence: 3,
  note: 'Third dose completed successfully.',
};

export const mockImmunizationEntryWithBasedOn: ImmunizationInputEntry = {
  ...mockImmunizationEntry,
  basedOnReference: 'med-request-uuid',
  drug: { code: 'covid-drug-uuid', display: 'COVID-19 Drug' },
  administeredOn: new Date('2025-01-01'),
  administeredLocation: { uuid: 'location-uuid-1', display: 'Main Clinic' },
};

export const mockImmunizationEntryWithBasedOnNoDrug: ImmunizationInputEntry = {
  ...mockImmunizationEntry,
  basedOnReference: 'med-request-uuid',
};

export const mockImmunizationEntryWithBasedOnAndNullFields: ImmunizationInputEntry =
  {
    ...mockImmunizationEntry,
    basedOnReference: 'med-request-uuid',
    drug: null,
    administeredOn: null,
    administeredLocation: null,
  };

export const mockImmunizationEntryWithCustomDrug: ImmunizationInputEntry = {
  ...mockImmunizationEntry,
  drug: { display: 'Custom Drug Name' },
};

export const mockImmunizationEntryWithCustomLocation: ImmunizationInputEntry = {
  ...mockImmunizationEntry,
  administeredLocation: { display: 'Custom Ward' },
};

export const mockMedicationRequest: MedicationRequest = {
  resourceType: 'MedicationRequest',
  id: 'med-request-uuid',
  status: 'active',
  intent: 'order',
  subject: { reference: 'Patient/patient-uuid' },
  medicationReference: {
    reference: 'Medication/covid-drug-uuid',
    display: 'COVID-19 Drug',
  },
};

export const mockMedicationRequestNoMedRef: MedicationRequest = {
  resourceType: 'MedicationRequest',
  id: 'test-ref-uuid',
  status: 'active',
  intent: 'order',
  subject: { reference: 'Patient/patient-uuid' },
};

export const mockFetchedMedication: Medication = {
  resourceType: 'Medication',
  id: 'covid-drug-uuid',
  code: { coding: [{ code: 'covid-19', display: 'COVID-19 Vaccine' }] },
};

export const mockAvailableStockResponse: AvailableStockResponse = {
  count: 2,
  data: [
    {
      stockLocationName: 'Nurse Station',
      availableQuantity: 10,
      onHandQuantity: 15,
      unit: 'vial',
      batchNumber: 'BATCH-001',
      expiryDate: '2026-12-31',
    },
    {
      stockLocationName: 'Nurse Station',
      availableQuantity: 5,
      onHandQuantity: 5,
      unit: 'vial',
      batchNumber: 'BATCH-002',
      expiryDate: '2027-06-30',
    },
  ],
};

export const mockAvailableStockWithEmptyBatch: AvailableStockResponse = {
  count: 3,
  data: [
    {
      stockLocationName: 'Nurse Station',
      availableQuantity: 10,
      onHandQuantity: 10,
      unit: 'vial',
      batchNumber: 'BATCH-001',
      expiryDate: '2026-12-31',
    },
    {
      stockLocationName: 'Nurse Station',
      availableQuantity: 5,
      onHandQuantity: 5,
      unit: 'vial',
      batchNumber: '',
      expiryDate: '2027-01-01',
    },
    {
      stockLocationName: 'Nurse Station',
      availableQuantity: 3,
      onHandQuantity: 3,
      unit: 'vial',
      batchNumber: '   ',
      expiryDate: '2027-03-15',
    },
  ],
};

export const mockEmptyAvailableStockResponse: AvailableStockResponse = {
  count: 0,
  data: [],
};

export const mockVaccinationBundleWithCovid = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [{ resource: mockCovid19VaccineDrug }],
};

export const mockStore = {
  selectedImmunizations: [],
  attributes: undefined,
  addImmunization: jest.fn(),
  removeImmunization: jest.fn(),
  setAttributes: jest.fn(),
  updateAdministeredOn: jest.fn(),
  updateVaccineDrug: jest.fn(),
  updateAdministeredLocation: jest.fn(),
  updateRoute: jest.fn(),
  updateSite: jest.fn(),
  updateExpiryDate: jest.fn(),
  updateManufacturer: jest.fn(),
  updateBatchNumber: jest.fn(),
  updateStockLocation: jest.fn(),
  updateDoseSequence: jest.fn(),
  updateNote: jest.fn(),
  validateAll: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(),
};
