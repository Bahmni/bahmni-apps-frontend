import { getConditions } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Condition } from 'fhir/r4';
import { useNotification } from '../../notification';
import ConditionsTable from '../ConditionsTable';

jest.mock('../../notification');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConditions: jest.fn(),
}));
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
const mockAddNotification = jest.fn();

const mockValidConditions: Condition[] = [
  {
    resourceType: 'Condition',
    id: 'condition-active-diabetes',
    meta: {
      versionId: '1',
      lastUpdated: '2025-03-25T06:48:32.000+00:00',
    },
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active',
        },
      ],
    },
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '73211009',
          display: 'Diabetes mellitus',
        },
      ],
    },
    subject: {
      reference: 'Patient/test-patient',
      type: 'Patient',
      display: 'John Doe',
    },
    onsetDateTime: '2023-01-15T10:30:00.000+00:00',
    recordedDate: '2023-01-15T10:30:00.000+00:00',
    recorder: {
      reference: 'Practitioner/dr-smith',
      display: 'Dr. Smith',
    },
    note: [
      {
        text: 'Patient diagnosed with Type 2 diabetes',
      },
      {
        text: 'Requires regular blood sugar monitoring',
      },
    ],
  },
];

describe('ConditionsTable', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });
  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <ConditionsTable />
    </QueryClientProvider>
  );
  it('should show conditions table when an there patient has conditions marked', async () => {
    (getConditions as jest.Mock).mockReturnValue(mockValidConditions);
    render(wrapper);
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    });
    expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(getConditions).toHaveBeenCalledTimes(1);
  });

  it('should show error state when an error occurs', async () => {
    const errorMessage = 'Failed to fetch conditions from server';
    (getConditions as jest.Mock).mockRejectedValue(new Error(errorMessage));
    render(wrapper);
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('conditions-table-error')).toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'ERROR_DEFAULT_TITLE',
        message: 'Failed to fetch conditions from server',
      });
    });
  });
});
