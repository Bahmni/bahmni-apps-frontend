import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  getFormattedConditions,
  getFormattedError,
  useTranslation,
  ConditionStatus,
  FormattedCondition,
} from '@bahmni-frontend/bahmni-services';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import ConditionsTable from '../ConditionsTable';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  getFormattedConditions: jest.fn(),
  getFormattedError: jest.fn(),
  useTranslation: jest.fn(),
}));

jest.mock('../../hooks/usePatientUUID');

const mockGetFormattedConditions =
  getFormattedConditions as jest.MockedFunction<typeof getFormattedConditions>;
const mockGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockConditions: FormattedCondition[] = [
  {
    id: '1',
    code: 'K82.9',
    codeDisplay: 'K82.9',
    display: 'Chronic Cholecystitis',
    status: ConditionStatus.Active,
    onsetDate: '2025-03-24T18:30:00+00:00',
    recorder: 'Dr. Smith',
  },
  {
    id: '2',
    code: 'M79.3',
    codeDisplay: 'M79.3',
    display: 'Panniculitis',
    status: ConditionStatus.Inactive,
    onsetDate: '2025-01-15T10:00:00+00:00',
    recorder: 'Dr. Johnson',
  },
];

describe('ConditionsTable Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: any) => {
        const translations: Record<string, string> = {
          CONDITION_LIST_DISPLAY_CONTROL_TITLE: 'Conditions',
          CONDITION_LIST_CONDITION: 'Condition',
          CONDITION_TABLE_DURATION: 'Duration',
          CONDITION_TABLE_RECORDED_BY: 'Recorded By',
          CONDITION_LIST_STATUS: 'Status',
          CONDITION_LIST_ACTIVE: 'Active',
          CONDITION_LIST_INACTIVE: 'Inactive',
          CONDITION_LIST_NO_CONDITIONS: 'No conditions recorded',
          CONDITION_TABLE_NOT_AVAILABLE: 'Not available',
          CONDITION_ONSET_SINCE_FORMAT: options?.timeAgo
            ? `Since ${options.timeAgo}`
            : 'Since',
          ERROR_INVALID_PATIENT_UUID: 'Invalid patient UUID',
        };
        return translations[key] || key;
      },
    });

    mockUsePatientUUID.mockReturnValue('patient-123');
    mockGetFormattedError.mockImplementation((error) => ({
      title: 'Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }));
  });

  it('renders conditions from service through complete data flow', async () => {
    mockGetFormattedConditions.mockResolvedValue(mockConditions);

    render(<ConditionsTable />);

    await waitFor(() => {
      expect(screen.getByText('Chronic Cholecystitis')).toBeInTheDocument();
      expect(screen.getByText('Panniculitis')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
    });

    expect(mockGetFormattedConditions).toHaveBeenCalledWith('patient-123');
  });

  it('propagates service errors through hook to component UI', async () => {
    const serviceError = new Error('Network timeout');
    mockGetFormattedConditions.mockRejectedValue(serviceError);

    render(<ConditionsTable />);

    await waitFor(() => {
      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
      expect(screen.getByText(/Network timeout/)).toBeInTheDocument();
    });

    expect(mockGetFormattedError).toHaveBeenCalledWith(serviceError);
  });

  it('handles empty service response through complete flow', async () => {
    mockGetFormattedConditions.mockResolvedValue([]);

    render(<ConditionsTable />);

    await waitFor(() => {
      expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
      expect(screen.getByText('No conditions recorded')).toBeInTheDocument();
    });
  });

  it('handles missing patient UUID through service integration', async () => {
    mockUsePatientUUID.mockReturnValue('');

    render(<ConditionsTable />);

    await waitFor(() => {
      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
      expect(screen.getByText('Invalid patient UUID')).toBeInTheDocument();
    });

    expect(mockGetFormattedConditions).not.toHaveBeenCalled();
  });

  it('shows loading state during service call', async () => {
    let resolvePromise: (value: FormattedCondition[]) => void;
    const servicePromise = new Promise<FormattedCondition[]>((resolve) => {
      resolvePromise = resolve;
    });
    mockGetFormattedConditions.mockReturnValue(servicePromise);

    render(<ConditionsTable />);

    expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();

    resolvePromise!(mockConditions);
    await waitFor(() => {
      expect(screen.getByText('Chronic Cholecystitis')).toBeInTheDocument();
    });
  });
});
