import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import useLabInvestigations from '../useLabInvestigations';
import { getLabTests, formatLabTests } from '@services/labInvestigationService';
import { usePatientUUID } from '@hooks/usePatientUUID';
import {
  FormattedLabTest,
  LabTestStatus,
  LabTestPriority,
} from '../../types/labInvestigation';

// Mock dependencies
jest.mock('@services/labInvestigationService');
jest.mock('@hooks/usePatientUUID');

// Type the mocked functions
const mockedGetLabTests = getLabTests as jest.MockedFunction<
  typeof getLabTests
>;
const mockedFormatLabTests = formatLabTests as jest.MockedFunction<
  typeof formatLabTests
>;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

describe('useLabInvestigations', () => {
  // Mock state setters
  let mockSetLabTests: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;

  // Mock lab tests data
  const mockFormattedLabTests: FormattedLabTest[] = [
    {
      id: 'aba2a637-05f5-44c6-9021-c5cd05548342',
      testName: 'CD8%',
      status: LabTestStatus.Normal,
      priority: LabTestPriority.routine,
      orderedBy: 'Super Man',
      orderedDate: '2025-05-08T12:44:24+00:00',
      formattedDate: '05/08/2025',
      result: undefined,
      testType: 'Single Test',
    },
    {
      id: '29e240ce-5a3d-4643-8d4b-ca5b4cbf665d',
      testName: 'Absolute eosinophil count test',
      status: LabTestStatus.Normal,
      priority: LabTestPriority.routine,
      orderedBy: 'Super Man',
      orderedDate: '2025-04-09T13:21:22+00:00',
      formattedDate: '04/09/2025',
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
      formattedDate: '04/09/2025',
      result: undefined,
      testType: 'Panel',
    },
  ];

  // Mock raw lab tests
  const mockLabTestFhirBundle = [
    {
      resourceType: 'ServiceRequest',
      id: 'test1',
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
            display: 'Test 1',
          },
        ],
        text: 'Test 1',
      },
      subject: {
        reference: 'Patient/58493859-63f7-48b6-bd0b-698d5a119a21',
        type: 'Patient',
        display: 'John Doe',
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
        display: 'Dr. Smith',
      },
    },
    {
      resourceType: 'ServiceRequest',
      id: 'test2',
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
            display: 'Test 2',
          },
        ],
        text: 'Test 2',
      },
      subject: {
        reference: 'Patient/58493859-63f7-48b6-bd0b-698d5a119a21',
        type: 'Patient',
        display: 'John Doe',
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
        display: 'Dr. Smith',
      },
    },
    {
      resourceType: 'ServiceRequest',
      id: 'test3',
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
            code: '161432AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            display: 'Test 3',
          },
        ],
        text: 'Test 3',
      },
      subject: {
        reference: 'Patient/58493859-63f7-48b6-bd0b-698d5a119a21',
        type: 'Patient',
        display: 'John Doe',
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
        display: 'Dr. Smith',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useState mock implementation
    mockSetLabTests = jest.fn();
    mockSetLoading = jest.fn();
    mockSetError = jest.fn();

    // Mock React hooks
    jest
      .spyOn(React, 'useState')
      .mockImplementationOnce(() => [[], mockSetLabTests])
      .mockImplementationOnce(() => [true, mockSetLoading])
      .mockImplementationOnce(() => [false, mockSetError]);

    let previousDeps: string | undefined;
    jest.spyOn(React, 'useEffect').mockImplementation((effect, deps) => {
      const depsString = JSON.stringify(deps);
      if (depsString !== previousDeps) {
        effect();
        previousDeps = depsString;
      }
    });

    // Mock service functions
    mockedGetLabTests.mockResolvedValue(mockLabTestFhirBundle);
    mockedFormatLabTests.mockReturnValue(mockFormattedLabTests);
  });

  // Happy Path Tests
  describe('Happy Paths', () => {
    it('should fetch lab tests when a valid patientUUID is provided', async () => {
      // Arrange
      const patientUUID = '58493859-63f7-48b6-bd0b-698d5a119a21';
      mockedUsePatientUUID.mockReturnValue(patientUUID);

      // Act
      const { result } = renderHook(() => useLabInvestigations());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetLabTests).toHaveBeenCalledWith(patientUUID);
        expect(mockedFormatLabTests).toHaveBeenCalledWith(
          mockLabTestFhirBundle,
        );
        expect(mockSetLabTests).toHaveBeenCalledWith(mockFormattedLabTests);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
        expect(mockSetError).toHaveBeenCalledWith(false);
      });

      // Assert the returned values
      expect(result.current.labTests).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);
    });
  });

  // Sad Path Tests
  describe('Sad Paths', () => {
    it('should handle null patientUUID', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(null);

      // Act
      renderHook(() => useLabInvestigations());

      // Assert
      await waitFor(() => {
        expect(mockedGetLabTests).not.toHaveBeenCalled();
        expect(mockedFormatLabTests).not.toHaveBeenCalled();
        expect(mockSetLabTests).not.toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should handle API call failure', async () => {
      // Arrange
      const patientUUID = '58493859-63f7-48b6-bd0b-698d5a119a21';
      mockedUsePatientUUID.mockReturnValue(patientUUID);
      const error = new Error('Network error');
      mockedGetLabTests.mockRejectedValueOnce(error);

      // Mock console.error to prevent test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Act
      renderHook(() => useLabInvestigations());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetLabTests).toHaveBeenCalledWith(patientUUID);
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching lab investigations:',
          error,
        );
        expect(mockSetError).toHaveBeenCalledWith(true);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });

      // Restore console.error
      console.error = originalConsoleError;
    });

    it('should handle empty lab tests array from API', async () => {
      // Arrange
      const patientUUID = '58493859-63f7-48b6-bd0b-698d5a119a21';
      mockedUsePatientUUID.mockReturnValue(patientUUID);
      mockedGetLabTests.mockResolvedValueOnce([]);
      mockedFormatLabTests.mockReturnValueOnce([]);

      // Act
      renderHook(() => useLabInvestigations());

      // Wait for async operations
      await waitFor(() => {
        expect(mockedGetLabTests).toHaveBeenCalledWith(patientUUID);
        expect(mockedFormatLabTests).toHaveBeenCalledWith([]);
        expect(mockSetLabTests).toHaveBeenCalledWith([]);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      });
    });

    it('should cleanup properly on unmount', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(
        '58493859-63f7-48b6-bd0b-698d5a119a21',
      );

      // Act & Assert
      const { unmount } = renderHook(() => useLabInvestigations());
      expect(() => unmount()).not.toThrow();
    });
  });
});
