import { get } from '../api';
import {
  getPatientAllergiesBundle,
  getAllergies,
  formatAllergies,
} from '../allergyService';
import { FhirAllergyIntolerance } from '@types/allergy';
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
} from '@__mocks__/allergyMocks';
import notificationService from '../notificationService';
import { getFormattedError } from '@utils/common';

// Mock the api module
jest.mock('../api');
// Mock the notification service
jest.mock('../notificationService');
// Mock the common utils
jest.mock('@utils/common');

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
  });
});
