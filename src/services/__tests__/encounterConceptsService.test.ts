import { get } from '../api';
import { getEncounterConcepts } from '../encounterConceptsService';
import { ENCOUNTER_CONCEPTS_URL } from '@constants/app';
import { getFormattedError } from '@utils/common';
import notificationService from '../notificationService';
import {
  EncounterConceptsResponse,
  EncounterConcepts,
} from '@types/encounterConcepts';

// Mock dependencies
jest.mock('../api');
jest.mock('@utils/common', () => ({
  getFormattedError: jest.fn(),
}));
jest.mock('../notificationService', () => ({
  showError: jest.fn(),
  default: { showError: jest.fn() },
}));

// Type the mocked functions
const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockedNotificationService = notificationService as jest.Mocked<
  typeof notificationService
>;

describe('encounterConceptsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should transform and return encounter concepts when API call succeeds', async () => {
      // Arrange
      const mockResponse: EncounterConceptsResponse = {
        visitTypes: {
          EMERGENCY: '493ebb53-b2bd-4ced-b444-e0965804d771',
          OPD: '54f43754-c6ce-4472-890e-0f28acaeaea6',
        },
        encounterTypes: {
          DISCHARGE: 'd37e03e0-5e07-11ef-8f7c-0242ac120002',
          ADMISSION: 'd3785931-5e07-11ef-8f7c-0242ac120002',
        },
        orderTypes: {
          'Lab Order': 'd3560b17-5e07-11ef-8f7c-0242ac120002',
          'Test Order': '52a447d3-a64a-11e3-9aeb-50e549534c5e',
        },
        conceptData: {},
      };

      const expectedResult: EncounterConcepts = {
        visitTypes: [
          { name: 'EMERGENCY', uuid: '493ebb53-b2bd-4ced-b444-e0965804d771' },
          { name: 'OPD', uuid: '54f43754-c6ce-4472-890e-0f28acaeaea6' },
        ],
        encounterTypes: [
          { name: 'DISCHARGE', uuid: 'd37e03e0-5e07-11ef-8f7c-0242ac120002' },
          { name: 'ADMISSION', uuid: 'd3785931-5e07-11ef-8f7c-0242ac120002' },
        ],
        orderTypes: [
          { name: 'Lab Order', uuid: 'd3560b17-5e07-11ef-8f7c-0242ac120002' },
          { name: 'Test Order', uuid: '52a447d3-a64a-11e3-9aeb-50e549534c5e' },
        ],
        conceptData: [],
      };

      mockedGet.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getEncounterConcepts();

      // Assert
      expect(mockedGet).toHaveBeenCalledWith(ENCOUNTER_CONCEPTS_URL);
      expect(result).toEqual(expectedResult);
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should propagate errors from API calls', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockedGet.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(getEncounterConcepts()).rejects.toThrow('Network error');
      expect(mockedGet).toHaveBeenCalledWith(ENCOUNTER_CONCEPTS_URL);
    });

    it('should handle server errors properly', async () => {
      // Arrange
      const serverError = new Error('Internal Server Error');
      serverError.name = 'ServerError';
      mockedGet.mockRejectedValueOnce(serverError);

      // Act & Assert
      await expect(getEncounterConcepts()).rejects.toThrow(
        'Internal Server Error',
      );
    });
  });

  // Edge Case Tests
  describe('Edge Cases', () => {
    it('should handle missing visitTypes in response', async () => {
      // Arrange
      const mockResponse = {
        encounterTypes: {},
        orderTypes: {},
        conceptData: {},
      };
      mockedGet.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getEncounterConcepts();

      // Assert
      expect(result.visitTypes).toEqual([]);
    });

    it('should handle missing encounterTypes in response', async () => {
      // Arrange
      const mockResponse = {
        visitTypes: {},
        orderTypes: {},
        conceptData: {},
      };
      mockedGet.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getEncounterConcepts();

      // Assert
      expect(result.encounterTypes).toEqual([]);
    });

    it('should handle missing orderTypes in response', async () => {
      // Arrange
      const mockResponse = {
        visitTypes: {},
        encounterTypes: {},
        conceptData: {},
      };
      mockedGet.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getEncounterConcepts();

      // Assert
      expect(result.orderTypes).toEqual([]);
    });

    it('should handle missing conceptData in response', async () => {
      // Arrange
      const mockResponse = {
        visitTypes: {},
        encounterTypes: {},
        orderTypes: {},
      };
      mockedGet.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getEncounterConcepts();

      // Assert
      expect(result.conceptData).toEqual([]);
    });

    it('should handle unexpected response structure', async () => {
      // Arrange - Response without the expected structure
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      mockedGet.mockResolvedValueOnce('invalid response' as any);

      // Act & Assert
      await expect(getEncounterConcepts()).rejects.toThrow(
        'Invalid response format from encounter concepts API',
      );
    });

    it('should throw an error when response is null', async () => {
      // Arrange
      mockedGet.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(getEncounterConcepts()).rejects.toThrow(
        'Invalid response format from encounter concepts API',
      );
    });

    it('should show notification when transformation fails', async () => {
      // Arrange
      const mockResponse = { visitTypes: {} };
      const transformError = new Error('Transform error');

      // Save original implementation
      const originalEntries = Object.entries;

      // Mock implementation that throws during transformation
      Object.entries = jest.fn().mockImplementationOnce(() => {
        throw transformError;
      });

      mockedGet.mockResolvedValueOnce(mockResponse);

      // Mock the error formatting
      const formattedError = { title: 'Error Title', message: 'Error Message' };
      mockedGetFormattedError.mockReturnValueOnce(formattedError);

      // Act & Assert
      await expect(getEncounterConcepts()).rejects.toThrow();

      // Verify notification was shown
      expect(mockedGetFormattedError).toHaveBeenCalledWith(transformError);
      expect(mockedNotificationService.showError).toHaveBeenCalledWith(
        formattedError.title,
        formattedError.message,
        5000,
      );

      // Restore original implementation
      Object.entries = originalEntries;
    });

    it('should convert non-string values to strings', async () => {
      // Arrange
      const mockResponse = {
        visitTypes: {
          NUMBER_ID: 12345,
          BOOLEAN_ID: true,
          NULL_ID: null,
        },
        encounterTypes: {},
        orderTypes: {},
        conceptData: {},
      };

      const expectedResult = {
        visitTypes: [
          { name: 'NUMBER_ID', uuid: '12345' },
          { name: 'BOOLEAN_ID', uuid: 'true' },
          { name: 'NULL_ID', uuid: 'null' },
        ],
        encounterTypes: [],
        orderTypes: [],
        conceptData: [],
      };

      mockedGet.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getEncounterConcepts();

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should handle complex objects in conceptData', async () => {
      // Arrange
      const complexObject = { id: 'abc', type: 'test' };
      const mockResponse = {
        visitTypes: {},
        encounterTypes: {},
        orderTypes: {},
        conceptData: {
          COMPLEX: complexObject,
        },
      };

      mockedGet.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getEncounterConcepts();

      // Assert
      expect(result.conceptData).toHaveLength(1);
      expect(result.conceptData[0].name).toBe('COMPLEX');
      expect(result.conceptData[0].uuid).toBe(String(complexObject));
    });
  });
});
