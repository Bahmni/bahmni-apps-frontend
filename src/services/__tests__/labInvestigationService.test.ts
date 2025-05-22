import { get } from '../api';
import {
  getLabTests,
  formatLabTests,
  groupLabTestsByDate,
  getPatientLabTestsByDate,
  getPatientLabTestsBundle,
} from '../labInvestigationService';
import {
  FhirLabTest,
  LabTestStatus,
  LabTestPriority,
  FormattedLabTest,
} from '../../types/labInvestigation';
import '../../utils/date';
import { getFormattedError } from '../../utils/common';
import notificationService from '../notificationService';

// Mock dependencies
jest.mock('../api');
jest.mock('../../utils/common');
jest.mock('../notificationService');

describe('labInvestigationService', () => {
  const mockPatientUUID = '58493859-63f7-48b6-bd0b-698d5a119a21';

  // Mock FHIR lab test data
  const mockFhirLabTests: FhirLabTest[] = [
    {
      resourceType: 'ServiceRequest',
      id: '29e240ce-5a3d-4643-8d4b-ca5b4cbf665d',
      meta: {
        versionId: '1744204882000',
        lastUpdated: '2025-04-09T13:21:22.000+00:00',
      },
      extension: [
        {
          url: 'http://fhir.bahmni.org/lab-order-concept-type-extension',
          valueString: 'Test',
        },
      ],
      status: 'completed',
      intent: 'order',
      category: [
        {
          coding: [
            {
              system: 'http://fhir.bahmni.org/code-system/order-type',
              code: 'd3560b17-5e07-11ef-8f7c-0242ac120002',
              display: 'Lab Order',
            },
          ],
          text: 'Lab Order',
        },
      ],
      priority: 'routine',
      code: {
        coding: [
          {
            code: '161432AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            display: 'Absolute eosinophil count test',
          },
        ],
        text: 'Absolute eosinophil count test',
      },
      subject: {
        reference: 'Patient/58493859-63f7-48b6-bd0b-698d5a119a21',
        type: 'Patient',
        display: 'John Doe (Patient Identifier: ABC200000)',
      },
      encounter: {
        reference: 'Encounter/da968503-e1ff-426e-a110-601d893847d4',
        type: 'Encounter',
      },
      occurrencePeriod: {
        start: '2025-04-09T13:21:22+00:00',
        end: '2025-04-09T14:21:22+00:00',
      },
      requester: {
        reference: 'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
        type: 'Practitioner',
        identifier: {
          value: 'superman',
        },
        display: 'Super Man',
      },
    },
    {
      resourceType: 'ServiceRequest',
      id: 'e7eca932-1d6f-44a4-bd94-e1105860ab77',
      meta: {
        versionId: '1744204882000',
        lastUpdated: '2025-04-09T13:21:22.000+00:00',
      },
      extension: [
        {
          url: 'http://fhir.bahmni.org/lab-order-concept-type-extension',
          valueString: 'Panel',
        },
      ],
      status: 'completed',
      intent: 'order',
      category: [
        {
          coding: [
            {
              system: 'http://fhir.bahmni.org/code-system/order-type',
              code: 'd3560b17-5e07-11ef-8f7c-0242ac120002',
              display: 'Lab Order',
            },
          ],
          text: 'Lab Order',
        },
      ],
      priority: 'routine',
      code: {
        coding: [
          {
            code: '163702AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            display: 'Clotting Panel',
          },
        ],
        text: 'Clotting Panel',
      },
      subject: {
        reference: 'Patient/58493859-63f7-48b6-bd0b-698d5a119a21',
        type: 'Patient',
        display: 'John Doe (Patient Identifier: ABC200000)',
      },
      encounter: {
        reference: 'Encounter/da968503-e1ff-426e-a110-601d893847d4',
        type: 'Encounter',
      },
      occurrencePeriod: {
        start: '2025-04-09T13:21:22+00:00',
        end: '2025-04-09T14:21:22+00:00',
      },
      requester: {
        reference: 'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
        type: 'Practitioner',
        identifier: {
          value: 'superman',
        },
        display: 'Super Man',
      },
    },
    {
      resourceType: 'ServiceRequest',
      id: 'aba2a637-05f5-44c6-9021-c5cd05548342',
      meta: {
        versionId: '1746708264000',
        lastUpdated: '2025-05-08T12:44:24.000+00:00',
      },
      extension: [
        {
          url: 'http://fhir.bahmni.org/lab-order-concept-type-extension',
          valueString: 'Test',
        },
      ],
      status: 'completed',
      intent: 'order',
      category: [
        {
          coding: [
            {
              system: 'http://fhir.bahmni.org/code-system/order-type',
              code: 'd3560b17-5e07-11ef-8f7c-0242ac120002',
              display: 'Lab Order',
            },
          ],
          text: 'Lab Order',
        },
      ],
      priority: 'routine',
      code: {
        coding: [
          {
            code: '1027AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            display: 'CD8%',
          },
        ],
        text: 'CD8%',
      },
      subject: {
        reference: 'Patient/58493859-63f7-48b6-bd0b-698d5a119a21',
        type: 'Patient',
        display: 'John Doe (Patient Identifier: ABC200000)',
      },
      encounter: {
        reference: 'Encounter/1fc47c1d-5928-40e2-9c23-5b0d7c1e6b57',
        type: 'Encounter',
      },
      occurrencePeriod: {
        start: '2025-05-08T12:44:24+00:00',
        end: '2025-05-08T13:44:24+00:00',
      },
      requester: {
        reference: 'Practitioner/d7a67c17-5e07-11ef-8f7c-0242ac120002',
        type: 'Practitioner',
        identifier: {
          value: 'superman',
        },
        display: 'Super Man',
      },
    },
  ];

  // Mock FHIR lab test bundle
  const mockFhirLabTestBundle = {
    resourceType: 'Bundle',
    id: 'ef85fcc3-3195-4b87-ad03-bd43f9bcd080',
    meta: {
      lastUpdated: '2025-05-15T04:23:36.396+00:00',
    },
    type: 'searchset',
    total: 3,
    link: [
      {
        relation: 'self',
        url: 'http://bahnew.gdobahmni.click/openmrs/ws/fhir2/R4/ServiceRequest?category=d3560b17-5e07-11ef-8f7c-0242ac120002&patient=58493859-63f7-48b6-bd0b-698d5a119a21',
      },
    ],
    entry: mockFhirLabTests.map((resource) => ({
      fullUrl: `http://bahnew.gdobahmni.click/openmrs/ws/fhir2/R4/ServiceRequest/${resource.id}`,
      resource,
    })),
  };

  // Mock formatted lab tests
  const mockFormattedLabTests: FormattedLabTest[] = [
    {
      id: '29e240ce-5a3d-4643-8d4b-ca5b4cbf665d',
      testName: 'Absolute eosinophil count test',
      status: LabTestStatus.Normal,
      priority: LabTestPriority.routine,
      orderedBy: 'Super Man',
      orderedDate: '2025-04-09T13:21:22+00:00',
      formattedDate: 'April 9, 2025',
      result: undefined,
      testType: 'Single Test',
    },
    {
      id: 'e7eca932-1d6f-44a4-bd94-e1105860ab77',
      testName: 'Clotting Panel',
      status: LabTestStatus.Normal,
      priority: LabTestPriority.routine,
      orderedBy: 'Super Man',
      orderedDate: '2025-04-09T13:21:22+00:00',
      formattedDate: 'April 9, 2025',
      result: undefined,
      testType: 'Panel',
    },
    {
      id: 'aba2a637-05f5-44c6-9021-c5cd05548342',
      testName: 'CD8%',
      status: LabTestStatus.Normal,
      priority: LabTestPriority.routine,
      orderedBy: 'Super Man',
      orderedDate: '2025-05-08T12:44:24+00:00',
      formattedDate: 'May 8, 2025',
      result: undefined,
      testType: 'Single Test',
    },
  ];

  // Mock date formatter
  jest.mock('../../utils/date', () => ({
    formatDate: jest.fn().mockImplementation((date) => {
      if (date.includes('2025-04-09')) {
        return { formattedResult: 'April 9, 2025' };
      } else if (date.includes('2025-05-08')) {
        return { formattedResult: 'May 8, 2025' };
      }
      return { formattedResult: 'Invalid date' };
    }),
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockResolvedValue(mockFhirLabTestBundle);
    (getFormattedError as jest.Mock).mockReturnValue({
      title: 'Error',
      message: 'Something went wrong',
    });
  });

  describe('getPatientLabTestsBundle', () => {
    it('should fetch lab test bundle for a patient', async () => {
      const result = await getPatientLabTestsBundle(mockPatientUUID);

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining(mockPatientUUID),
      );
      expect(result).toEqual(mockFhirLabTestBundle);
    });

    it('should throw an error when API call fails', async () => {
      const errorMessage = 'API error';
      (get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(getPatientLabTestsBundle(mockPatientUUID)).rejects.toThrow();
    });
  });

  describe('getLabTests', () => {
    it('should fetch lab tests for a patient', async () => {
      const result = await getLabTests(mockPatientUUID);

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining(mockPatientUUID),
      );
      expect(result).toEqual(mockFhirLabTests);
    });

    it('should handle errors and return an empty array', async () => {
      (get as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await getLabTests(mockPatientUUID);

      expect(result).toEqual([]);
      expect(notificationService.showError).toHaveBeenCalled();
    });
  });

  describe('formatLabTests', () => {
    it('should format lab tests correctly', () => {
      const result = formatLabTests(mockFhirLabTests);

      expect(result).toEqual(mockFormattedLabTests);
    });

    it('should handle unknown status values and default to Normal', () => {
      // Create a test with unknown status
      const testWithUnknownStatus = {
        ...mockFhirLabTests[0],
        status: 'unknown_status',
      };

      const result = formatLabTests([testWithUnknownStatus]);

      // Verify the status defaults to Normal
      expect(result[0].status).toBe(LabTestStatus.Normal);

      // Create another test with undefined status to ensure default case is covered
      const testWithUndefinedStatus = {
        ...mockFhirLabTests[0],
        status: undefined as unknown as string,
      };

      const resultUndefined = formatLabTests([testWithUndefinedStatus]);

      // Verify the status defaults to Normal
      expect(resultUndefined[0].status).toBe(LabTestStatus.Normal);

      // Create a test with null status to ensure default case is covered
      const testWithNullStatus = {
        ...mockFhirLabTests[0],
        status: null as unknown as string,
      };

      const resultNull = formatLabTests([testWithNullStatus]);

      // Verify the status defaults to Normal
      expect(resultNull[0].status).toBe(LabTestStatus.Normal);
    });

    it('should handle unknown priority values and default to Routine', () => {
      // Create a test with unknown priority
      const testWithUnknownPriority = {
        ...mockFhirLabTests[0],
        priority: 'unknown_priority',
      };

      const result = formatLabTests([testWithUnknownPriority]);

      // Verify the priority defaults to Routine
      expect(result[0].priority).toBe(LabTestPriority.routine);

      // Create another test with undefined priority to ensure default case is covered
      const testWithUndefinedPriority = {
        ...mockFhirLabTests[0],
        priority: undefined as unknown as string,
      };

      const resultUndefined = formatLabTests([testWithUndefinedPriority]);

      // Verify the priority defaults to Routine
      expect(resultUndefined[0].priority).toBe(LabTestPriority.routine);

      // Create a test with null priority to ensure default case is covered
      const testWithNullPriority = {
        ...mockFhirLabTests[0],
        priority: null as unknown as string,
      };

      const resultNull = formatLabTests([testWithNullPriority]);

      // Verify the priority defaults to Routine
      expect(resultNull[0].priority).toBe(LabTestPriority.routine);
    });

    it('should handle empty arrays', () => {
      const result = formatLabTests([]);

      expect(result).toEqual([]);
    });

    it('should handle malformed lab test data', () => {
      // Create a test with minimal required properties to pass type checking
      const malformedTest = {
        ...mockFhirLabTests[0],
        code: {
          coding: [{ code: 'malformed-code' }], // Minimal required properties
          text: 'Malformed Test',
        },
        requester: {
          reference: 'Practitioner/unknown',
          type: 'Practitioner',
          display: 'Unknown Doctor',
        },
      };

      // This should not throw an error but handle it gracefully
      const result = formatLabTests([malformedTest]);

      // The result should still be an array with the malformed test
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].testName).toBe('Malformed Test');
      expect(result[0].orderedBy).toBe('Unknown Doctor');
    });

    it('should handle errors and return an empty array', () => {
      (getFormattedError as jest.Mock).mockReturnValue({
        title: 'Error',
        message: 'Formatting error',
      });

      // Force an error by passing invalid data
      const result = formatLabTests(null as unknown as FhirLabTest[]);

      expect(result).toEqual([]);
      expect(notificationService.showError).toHaveBeenCalled();
    });
  });

  describe('groupLabTestsByDate', () => {
    it('should group lab tests by date', () => {
      const result = groupLabTestsByDate(mockFormattedLabTests);

      expect(result).toHaveLength(2); // Two unique dates

      // First date (newest)
      expect(result[0].date).toBe('May 8, 2025');
      expect(result[0].tests).toHaveLength(1);
      expect(result[0].tests[0].testName).toBe('CD8%');

      // Second date (older)
      expect(result[1].date).toBe('April 9, 2025');
      expect(result[1].tests).toHaveLength(2);
      expect(result[1].tests[0].testName).toBe(
        'Absolute eosinophil count test',
      );
      expect(result[1].tests[1].testName).toBe('Clotting Panel');
    });

    it('should handle empty arrays', () => {
      const result = groupLabTestsByDate([]);

      expect(result).toEqual([]);
    });

    it('should handle lab tests with missing date information', () => {
      // Create a test with missing date information
      const testWithMissingDate = {
        ...mockFormattedLabTests[0],
        orderedDate: undefined as unknown as string,
      };

      // This should not throw an error
      const result = groupLabTestsByDate([testWithMissingDate]);

      // The result should be an empty array since we can't group by date
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should sort dates correctly with newest first', () => {
      // Create tests with different dates
      const oldTest = {
        ...mockFormattedLabTests[0],
        orderedDate: '2024-01-01T00:00:00+00:00',
        formattedDate: 'Jan 1, 2024',
      };

      const middleTest = {
        ...mockFormattedLabTests[0],
        orderedDate: '2024-06-15T00:00:00+00:00',
        formattedDate: 'Jun 15, 2024',
      };

      const newTest = {
        ...mockFormattedLabTests[0],
        orderedDate: '2025-12-31T00:00:00+00:00',
        formattedDate: 'Dec 31, 2025',
      };

      const result = groupLabTestsByDate([oldTest, middleTest, newTest]);

      // Verify sorting order (newest first)
      expect(result.length).toBe(3);
      expect(result[0].date).toBe('Dec 31, 2025');
      expect(result[1].date).toBe('Jun 15, 2024');
      expect(result[2].date).toBe('Jan 1, 2024');
    });

    it('should handle errors and return an empty array', () => {
      (getFormattedError as jest.Mock).mockReturnValue({
        title: 'Error',
        message: 'Grouping error',
      });

      // Force an error by passing invalid data
      const result = groupLabTestsByDate(null as unknown as FormattedLabTest[]);

      expect(result).toEqual([]);
      expect(notificationService.showError).toHaveBeenCalled();
    });
  });

  describe('getPatientLabTestsByDate', () => {
    it('should fetch, format, and group lab tests', async () => {
      const result = await getPatientLabTestsByDate(mockPatientUUID);

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining(mockPatientUUID),
      );
      expect(result).toHaveLength(2); // Two unique dates

      // First date (newest)
      expect(result[0].date).toBe('May 8, 2025');
      expect(result[0].tests).toHaveLength(1);

      // Second date (older)
      expect(result[1].date).toBe('April 9, 2025');
      expect(result[1].tests).toHaveLength(2);
    });

    it('should handle errors from API and return an empty array', async () => {
      (get as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await getPatientLabTestsByDate(mockPatientUUID);

      expect(result).toEqual([]);
      expect(notificationService.showError).toHaveBeenCalled();
    });

    it('should handle empty lab test results', async () => {
      // Mock an empty array return from getLabTests
      (get as jest.Mock).mockResolvedValue({ entry: [] });

      const result = await getPatientLabTestsByDate(mockPatientUUID);

      expect(result).toEqual([]);
    });

    it('should handle processing errors and return an empty array', async () => {
      // Create a direct mock implementation of getLabTests that throws an error
      (get as jest.Mock).mockImplementation(() => {
        throw new Error('Processing error');
      });

      const result = await getPatientLabTestsByDate('mock-patient-uuid');

      expect(result).toEqual([]);
      expect(notificationService.showError).toHaveBeenCalled();
    });
  });
});
