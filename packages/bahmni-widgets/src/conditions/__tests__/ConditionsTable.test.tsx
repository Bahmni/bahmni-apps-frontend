import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useNotification } from '../../notification';
import ConditionsTable from '../ConditionsTable';

expect.extend(toHaveNoViolations);

jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConditions: jest.fn(),
}));
const mockAddNotification = jest.fn();

describe('ConditionsTable', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
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
  it('should show loading state when data is loading', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isError: null,
      isLoading: true,
    });
    render(wrapper);
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(screen.getByTestId('conditions-table-skeleton')).toBeInTheDocument();
  });

  it('should show error state when an error occurs', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: new Error('An unexpected error occured'),
      isError: true,
      isLoading: false,
    });
    render(wrapper);
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(screen.getByTestId('conditions-table-error')).toBeInTheDocument();
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'ERROR_DEFAULT_TITLE',
      message: 'An unexpected error occured',
    });
  });

  it('should show empty state when an there is no data', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(screen.getByTestId('conditions-table-empty')).toBeInTheDocument();
  });

  it('should show conditions table when an there patient has conditions marked', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          code: '73211009',
          codeDisplay: 'Diabetes mellitus',
          display: 'Diabetes mellitus',
          id: 'condition-active-diabetes',
          note: [
            'Patient diagnosed with Type 2 diabetes',
            'Requires regular blood sugar monitoring',
          ],
          onsetDate: '2023-01-15T10:30:00.000+00:00',
          recordedDate: '2023-01-15T10:30:00.000+00:00',
          recorder: 'Dr. Smith',
          status: 'active',
        },
        {
          code: '73211008',
          codeDisplay: 'High blood pressure',
          display: 'High blood pressure',
          id: 'condition-inactive-hypertension',
          note: undefined,
          recordedDate: '2022-06-10T08:15:00.000+00:00',
          recorder: 'Dr. Johnson',
          status: 'inactive',
        },
      ],
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    expect(screen.getByText('Diabetes mellitus')).toBeInTheDocument();
    const activeStatusTag = screen.getByTestId('condition-status-73211009');
    expect(activeStatusTag).toHaveTextContent('CONDITION_LIST_ACTIVE');
    expect(
      screen.getByText('CONDITION_ONSET_SINCE_FORMAT'),
    ).toBeInTheDocument();
    expect(screen.getByText('High blood pressure')).toBeInTheDocument();
    const inactiveStatusTag = screen.getByTestId('condition-status-73211008');
    expect(inactiveStatusTag).toHaveTextContent('CONDITION_LIST_INACTIVE');
    expect(
      screen.getByText('CONDITION_TABLE_NOT_AVAILABLE'),
    ).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [
          {
            code: '73211009',
            codeDisplay: 'Diabetes mellitus',
            display: 'Diabetes mellitus',
            id: 'condition-active-diabetes',
            note: [
              'Patient diagnosed with Type 2 diabetes',
              'Requires regular blood sugar monitoring',
            ],
            onsetDate: '2023-01-15T10:30:00.000+00:00',
            recordedDate: '2023-01-15T10:30:00.000+00:00',
            recorder: 'Dr. Smith',
            status: 'active',
          },
          {
            code: '73211008',
            codeDisplay: 'High blood pressure',
            display: 'High blood pressure',
            id: 'condition-inactive-hypertension',
            note: undefined,
            recordedDate: '2022-06-10T08:15:00.000+00:00',
            recorder: 'Dr. Johnson',
            status: 'inactive',
          },
        ],
        error: null,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
