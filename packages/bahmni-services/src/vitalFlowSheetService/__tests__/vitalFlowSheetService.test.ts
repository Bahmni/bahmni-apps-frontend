import { get } from '../../api';
import { VITAL_FLOW_SHEET_URL } from '../constants';
import {
  getVitalFlowSheetData,
  VitalFlowSheetData,
  VitalFlowSheetConceptDetail,
  VitalFlowSheetObservation,
} from '../vitalFlowSheetService';

// Mock dependencies
jest.mock('../../api');

//TODO: Remove this import once the test i18n setup is complete
jest.mock('i18next', () => ({
  __esModule: true,
  default: {
    t: jest.fn().mockImplementation((key: string) => key),
  },
}));

describe('vitalFlowSheetService', () => {
  // Mock data
  const mockPatientUuid = 'patient-uuid-123';
  const mockLatestCount = 5;
  const mockObsConcepts = ['Temperature', 'Blood Pressure', 'Heart Rate'];

  const mockConceptDetails: VitalFlowSheetConceptDetail[] = [
    {
      name: 'Temperature',
      fullName: 'Temperature (C)',
      units: '°C',
      hiNormal: 37.5,
      lowNormal: 36.0,
      attributes: { type: 'vital' },
    },
    {
      name: 'Blood Pressure',
      fullName: 'Blood Pressure (mmHg)',
      units: 'mmHg',
      hiNormal: 140,
      lowNormal: 90,
      attributes: { type: 'vital', systolic: true },
    },
    {
      name: 'Heart Rate',
      fullName: 'Heart Rate (bpm)',
      units: 'bpm',
      hiNormal: 100,
      lowNormal: 60,
      attributes: { type: 'vital' },
    },
  ];

  const mockObservation: VitalFlowSheetObservation = {
    value: '36.5',
    abnormal: false,
  };

  const mockAbnormalObservation: VitalFlowSheetObservation = {
    value: '39.0',
    abnormal: true,
  };

  const mockTabularData = {
    '2024-01-01 10:00:00': {
      Temperature: mockObservation,
      'Blood Pressure': { value: '120/80', abnormal: false },
      'Heart Rate': { value: '75', abnormal: false },
    },
    '2024-01-02 10:00:00': {
      Temperature: mockAbnormalObservation,
      'Blood Pressure': { value: '150/95', abnormal: true },
      'Heart Rate': { value: '85', abnormal: false },
    },
  };

  const mockVitalFlowSheetData: VitalFlowSheetData = {
    tabularData: mockTabularData,
    conceptDetails: mockConceptDetails,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockReset();
  });

  describe('getVitalFlowSheetData', () => {
    // Happy Path Tests
    it('should fetch vital flow sheet data successfully with default groupBy', async () => {
      // Arrange
      (get as jest.Mock).mockResolvedValue(mockVitalFlowSheetData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        mockLatestCount,
        mockObsConcepts,
      );

      // Assert
      const expectedUrl = `${VITAL_FLOW_SHEET_URL}groupBy=obstime&latestCount=5&patientUuid=patient-uuid-123&obsConcepts=Temperature&obsConcepts=Blood+Pressure&obsConcepts=Heart+Rate`;
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockVitalFlowSheetData);
    });

    it('should fetch vital flow sheet data successfully with custom groupBy', async () => {
      // Arrange
      const customGroupBy = 'encounter';
      (get as jest.Mock).mockResolvedValue(mockVitalFlowSheetData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        mockLatestCount,
        mockObsConcepts,
        customGroupBy,
      );

      // Assert
      const expectedUrl = `${VITAL_FLOW_SHEET_URL}groupBy=encounter&latestCount=5&patientUuid=patient-uuid-123&obsConcepts=Temperature&obsConcepts=Blood+Pressure&obsConcepts=Heart+Rate`;
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockVitalFlowSheetData);
    });

    it('should handle single observation concept', async () => {
      // Arrange
      const singleConcept = ['Temperature'];
      const singleConceptData: VitalFlowSheetData = {
        tabularData: {
          '2024-01-01 10:00:00': {
            Temperature: mockObservation,
          },
        },
        conceptDetails: [mockConceptDetails[0]],
      };
      (get as jest.Mock).mockResolvedValue(singleConceptData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        mockLatestCount,
        singleConcept,
      );

      // Assert
      const expectedUrl = `${VITAL_FLOW_SHEET_URL}groupBy=obstime&latestCount=5&patientUuid=patient-uuid-123&obsConcepts=Temperature`;
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(singleConceptData);
    });

    it('should handle large latestCount values', async () => {
      // Arrange
      const largeLatestCount = 1000;
      (get as jest.Mock).mockResolvedValue(mockVitalFlowSheetData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        largeLatestCount,
        mockObsConcepts,
      );

      // Assert
      const expectedUrl = `${VITAL_FLOW_SHEET_URL}groupBy=obstime&latestCount=1000&patientUuid=patient-uuid-123&obsConcepts=Temperature&obsConcepts=Blood+Pressure&obsConcepts=Heart+Rate`;
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockVitalFlowSheetData);
    });

    it('should return empty data when API returns empty response', async () => {
      // Arrange
      const emptyData: VitalFlowSheetData = {
        tabularData: {},
        conceptDetails: [],
      };
      (get as jest.Mock).mockResolvedValue(emptyData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        mockLatestCount,
        mockObsConcepts,
      );

      // Assert
      expect(result).toEqual(emptyData);
    });

    // Sad Path Tests
    it('should throw error when API call fails', async () => {
      // Arrange
      const mockError = new Error('Network Error');
      (get as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        getVitalFlowSheetData(
          mockPatientUuid,
          mockLatestCount,
          mockObsConcepts,
        ),
      ).rejects.toThrow('Network Error');
      expect(get).toHaveBeenCalledTimes(1);
    });

    it('should throw error when API returns 404', async () => {
      // Arrange
      const notFoundError = new Error('Patient not found');
      (get as jest.Mock).mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(
        getVitalFlowSheetData(
          mockPatientUuid,
          mockLatestCount,
          mockObsConcepts,
        ),
      ).rejects.toThrow('Patient not found');
    });

    it('should throw error when API returns 500', async () => {
      // Arrange
      const serverError = new Error('Internal Server Error');
      (get as jest.Mock).mockRejectedValue(serverError);

      // Act & Assert
      await expect(
        getVitalFlowSheetData(
          mockPatientUuid,
          mockLatestCount,
          mockObsConcepts,
        ),
      ).rejects.toThrow('Internal Server Error');
    });

    it('should throw error when API returns malformed data', async () => {
      // Arrange
      const malformedError = new Error('Invalid JSON response');
      (get as jest.Mock).mockRejectedValue(malformedError);

      // Act & Assert
      await expect(
        getVitalFlowSheetData(
          mockPatientUuid,
          mockLatestCount,
          mockObsConcepts,
        ),
      ).rejects.toThrow('Invalid JSON response');
    });

    // Edge Cases
    it('should handle zero latestCount', async () => {
      // Arrange
      const zeroLatestCount = 0;
      (get as jest.Mock).mockResolvedValue(mockVitalFlowSheetData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        zeroLatestCount,
        mockObsConcepts,
      );

      // Assert
      const expectedUrl = `${VITAL_FLOW_SHEET_URL}groupBy=obstime&latestCount=0&patientUuid=patient-uuid-123&obsConcepts=Temperature&obsConcepts=Blood+Pressure&obsConcepts=Heart+Rate`;
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockVitalFlowSheetData);
    });

    it('should handle negative latestCount', async () => {
      // Arrange
      const negativeLatestCount = -5;
      (get as jest.Mock).mockResolvedValue(mockVitalFlowSheetData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        negativeLatestCount,
        mockObsConcepts,
      );

      // Assert
      const expectedUrl = `${VITAL_FLOW_SHEET_URL}groupBy=obstime&latestCount=-5&patientUuid=patient-uuid-123&obsConcepts=Temperature&obsConcepts=Blood+Pressure&obsConcepts=Heart+Rate`;
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockVitalFlowSheetData);
    });

    it('should handle empty observation concepts array', async () => {
      // Arrange
      const emptyConcepts: string[] = [];
      const emptyData: VitalFlowSheetData = {
        tabularData: {},
        conceptDetails: [],
      };
      (get as jest.Mock).mockResolvedValue(emptyData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        mockLatestCount,
        emptyConcepts,
      );

      // Assert
      const expectedUrl = `${VITAL_FLOW_SHEET_URL}groupBy=obstime&latestCount=5&patientUuid=patient-uuid-123`;
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(emptyData);
    });

    it('should handle empty string groupBy parameter', async () => {
      // Arrange
      const emptyGroupBy = '';
      (get as jest.Mock).mockResolvedValue(mockVitalFlowSheetData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        mockLatestCount,
        mockObsConcepts,
        emptyGroupBy,
      );

      // Assert
      const expectedUrl = `${VITAL_FLOW_SHEET_URL}groupBy=&latestCount=5&patientUuid=patient-uuid-123&obsConcepts=Temperature&obsConcepts=Blood+Pressure&obsConcepts=Heart+Rate`;
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockVitalFlowSheetData);
    });

    it('should handle concepts with empty strings', async () => {
      // Arrange
      const conceptsWithEmpty = ['Temperature', '', 'Heart Rate'];
      (get as jest.Mock).mockResolvedValue(mockVitalFlowSheetData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        mockLatestCount,
        conceptsWithEmpty,
      );

      // Assert
      const expectedUrl = `${VITAL_FLOW_SHEET_URL}groupBy=obstime&latestCount=5&patientUuid=patient-uuid-123&obsConcepts=Temperature&obsConcepts=&obsConcepts=Heart+Rate`;
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockVitalFlowSheetData);
    });

    it('should handle very long concept names', async () => {
      // Arrange
      const longConceptName = 'A'.repeat(1000);
      const longConcepts = [longConceptName];
      (get as jest.Mock).mockResolvedValue(mockVitalFlowSheetData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        mockLatestCount,
        longConcepts,
      );

      // Assert
      const expectedUrl = `${VITAL_FLOW_SHEET_URL}groupBy=obstime&latestCount=5&patientUuid=patient-uuid-123&obsConcepts=${longConceptName}`;
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockVitalFlowSheetData);
    });

    it('should handle API timeout error', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      (get as jest.Mock).mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(
        getVitalFlowSheetData(
          mockPatientUuid,
          mockLatestCount,
          mockObsConcepts,
        ),
      ).rejects.toThrow('Request timeout');
    });

    it('should handle API returning null', async () => {
      // Arrange
      (get as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        mockLatestCount,
        mockObsConcepts,
      );

      // Assert
      expect(result).toBeNull();
    });

    // Data Integrity Tests
    it('should preserve data structure when API returns complex nested data', async () => {
      // Arrange
      const complexData: VitalFlowSheetData = {
        tabularData: {
          '2024-01-01 10:00:00': {
            'Complex Vital': {
              value: JSON.stringify({ systolic: 120, diastolic: 80 }),
              abnormal: false,
            },
          },
        },
        conceptDetails: [
          {
            name: 'Complex Vital',
            fullName: 'Complex Vital Sign',
            units: 'complex',
            hiNormal: 140,
            lowNormal: 90,
            attributes: {
              nested: {
                deep: {
                  value: 'test',
                  array: [1, 2, 3],
                },
              },
            },
          },
        ],
      };
      (get as jest.Mock).mockResolvedValue(complexData);

      // Act
      const result = await getVitalFlowSheetData(
        mockPatientUuid,
        mockLatestCount,
        ['Complex Vital'],
      );

      // Assert
      expect(result).toEqual(complexData);
      expect(
        (result.conceptDetails[0].attributes as any).nested.deep.value,
      ).toBe('test');
      expect(
        (result.conceptDetails[0].attributes as any).nested.deep.array,
      ).toEqual([1, 2, 3]);
    });
  });
});
