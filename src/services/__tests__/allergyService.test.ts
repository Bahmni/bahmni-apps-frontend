import { get } from '../api';
import {
  getPatientAllergiesBundle,
  getAllergies,
  formatAllergies,
  formatAllergenConcepts,
  fetchAndFormatAllergenConcepts,
} from '../allergyService';
import { FhirAllergyIntolerance } from '@/types/allergy';
import {
  mockAllergyIntolerance,
  mockAllergyIntoleranceBundle,
  mockEmptyAllergyIntoleranceBundle,
  mockAllergyWithMissingFields,
  mockAllergyWithEmptyReactions,
  mockAllergyIntoleranceWithoutNote,
  mockAllergyWithoutClinicalStatusDisplay,
  mockAllergyWithMultipleNotes,
  mockAllergyWithEmptyNotes,
  mockAllergyWithType,
  mockIntoleranceWithType,
  mockAllergyWithMultipleCategories,
  mockAllergyWithHighCriticality,
  mockAllergyWithLowCriticality,
  mockInactiveAllergy,
  mockAllergyWithMultipleSeverities,
  mockBundleWithInvalidEntry,
  mockAllergyWithInvalidCoding,
} from '@__mocks__/allergyMocks';
import notificationService from '../notificationService';
import { getFormattedError } from '@utils/common';
import { searchFHIRConcepts } from '../conceptService';
import { ALLERGEN_TYPES } from '@constants/concepts';
import { ValueSet } from 'fhir/r4';

// Mock the api module
jest.mock('../api');
// Mock the notification service
jest.mock('../notificationService');
// Mock the common utils
jest.mock('@utils/common');
// Mock the concept service
jest.mock('../conceptService');

describe('allergyService', () => {
  const mockPatientUUID = 'patient-123';
  const mockError = new Error('API Error');
  const mockFormattedError = {
    title: 'Error',
    message: 'Something went wrong',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getFormattedError as jest.Mock).mockReturnValue(mockFormattedError);
  });

  describe('getPatientAllergiesBundle', () => {
    it('should fetch allergy bundle successfully', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockAllergyIntoleranceBundle);

      const result = await getPatientAllergiesBundle(mockPatientUUID);

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining(mockPatientUUID),
      );
      expect(result).toEqual(mockAllergyIntoleranceBundle);
    });

    it('should throw error when API call fails', async () => {
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(getPatientAllergiesBundle(mockPatientUUID)).rejects.toThrow(
        mockError,
      );
    });
  });

  describe('getAllergies', () => {
    it('should return transformed allergy array', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockAllergyIntoleranceBundle);

      const result = await getAllergies(mockPatientUUID);

      expect(result).toEqual([mockAllergyIntolerance]);
    });

    it('should handle empty bundle', async () => {
      (get as jest.Mock).mockResolvedValueOnce(
        mockEmptyAllergyIntoleranceBundle,
      );

      const result = await getAllergies(mockPatientUUID);

      expect(result).toEqual([]);
    });

    it('should handle API errors and show notification', async () => {
      (get as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await getAllergies(mockPatientUUID);

      expect(getFormattedError).toHaveBeenCalledWith(mockError);
      expect(notificationService.showError).toHaveBeenCalledWith(
        mockFormattedError.title,
        mockFormattedError.message,
      );
      expect(result).toEqual([]);
    });
  });

  describe('formatAllergies', () => {
    it('should format allergy data correctly', () => {
      const result = formatAllergies([mockAllergyIntolerance]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockAllergyIntolerance.id,
        display: mockAllergyIntolerance.code.text,
        category: mockAllergyIntolerance.category,
        criticality: mockAllergyIntolerance.criticality,
        status: mockAllergyIntolerance.clinicalStatus.coding[0].display,
        recordedDate: mockAllergyIntolerance.recordedDate,
        recorder: mockAllergyIntolerance.recorder?.display,
        reactions: [
          {
            manifestation: [
              mockAllergyIntolerance.reaction?.[0].manifestation[0].coding[0]
                .display,
            ],
            severity: mockAllergyIntolerance.reaction?.[0].severity,
          },
        ],
        severity: mockAllergyIntolerance.reaction?.[0].severity,
        note: mockAllergyIntolerance.note?.map((note) => note.text),
      });
    });

    it('should handle missing optional fields', () => {
      const result = formatAllergies([mockAllergyWithMissingFields]);

      expect(result).toHaveLength(1);
      expect(result[0].recorder).toBeUndefined();
      expect(result[0].reactions).toBeUndefined();
      expect(result[0].note).toBeUndefined();
    });

    it('should handle empty reactions array', () => {
      const result = formatAllergies([mockAllergyWithEmptyReactions]);

      expect(result).toHaveLength(1);
      expect(result[0].reactions).toEqual([]);
    });

    it('should use clinical status display when available', () => {
      const result = formatAllergies([mockAllergyIntolerance]);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Active');
    });

    it('should fallback to Unknown when clinical status display is missing', () => {
      const result = formatAllergies([mockAllergyWithoutClinicalStatusDisplay]);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Unknown');
    });

    it('should format notes correctly when present', () => {
      const result = formatAllergies([mockAllergyIntolerance]);

      expect(result[0].note).toEqual([
        'Patient experiences severe reaction within minutes of exposure',
        'Requires immediate medical attention if exposed',
      ]);
    });

    it('should handle multiple notes and preserve order', () => {
      const result = formatAllergies([mockAllergyWithMultipleNotes]);

      expect(result[0].note).toEqual([
        'First documented reaction at age 5',
        'Carries epinephrine auto-injector',
        'Family history of similar allergies',
      ]);
      expect(result[0].note?.length).toBe(3);
      expect(result[0].note?.[0]).toBe('First documented reaction at age 5');
      expect(result[0].note?.[2]).toBe('Family history of similar allergies');
    });

    it('should handle empty notes array', () => {
      const result = formatAllergies([mockAllergyWithEmptyNotes]);

      expect(result[0].note).toEqual([]);
    });

    it('should handle malformed notes data', () => {
      const allergyWithMalformedNotes = {
        ...mockAllergyIntolerance,
        /* eslint-disable @typescript-eslint/no-explicit-any */
        note: [{ invalid: 'data' }] as any,
      };

      const result = formatAllergies([allergyWithMalformedNotes]);

      expect(result[0].note).toEqual([undefined]);
    });

    it('should handle undefined notes field', () => {
      // Create a copy of the allergy without the note field
      const { ...allergyWithoutNote } = mockAllergyIntoleranceWithoutNote;
      const allergyWithUndefinedNote =
        allergyWithoutNote as FhirAllergyIntolerance;

      const result = formatAllergies([allergyWithUndefinedNote]);

      expect(result[0].note).toBeUndefined();
    });

    it('should handle errors and show notification', () => {
      // Mock an error by passing invalid data
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const mockInvalidData = {} as any;

      const result = formatAllergies([mockInvalidData]);

      expect(getFormattedError).toHaveBeenCalled();
      expect(notificationService.showError).toHaveBeenCalledWith(
        mockFormattedError.title,
        mockFormattedError.message,
      );
      expect(result).toEqual([]);
    });

    // New tests for allergy type field
    it('should handle allergy type field correctly', () => {
      const result = formatAllergies([mockAllergyWithType]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockAllergyWithType.id);
      expect(result[0].display).toBe(mockAllergyWithType.code.text);
    });

    it('should handle intolerance type field correctly', () => {
      const result = formatAllergies([mockIntoleranceWithType]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockIntoleranceWithType.id);
      expect(result[0].display).toBe(mockIntoleranceWithType.code.text);
    });

    // Tests for multiple categories
    it('should handle multiple categories correctly', () => {
      const result = formatAllergies([mockAllergyWithMultipleCategories]);

      expect(result).toHaveLength(1);
      expect(result[0].category).toEqual(['food', 'medication', 'environment']);
      expect(result[0].category?.length).toBe(3);
    });

    // Tests for criticality levels
    it('should handle high criticality correctly', () => {
      const result = formatAllergies([mockAllergyWithHighCriticality]);

      expect(result).toHaveLength(1);
      expect(result[0].criticality).toBe('high');
    });

    it('should handle low criticality correctly', () => {
      const result = formatAllergies([mockAllergyWithLowCriticality]);

      expect(result).toHaveLength(1);
      expect(result[0].criticality).toBe('low');
    });

    // Tests for inactive status
    it('should handle inactive status correctly', () => {
      const result = formatAllergies([mockInactiveAllergy]);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Inactive');
    });

    // Tests for multiple reactions with different severities
    it('should handle multiple reactions with different severities correctly', () => {
      const result = formatAllergies([mockAllergyWithMultipleSeverities]);

      expect(result).toHaveLength(1);
      expect(result[0].reactions?.length).toBe(3);
      expect(result[0].reactions?.[0].severity).toBe('mild');
      expect(result[0].reactions?.[1].severity).toBe('severe');
      expect(result[0].reactions?.[2].severity).toBe('severe');

      // Check manifestations
      expect(result[0].reactions?.[0].manifestation).toContain('Hives');
      expect(result[0].reactions?.[1].manifestation).toContain(
        'Difficulty breathing',
      );
      expect(result[0].reactions?.[2].manifestation).toContain('Anaphylaxis');
    });

    it('should handle bundle with invalid entry structure', async () => {
      (get as jest.Mock).mockResolvedValueOnce(mockBundleWithInvalidEntry);

      const result = await getAllergies(mockPatientUUID);

      expect(result).toHaveLength(1);
      // The resource should still be extracted even with missing fullUrl
      expect(result[0].id).toBe('incomplete-resource');
    });

    it('should handle allergy with invalid coding array', () => {
      const result = formatAllergies([mockAllergyWithInvalidCoding]);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Unknown');
      expect(result[0].display).toBe('Allergy with invalid coding');
    });
  });

  describe('formatAllergenConcepts', () => {
    it('should format FHIR concepts into AllergenConcepts with type information', () => {
      const mockRawConcepts = {
        medication: [
          {
            system: 'http://snomed.info/sct',
            code: 'med1',
            display: 'Medication 1',
          },
          {
            system: 'http://snomed.info/sct',
            code: 'med2',
            display: 'Medication 2',
          },
        ],
        food: [
          {
            system: 'http://snomed.info/sct',
            code: 'food1',
            display: 'Food 1',
          },
        ],
        environment: [
          {
            system: 'http://snomed.info/sct',
            code: 'env1',
            display: 'Environment 1',
          },
        ],
      };

      const result = formatAllergenConcepts(mockRawConcepts);

      expect(result).toHaveLength(4);
      expect(result).toEqual(
        expect.arrayContaining([
          { uuid: 'med1', display: 'Medication 1', type: 'medication' },
          { uuid: 'med2', display: 'Medication 2', type: 'medication' },
          { uuid: 'food1', display: 'Food 1', type: 'food' },
          { uuid: 'env1', display: 'Environment 1', type: 'environment' },
        ]),
      );
    });

    it('should handle empty or undefined concept arrays', () => {
      const mockRawConcepts = {
        medication: [],
        food: undefined,
        environment: [
          {
            system: 'http://snomed.info/sct',
            code: 'env1',
            display: 'Environment 1',
          },
        ],
      };

      const result = formatAllergenConcepts(mockRawConcepts);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        uuid: 'env1',
        display: 'Environment 1',
        type: 'environment',
      });
    });

    it('should handle all undefined arrays', () => {
      const mockRawConcepts = {
        medication: undefined,
        food: undefined,
        environment: undefined,
      };

      const result = formatAllergenConcepts(mockRawConcepts);

      expect(result).toHaveLength(0);
    });

    it('should handle concepts with undefined code and display', () => {
      const mockRawConcepts = {
        medication: [
          { system: 'http://snomed.info/sct' },
          { system: 'http://snomed.info/sct', code: 'med2' },
          { system: 'http://snomed.info/sct', display: 'Medication 3' },
        ],
      };

      const result = formatAllergenConcepts(mockRawConcepts);

      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          { uuid: '', display: '', type: 'medication' },
          { uuid: 'med2', display: '', type: 'medication' },
          { uuid: '', display: 'Medication 3', type: 'medication' },
        ]),
      );
    });
  });

  describe('fetchAndFormatAllergenConcepts', () => {
    const mockMedicationValueSet = {
      resourceType: 'ValueSet',
      id: ALLERGEN_TYPES.MEDICATION.code,
      status: 'active',
      compose: {
        include: [
          {
            concept: [
              {
                system: 'http://snomed.info/sct',
                code: 'med1',
                display: 'Medication 1',
              },
              {
                system: 'http://snomed.info/sct',
                code: 'med2',
                display: 'Medication 2',
              },
            ],
          },
        ],
      },
    };

    const mockFoodValueSet = {
      resourceType: 'ValueSet',
      id: ALLERGEN_TYPES.FOOD.code,
      status: 'active',
      compose: {
        include: [
          {
            concept: [
              {
                system: 'http://snomed.info/sct',
                code: 'food1',
                display: 'Food 1',
              },
            ],
          },
        ],
      },
    };

    const mockEnvironmentValueSet = {
      resourceType: 'ValueSet',
      id: ALLERGEN_TYPES.ENVIRONMENT.code,
      status: 'active',
      compose: {
        include: [
          {
            concept: [
              {
                system: 'http://snomed.info/sct',
                code: 'env1',
                display: 'Environment 1',
              },
            ],
          },
        ],
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (searchFHIRConcepts as jest.Mock).mockImplementation((uuid) => {
        if (uuid === ALLERGEN_TYPES.MEDICATION.code)
          return Promise.resolve(mockMedicationValueSet);
        if (uuid === ALLERGEN_TYPES.FOOD.code)
          return Promise.resolve(mockFoodValueSet);
        if (uuid === ALLERGEN_TYPES.ENVIRONMENT.code)
          return Promise.resolve(mockEnvironmentValueSet);
        return Promise.reject(new Error('Unknown UUID'));
      });
    });

    it('should fetch ValueSets for each allergen type and format the concepts', async () => {
      const result = await fetchAndFormatAllergenConcepts();

      expect(searchFHIRConcepts).toHaveBeenCalledTimes(3);
      expect(searchFHIRConcepts).toHaveBeenCalledWith(
        ALLERGEN_TYPES.MEDICATION.code,
      );
      expect(searchFHIRConcepts).toHaveBeenCalledWith(ALLERGEN_TYPES.FOOD.code);
      expect(searchFHIRConcepts).toHaveBeenCalledWith(
        ALLERGEN_TYPES.ENVIRONMENT.code,
      );

      expect(result).toHaveLength(4);
      expect(result).toEqual(
        expect.arrayContaining([
          { uuid: 'med1', display: 'Medication 1', type: 'medication' },
          { uuid: 'med2', display: 'Medication 2', type: 'medication' },
          { uuid: 'food1', display: 'Food 1', type: 'food' },
          { uuid: 'env1', display: 'Environment 1', type: 'environment' },
        ]),
      );
    });

    it('should handle ValueSets with missing or empty include/concept arrays', async () => {
      const emptyValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'empty',
        status: 'active',
        compose: { include: [] },
      };

      const noConceptsValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'noConcepts',
        status: 'active',
        compose: { include: [{ concept: [] }] },
      };

      (searchFHIRConcepts as jest.Mock).mockImplementation((uuid) => {
        if (uuid === ALLERGEN_TYPES.MEDICATION.code)
          return Promise.resolve(emptyValueSet);
        if (uuid === ALLERGEN_TYPES.FOOD.code)
          return Promise.resolve(noConceptsValueSet);
        if (uuid === ALLERGEN_TYPES.ENVIRONMENT.code)
          return Promise.resolve(mockEnvironmentValueSet);
        return Promise.reject(new Error('Unknown UUID'));
      });

      const result = await fetchAndFormatAllergenConcepts();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        uuid: 'env1',
        display: 'Environment 1',
        type: 'environment',
      });
    });

    it('should handle ValueSets with undefined include[0]', async () => {
      const valueSetWithUndefinedInclude = {
        resourceType: 'ValueSet',
        id: 'undefined-include',
        status: 'active',
        compose: {
          include: [undefined],
        },
      };

      (searchFHIRConcepts as jest.Mock).mockImplementation((uuid) => {
        if (uuid === ALLERGEN_TYPES.MEDICATION.code)
          return Promise.resolve(valueSetWithUndefinedInclude);
        if (uuid === ALLERGEN_TYPES.FOOD.code)
          return Promise.resolve(valueSetWithUndefinedInclude);
        if (uuid === ALLERGEN_TYPES.ENVIRONMENT.code)
          return Promise.resolve(mockEnvironmentValueSet);
        return Promise.reject(new Error('Unknown UUID'));
      });

      const result = await fetchAndFormatAllergenConcepts();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        uuid: 'env1',
        display: 'Environment 1',
        type: 'environment',
      });
    });

    it('should handle environment ValueSet with undefined concept', async () => {
      const mockEnvironmentValueSetWithoutConcept = {
        resourceType: 'ValueSet',
        id: ALLERGEN_TYPES.ENVIRONMENT.code,
        status: 'active',
        compose: {
          include: [{}], // include[0].concept is undefined
        },
      };

      (searchFHIRConcepts as jest.Mock).mockImplementation((uuid) => {
        if (uuid === ALLERGEN_TYPES.MEDICATION.code)
          return Promise.resolve(mockMedicationValueSet);
        if (uuid === ALLERGEN_TYPES.FOOD.code)
          return Promise.resolve(mockFoodValueSet);
        if (uuid === ALLERGEN_TYPES.ENVIRONMENT.code)
          return Promise.resolve(mockEnvironmentValueSetWithoutConcept);
        return Promise.reject(new Error('Unknown UUID'));
      });

      const result = await fetchAndFormatAllergenConcepts();

      // Should still get medication and food concepts
      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([
          { uuid: 'med1', display: 'Medication 1', type: 'medication' },
          { uuid: 'med2', display: 'Medication 2', type: 'medication' },
          { uuid: 'food1', display: 'Food 1', type: 'food' },
        ]),
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API error');
      (searchFHIRConcepts as jest.Mock).mockRejectedValue(mockError);

      await expect(fetchAndFormatAllergenConcepts()).rejects.toThrow(mockError);
    });
  });
});
