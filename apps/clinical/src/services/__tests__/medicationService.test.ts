import { Bundle, Medication } from 'fhir/r4';
import {
  MEDICATION_ORDERS_METADATA_URL,
  MEDICATIONS_SEARCH_URL,
} from '../../constants/app';
import {
  FHIR_MEDICATION_EXTENSION_URL,
  FHIR_MEDICATION_NAME_EXTENSION_URL,
} from '../../constants/fhir';
import { MedicationOrdersMetadataResponse } from '../../models/medicationConfig';
import { get } from '@bahmni-frontend/bahmni-services';
import {
  fetchMedicationOrdersMetadata,
  searchMedications,
  getMedicationDisplay,
} from '../medicationService';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  get: jest.fn(),
}));

describe('MedicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch medication orders metadata', async () => {
    const mockResponse: MedicationOrdersMetadataResponse = {
      doseUnits: [
        { name: 'Tablet(s)', uuid: 'doseunit-uuid-1' },
        { name: 'ml', uuid: 'doseunit-uuid-2' },
      ],
      routes: [
        { name: 'Oral', uuid: 'route-uuid-1' },
        { name: 'Intravenous', uuid: 'route-uuid-2' },
      ],
      durationUnits: [
        { name: 'Day(s)', uuid: 'duration-uuid-1' },
        { name: 'Week(s)', uuid: 'duration-uuid-2' },
      ],
      dispensingUnits: [
        { name: 'Tablet(s)', uuid: 'dispensing-uuid-1' },
        { name: 'Bottle(s)', uuid: 'dispensing-uuid-2' },
      ],
      dosingRules: ['Rule 1', 'Rule 2'],
      dosingInstructions: [
        { name: 'As directed', uuid: 'instruction-uuid-1' },
        { name: 'Before meals', uuid: 'instruction-uuid-2' },
      ],
      orderAttributes: [
        {
          uuid: 'attr-uuid-1',
          name: 'Strength',
          dataType: 'Text',
          shortName: 'strength',
          units: 'mg',
          conceptClass: 'Misc',
          hiNormal: null,
          lowNormal: null,
          set: false,
        },
      ],
      frequencies: [
        { name: 'Once a day', uuid: 'freq-uuid-1', frequencyPerDay: 1 },
        { name: 'Twice a day', uuid: 'freq-uuid-2', frequencyPerDay: 2 },
      ],
    };
    (get as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchMedicationOrdersMetadata();

    expect(get).toHaveBeenCalledWith(MEDICATION_ORDERS_METADATA_URL);
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error when fetching medication orders metadata fails', async () => {
    const mockError = new Error('Network error');
    (get as jest.Mock).mockRejectedValue(mockError);

    await expect(fetchMedicationOrdersMetadata()).rejects.toThrow(
      'Network error',
    );
    expect(get).toHaveBeenCalledWith(MEDICATION_ORDERS_METADATA_URL);
  });

  describe('searchMedications', () => {
    it('should search medications with default count', async () => {
      const searchTerm = 'Paracetamol';
      const mockResponse: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 2,
        entry: [
          {
            resource: {
              resourceType: 'Medication',
              id: 'med-1',
              code: {
                coding: [
                  {
                    system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                    code: '161',
                    display: 'Paracetamol 500mg',
                  },
                ],
              },
            },
          },
          {
            resource: {
              resourceType: 'Medication',
              id: 'med-2',
              code: {
                coding: [
                  {
                    system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                    code: '162',
                    display: 'Paracetamol 650mg',
                  },
                ],
              },
            },
          },
        ],
      };

      (get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchMedications(searchTerm);

      expect(get).toHaveBeenCalledWith(MEDICATIONS_SEARCH_URL(searchTerm, 20));
      expect(result).toEqual(mockResponse);
    });

    it('should search medications with custom count', async () => {
      const searchTerm = 'Aspirin';
      const count = 50;
      const mockResponse: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [
          {
            resource: {
              resourceType: 'Medication',
              id: 'med-3',
              code: {
                coding: [
                  {
                    system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                    code: '1191',
                    display: 'Aspirin',
                  },
                ],
              },
            },
          },
        ],
      };

      (get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchMedications(searchTerm, count);

      expect(get).toHaveBeenCalledWith(
        MEDICATIONS_SEARCH_URL(searchTerm, count),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when searching medications fails', async () => {
      const searchTerm = 'InvalidMed';
      const mockError = new Error('Search failed');
      (get as jest.Mock).mockRejectedValue(mockError);

      await expect(searchMedications(searchTerm)).rejects.toThrow(
        'Search failed',
      );
      expect(get).toHaveBeenCalledWith(MEDICATIONS_SEARCH_URL(searchTerm, 20));
    });
  });

  describe('getMedicationDisplay', () => {
    it('should return medication display name with form', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
        extension: [
          {
            url: FHIR_MEDICATION_EXTENSION_URL,
            extension: [
              {
                url: FHIR_MEDICATION_NAME_EXTENSION_URL,
                valueString: 'Paracetamol',
              },
            ],
          },
        ],
        form: {
          text: 'Tablet',
        },
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Paracetamol (Tablet)');
    });

    it('should return medication display name without form', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-2',
        extension: [
          {
            url: FHIR_MEDICATION_EXTENSION_URL,
            extension: [
              {
                url: FHIR_MEDICATION_NAME_EXTENSION_URL,
                valueString: 'Aspirin',
              },
            ],
          },
        ],
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Aspirin');
    });

    it('should return "Unknown Medication Name" when no drug name extension is found', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-3',
        form: {
          text: 'Syrup',
        },
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Unknown Medication Name');
    });

    it('should return "Unknown Medication Name" when extension is missing', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-4',
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Unknown Medication Name');
    });

    it('should handle medication with wrong extension URL', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-5',
        extension: [
          {
            url: 'http://wrong.url',
            extension: [
              {
                url: FHIR_MEDICATION_NAME_EXTENSION_URL,
                valueString: 'SomeMed',
              },
            ],
          },
        ],
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Unknown Medication Name');
    });

    it('should handle medication with nested extension but wrong drug name URL', () => {
      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-6',
        extension: [
          {
            url: FHIR_MEDICATION_EXTENSION_URL,
            extension: [
              {
                url: 'http://wrong.drug.name.url',
                valueString: 'SomeMed',
              },
            ],
          },
        ],
      };

      const result = getMedicationDisplay(medication);

      expect(result).toBe('Unknown Medication Name');
    });
  });
});
