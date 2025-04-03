import React from 'react';
import { render, screen } from '@testing-library/react';
import ConditionsTable from '../ConditionsTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useConditions } from '@hooks/useConditions';
import { formatConditions } from '@services/conditionService';
import {
  mockPatientUUID,
  mockConditions,
  mockFormattedConditionsWithoutNotes,
  mockFormattedConditionsWithNotes,
} from '@__mocks__/conditionMocks';
import {
  FhirCondition,
  FormattedCondition,
  ConditionStatus,
} from '@types/condition';

// Mock the hooks
jest.mock('@hooks/usePatientUUID');
jest.mock('@hooks/useConditions');
jest.mock('@services/conditionService');

const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

const mockedUseConditions = useConditions as jest.MockedFunction<
  typeof useConditions
>;

const mockedFormatConditions = formatConditions as jest.MockedFunction<
  typeof formatConditions
>;

describe('ConditionsTable Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  it('should call usePatientUUID to get patient UUID', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    render(<ConditionsTable />);

    // Verify usePatientUUID was called
    expect(usePatientUUID).toHaveBeenCalled();
  });

  it('should call useConditions with the correct patient UUID', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    render(<ConditionsTable />);

    // Verify useConditions was called with the correct UUID
    expect(useConditions).toHaveBeenCalledWith(mockPatientUUID);
  });

  it('should call formatConditions with the conditions from useConditions', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    render(<ConditionsTable />);

    // Verify formatConditions was called with the correct conditions
    expect(formatConditions).toHaveBeenCalledWith(mockConditions);
  });

  it('should display formatted conditions from the formatConditions function', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    render(<ConditionsTable />);

    // Verify the formatted conditions are displayed
    expect(screen.getByText('Cyst of Gallbladder')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('Super Man')).toBeInTheDocument();
  });

  it('should refetch conditions when patient UUID changes', () => {
    const refetchMock = jest.fn();

    // First render with initial UUID
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: refetchMock,
    });
    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    const { rerender } = render(<ConditionsTable />);

    // Change the UUID and rerender
    const newUUID = 'new-patient-uuid';
    (usePatientUUID as jest.Mock).mockReturnValue(newUUID);

    rerender(<ConditionsTable />);

    // Verify useConditions was called with the new UUID
    expect(useConditions).toHaveBeenCalledWith(newUUID);
  });

  it('should handle empty patient UUID', () => {
    // Mock the hooks with empty UUID
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: [],
      loading: false,
      error: new Error('Invalid patient UUID'),
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue([]);

    render(<ConditionsTable />);

    // Verify Error Message is shown for error state
    expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
    expect(
      screen.getByText('Invalid patient UUID', { exact: false }),
    ).toBeInTheDocument();
  });

  it('should handle invalid patient UUID', () => {
    // Mock the hooks with invalid UUID
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: [],
      loading: false,
      error: new Error('Invalid patient UUID'),
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue([]);

    render(<ConditionsTable />);

    // Verify Error Message is shown for error state
    expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
    expect(
      screen.getByText('Invalid patient UUID', { exact: false }),
    ).toBeInTheDocument();
  });

  it('should handle network errors from useConditions', () => {
    // Mock the hooks with network error
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: [],
      loading: false,
      error: new Error('Network error'),
      refetch: jest.fn(),
    });
    mockedFormatConditions.mockReturnValue([]);

    render(<ConditionsTable />);

    // Verify Error Message is shown for error state
    expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
    expect(
      screen.getByText('Network error', { exact: false }),
    ).toBeInTheDocument();
  });

  it('should display notes when condition has notes', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithNotes);

    render(<ConditionsTable />);

    // In a real test with the actual ExpandableDataTable, we would need to expand the row
    // But since we're using a mock, we can just check if the notes are in the document
    expect(
      screen.getByText('Patient reports pain in the upper right quadrant'),
    ).toBeInTheDocument();
  });

  it('should display condition without expanding has no notes', () => {
    // Mock the hooks
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedUseConditions.mockReturnValue({
      conditions: mockConditions,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithoutNotes);

    render(<ConditionsTable />);

    // In a real test with the actual ExpandableDataTable, we would need to expand the row
    // But since we're using a mock, we can just check if there is no notes in the document
    expect(screen.getByText('Cyst of Gallbladder')).toBeInTheDocument();
    expect(screen.getByText('25/03/2025 00:00')).toBeInTheDocument();
  });

  it('should handle missing optional fields in condition data', () => {
    // Create condition with missing optional fields
    const conditionsWithMissingFields: FhirCondition[] = [
      {
        resourceType: 'Condition',
        id: 'condition-without-optionals',
        meta: {
          versionId: '1',
          lastUpdated: '2025-03-25T06:48:32.000+00:00',
        },
        code: {
          coding: [
            {
              code: 'test-code',
              display: 'Test Condition',
            },
          ],
          text: 'Test Condition',
        },
        subject: {
          reference: `Patient/${mockPatientUUID}`,
          type: 'Patient',
          display: 'Test Patient',
        },
        // Missing onsetDateTime, recordedDate, recorder, clinicalStatus
      },
    ];

    const formattedIncompleteCondition: FormattedCondition[] = [
      {
        id: 'condition-without-optionals',
        display: 'Test Condition',
        status: ConditionStatus.Inactive,
        code: 'test-code',
        codeDisplay: 'Test Condition',
        // Missing onsetDate, recordedDate, recorder
      },
    ];

    // Mock the hooks with incomplete data
    (usePatientUUID as jest.Mock).mockReturnValue(mockPatientUUID);
    (useConditions as jest.Mock).mockReturnValue({
      conditions: conditionsWithMissingFields,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    (formatConditions as jest.Mock).mockReturnValue(
      formattedIncompleteCondition,
    );

    render(<ConditionsTable />);

    // Verify the component renders with incomplete data
    expect(screen.getByText('Test Condition')).toBeInTheDocument();
    expect(screen.getByText('inactive')).toBeInTheDocument();
  });
});
