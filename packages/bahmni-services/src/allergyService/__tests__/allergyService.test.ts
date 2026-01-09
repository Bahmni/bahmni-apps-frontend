import { AllergyIntolerance, ValueSet } from 'fhir/r4';
import { get } from '../../api';
import { searchFHIRConcepts } from '../../conceptService';
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
} from '../__mocks__/mocks';
import {
  getPatientAllergiesBundle,
  getAllergies,
  formatAllergies,
  fetchAndFormatAllergenConcepts,
  fetchReactionConcepts,
} from '../allergyService';
import { ALLERGEN_TYPES, ALLERGY_REACTION } from '../constants';

// Mock the api module
jest.mock('../../api');
// Mock the concept service
jest.mock('../../conceptService');

describe('allergyService', () => {
  const mockPatientUUID = 'patient-123';
  const mockError = new Error('API Error');

  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  describe('formatAllergies', () => {
    it('should format allergy data correctly', () => {
      const result = formatAllergies([mockAllergyIntolerance]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockAllergyIntolerance.code.coding[0].code,
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

        note: [{ invalid: 'data' }] as any,
      };

      const result = formatAllergies([allergyWithMalformedNotes]);

      expect(result[0].note).toEqual([undefined]);
    });

    it('should handle undefined notes field', () => {
      // Create a copy of the allergy without the note field
      const { ...allergyWithoutNote } = mockAllergyIntoleranceWithoutNote;
      const allergyWithUndefinedNote = allergyWithoutNote as AllergyIntolerance;

      const result = formatAllergies([allergyWithUndefinedNote]);

      expect(result[0].note).toBeUndefined();
    });

    // New tests for allergy type field
    it('should handle allergy type field correctly', () => {
      const result = formatAllergies([mockAllergyWithType]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(
        mockAllergyWithType.code?.coding?.[0]?.code ?? mockAllergyWithType.id,
      );
      expect(result[0].display).toBe(mockAllergyWithType.code?.text);
    });

    it('should handle intolerance type field correctly', () => {
      const result = formatAllergies([mockIntoleranceWithType]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(
        mockIntoleranceWithType.code?.coding?.[0]?.code ??
          mockIntoleranceWithType.id,
      );
      expect(result[0].display).toBe(mockIntoleranceWithType.code?.text);
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

  describe('fetchReactionConcepts', () => {
    const mockReactionValueSet = {
      resourceType: 'ValueSet',
      id: 'reaction',
      status: 'active',
      compose: {
        include: [
          {
            concept: [
              {
                system: 'http://snomed.info/sct',
                code: 'reaction1',
                display: 'Rash',
              },
              {
                system: 'http://snomed.info/sct',
                code: 'reaction2',
                display: 'Hives',
              },
            ],
          },
        ],
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (searchFHIRConcepts as jest.Mock).mockResolvedValue(mockReactionValueSet);
    });

    it('should fetch and return reaction concepts', async () => {
      const result = await fetchReactionConcepts();

      expect(searchFHIRConcepts).toHaveBeenCalledWith(ALLERGY_REACTION.code);
      expect(result).toEqual(mockReactionValueSet.compose.include[0].concept);
    });

    it('should handle empty concept array', async () => {
      const emptyValueSet = {
        ...mockReactionValueSet,
        compose: {
          include: [{ concept: [] }],
        },
      };
      (searchFHIRConcepts as jest.Mock).mockResolvedValue(emptyValueSet);

      const result = await fetchReactionConcepts();

      expect(result).toEqual([]);
    });

    it('should handle missing concept array', async () => {
      const noConceptValueSet = {
        ...mockReactionValueSet,
        compose: {
          include: [{}],
        },
      };
      (searchFHIRConcepts as jest.Mock).mockResolvedValue(noConceptValueSet);

      const result = await fetchReactionConcepts();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch reactions');
      (searchFHIRConcepts as jest.Mock).mockRejectedValue(error);

      await expect(fetchReactionConcepts()).rejects.toThrow(
        'Failed to fetch reactions',
      );
    });
  });

  describe('fetchAndFormatAllergenConcepts', () => {
    const mockMedicationValueSet = {
      resourceType: 'ValueSet',
      id: ALLERGEN_TYPES.MEDICATION.code,
      status: 'active',
      expansion: {
        contains: [
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
    };

    const mockFoodValueSet = {
      resourceType: 'ValueSet',
      id: ALLERGEN_TYPES.FOOD.code,
      status: 'active',
      expansion: {
        contains: [
          {
            system: 'http://snomed.info/sct',
            code: 'food1',
            display: 'Food 1',
          },
        ],
      },
    };

    const mockEnvironmentValueSet = {
      resourceType: 'ValueSet',
      id: ALLERGEN_TYPES.ENVIRONMENT.code,
      status: 'active',
      expansion: {
        contains: [
          {
            system: 'http://snomed.info/sct',
            code: 'env1',
            display: 'Environment 1',
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

    it('should filter out concepts with inactive: true', async () => {
      const mockMedicationValueSetWithInactive = {
        resourceType: 'ValueSet',
        id: ALLERGEN_TYPES.MEDICATION.code,
        status: 'active',
        expansion: {
          contains: [
            {
              system: 'http://snomed.info/sct',
              code: 'med1',
              display: 'Active Medication 1',
            },
            {
              system: 'http://snomed.info/sct',
              code: 'med2',
              display: 'Inactive Medication 2',
              inactive: true,
            },
            {
              system: 'http://snomed.info/sct',
              code: 'med3',
              display: 'Active Medication 3',
              inactive: false,
            },
          ],
        },
      };

      (searchFHIRConcepts as jest.Mock).mockImplementation((uuid) => {
        if (uuid === ALLERGEN_TYPES.MEDICATION.code)
          return Promise.resolve(mockMedicationValueSetWithInactive);
        if (uuid === ALLERGEN_TYPES.FOOD.code)
          return Promise.resolve(mockFoodValueSet);
        if (uuid === ALLERGEN_TYPES.ENVIRONMENT.code)
          return Promise.resolve(mockEnvironmentValueSet);
        return Promise.reject(new Error('Unknown UUID'));
      });

      const result = await fetchAndFormatAllergenConcepts();

      // Should filter out the inactive concept
      expect(result).toHaveLength(4); // med1, med3, food1, env1
      expect(result.map((r) => r.uuid)).toContain('med1');
      expect(result.map((r) => r.uuid)).toContain('med3');
      expect(result.map((r) => r.uuid)).not.toContain('med2'); // filtered out
      expect(result.map((r) => r.uuid)).toContain('food1');
      expect(result.map((r) => r.uuid)).toContain('env1');
    });

    it('should keep concepts with inactive: false and without inactive property', async () => {
      const mockFoodValueSetWithMixed = {
        resourceType: 'ValueSet',
        id: ALLERGEN_TYPES.FOOD.code,
        status: 'active',
        expansion: {
          contains: [
            {
              system: 'http://snomed.info/sct',
              code: 'food1',
              display: 'Food Without Inactive Property',
            },
            {
              system: 'http://snomed.info/sct',
              code: 'food2',
              display: 'Food With Inactive False',
              inactive: false,
            },
          ],
        },
      };

      (searchFHIRConcepts as jest.Mock).mockImplementation((uuid) => {
        if (uuid === ALLERGEN_TYPES.MEDICATION.code)
          return Promise.resolve(mockMedicationValueSet);
        if (uuid === ALLERGEN_TYPES.FOOD.code)
          return Promise.resolve(mockFoodValueSetWithMixed);
        if (uuid === ALLERGEN_TYPES.ENVIRONMENT.code)
          return Promise.resolve(mockEnvironmentValueSet);
        return Promise.reject(new Error('Unknown UUID'));
      });

      const result = await fetchAndFormatAllergenConcepts();

      expect(result).toHaveLength(5); // med1, med2, food1, food2, env1
      expect(result.map((r) => r.uuid)).toContain('food1');
      expect(result.map((r) => r.uuid)).toContain('food2');
    });

    it('should handle all concepts being inactive', async () => {
      const mockEnvironmentValueSetAllInactive = {
        resourceType: 'ValueSet',
        id: ALLERGEN_TYPES.ENVIRONMENT.code,
        status: 'active',
        expansion: {
          contains: [
            {
              system: 'http://snomed.info/sct',
              code: 'env1',
              display: 'Inactive Environment 1',
              inactive: true,
            },
            {
              system: 'http://snomed.info/sct',
              code: 'env2',
              display: 'Inactive Environment 2',
              inactive: true,
            },
          ],
        },
      };

      (searchFHIRConcepts as jest.Mock).mockImplementation((uuid) => {
        if (uuid === ALLERGEN_TYPES.MEDICATION.code)
          return Promise.resolve(mockMedicationValueSet);
        if (uuid === ALLERGEN_TYPES.FOOD.code)
          return Promise.resolve(mockFoodValueSet);
        if (uuid === ALLERGEN_TYPES.ENVIRONMENT.code)
          return Promise.resolve(mockEnvironmentValueSetAllInactive);
        return Promise.reject(new Error('Unknown UUID'));
      });

      const result = await fetchAndFormatAllergenConcepts();

      expect(result).toHaveLength(3); // med1, med2, food1 only
      expect(result.map((r) => r.uuid)).not.toContain('env1');
      expect(result.map((r) => r.uuid)).not.toContain('env2');
    });

    it('should handle ValueSets with missing or empty expansion/contains arrays', async () => {
      const emptyValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'empty',
        status: 'active',
        expansion: {
          timestamp: '2025-06-10T04:02:11+00:00',
          contains: [],
        },
      };

      const noExpansionValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'noExpansion',
        status: 'active',
      };

      (searchFHIRConcepts as jest.Mock).mockImplementation((uuid) => {
        if (uuid === ALLERGEN_TYPES.MEDICATION.code)
          return Promise.resolve(emptyValueSet);
        if (uuid === ALLERGEN_TYPES.FOOD.code)
          return Promise.resolve(noExpansionValueSet);
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

    it('should handle concepts with missing code and display properties', async () => {
      const mockMedicationValueSetWithMissingProps = {
        resourceType: 'ValueSet',
        id: ALLERGEN_TYPES.MEDICATION.code,
        status: 'active',
        expansion: {
          contains: [
            {
              system: 'http://snomed.info/sct',
              // Missing code and display properties
            },
            {
              system: 'http://snomed.info/sct',
              code: null,
              display: null,
            },
            {
              system: 'http://snomed.info/sct',
              code: undefined,
              display: undefined,
            },
          ],
        },
      };

      (searchFHIRConcepts as jest.Mock).mockImplementation((uuid) => {
        if (uuid === ALLERGEN_TYPES.MEDICATION.code)
          return Promise.resolve(mockMedicationValueSetWithMissingProps);
        if (uuid === ALLERGEN_TYPES.FOOD.code)
          return Promise.resolve(mockFoodValueSet);
        if (uuid === ALLERGEN_TYPES.ENVIRONMENT.code)
          return Promise.resolve(mockEnvironmentValueSet);
        return Promise.reject(new Error('Unknown UUID'));
      });

      const result = await fetchAndFormatAllergenConcepts();

      // Should handle missing code/display by using empty strings
      expect(result).toHaveLength(5); // 3 from medication (with empty strings) + 1 food + 1 env

      // Check that concepts with missing properties get empty string fallbacks
      const medicationConcepts = result.filter((c) => c.type === 'medication');
      expect(medicationConcepts).toHaveLength(3);
      medicationConcepts.forEach((concept) => {
        expect(concept.uuid).toBe('');
        expect(concept.display).toBe('');
        expect(concept.type).toBe('medication');
      });
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API error');
      (searchFHIRConcepts as jest.Mock).mockRejectedValue(mockError);

      await expect(fetchAndFormatAllergenConcepts()).rejects.toThrow(mockError);
    });
  });
});
