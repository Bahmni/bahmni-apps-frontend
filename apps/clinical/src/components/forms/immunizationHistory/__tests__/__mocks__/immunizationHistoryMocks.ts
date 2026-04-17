import { Location } from '@bahmni/services';
import { Medication, Reference } from 'fhir/r4';
import { ImmunizationConfig } from '../../../../../providers/clinicalConfig/models';
import { ImmunizationInputEntry } from '../../models';

const MEDICINE_EXTENSION_URL = 'http://fhir.openmrs.org/ext/medicine';
const MEDICINE_DRUG_NAME_EXTENSION_URL =
  'http://fhir.openmrs.org/ext/medicine#drugName';

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

export const mockImmunizationConfig = {
  vaccineConceptSetUuid: 'vaccine-concept-set-uuid',
  formFields: {
    administeredOn: { required: true },
    administeredLocation: {
      required: true,
      administeredLocationTag: 'login-location',
    },
    route: { required: false, routeConceptUuid: 'route-concept-uuid' },
    site: { required: false, siteConceptUuid: 'site-concept-uuid' },
  },
};

export const mockClinicalConfigContext = {
  clinicalConfig: {
    consultationPad: {
      immunizationConfig: mockImmunizationConfig,
    },
  },
  isLoading: false,
  error: null,
};

export const mockVaccineValueSet = {
  resourceType: 'ValueSet' as const,
  status: 'active' as const,
  expansion: {
    timestamp: '2024-01-01T00:00:00Z',
    contains: [
      { code: 'covid-19', display: 'COVID-19 Vaccine' },
      { code: 'flu', display: 'Influenza Vaccine' },
    ],
  },
};

export const mockValueSetWithPartialItem = {
  resourceType: 'ValueSet' as const,
  status: 'active' as const,
  expansion: {
    timestamp: '2024-01-01T00:00:00Z',
    contains: [{ display: 'Partial Vaccine' }],
  },
};

export const mockValueSetWithoutContains = {
  resourceType: 'ValueSet' as const,
  status: 'active' as const,
  expansion: { timestamp: '2024-01-01T00:00:00Z' },
};

export const mockRoutesValueSet = {
  resourceType: 'ValueSet' as const,
  status: 'active' as const,
  expansion: {
    timestamp: '2024-01-01T00:00:00Z',
    contains: [{ code: 'im', display: 'Intramuscular' }],
  },
};

export const mockSitesValueSet = {
  resourceType: 'ValueSet' as const,
  status: 'active' as const,
  expansion: {
    timestamp: '2024-01-01T00:00:00Z',
    contains: [{ code: 'arm', display: 'Left Arm' }],
  },
};

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
  errors: {},
  hasBeenValidated: false,
};

export const mockVaccineCode = {
  code: 'covid-19',
  display: 'COVID-19 Vaccine',
};

export const mockFullFormFields: ImmunizationConfig['formFields'] = {
  administeredOn: { required: true },
  administeredLocation: {
    required: true,
    administeredLocationTag: 'login-location',
  },
  route: { required: false, routeConceptUuid: 'route-concept-uuid' },
  site: { required: false, siteConceptUuid: 'site-concept-uuid' },
  manufacturer: { required: false },
  batchNumber: { required: false },
  expiryDate: { required: false },
};

export const mockFormFieldsAdministeredOptional: ImmunizationConfig['formFields'] =
  {
    administeredOn: { required: false },
    administeredLocation: {
      required: false,
      administeredLocationTag: 'login-location',
    },
  };

export const mockAllRequiredFormFields: ImmunizationConfig['formFields'] = {
  administeredOn: { required: true },
  administeredLocation: {
    required: true,
    administeredLocationTag: 'login-location',
  },
  route: { required: true, routeConceptUuid: 'route-concept-uuid' },
  site: { required: true, siteConceptUuid: 'site-concept-uuid' },
  expiryDate: { required: true },
  manufacturer: { required: true },
  batchNumber: { required: true },
};

export const mockImmunizationEntryWithDate: ImmunizationInputEntry = {
  ...mockImmunizationEntry,
  administeredOn: new Date('2025-01-01'),
};

export const mockImmunizationEntryWithErrors: ImmunizationInputEntry = {
  ...mockImmunizationEntry,
  errors: {
    drug: 'IMMUNIZATION_HISTORY_DRUG_CODE_REQUIRED',
    administeredOn: 'IMMUNIZATION_HISTORY_ADMINISTERED_ON_REQUIRED',
    administeredLocation: 'IMMUNIZATION_HISTORY_ADMINISTERED_LOCATION_REQUIRED',
    route: 'IMMUNIZATION_HISTORY_ROUTE_REQUIRED',
    site: 'IMMUNIZATION_HISTORY_SITE_REQUIRED',
    expiryDate: 'IMMUNIZATION_HISTORY_EXPIRY_DATE_REQUIRED',
    manufacturer: 'IMMUNIZATION_HISTORY_MANUFACTURER_REQUIRED',
    batchNumber: 'IMMUNIZATION_HISTORY_BATCH_NUMBER_REQUIRED',
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
};

export const mockStore = {
  selectedImmunizations: [],
  addImmunization: jest.fn(),
  removeImmunization: jest.fn(),
  setFormFields: jest.fn(),
  updateAdministeredOn: jest.fn(),
  updateVaccineDrug: jest.fn(),
  updateAdministeredLocation: jest.fn(),
  updateRoute: jest.fn(),
  updateSite: jest.fn(),
  updateExpiryDate: jest.fn(),
  updateManufacturer: jest.fn(),
  updateBatchNumber: jest.fn(),
  validateAll: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(),
};
