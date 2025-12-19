import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PatientProgramsTable from '../PatientProgramsTable';

expect.extend(toHaveNoViolations);

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientPrograms: jest.fn(),
}));

describe('PatientProgramsTable', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <PatientProgramsTable
        config={{
          fields: ['programName', 'startDate', 'endDate', 'state', 'outcome'],
        }}
      />
    </QueryClientProvider>
  );

  it('should show loading state when data is loading', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isError: false,
      isLoading: true,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
  });

  it('should show error state when an error occurs', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: new Error('An unexpected error occurred'),
      isError: true,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
  });

  it('should show empty state when there is no data', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
  });

  it('should show programs table when patient has programs', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'program-1',
          uuid: 'program-uuid-1',
          programName: 'HIV Program',
          dateEnrolled: '2023-01-15T10:30:00.000+00:00',
          dateCompleted: null,
          outcomeName: null,
          outcomeDetails: null,
          currentStateName: 'On ART',
          attributes: {},
        },
        {
          id: 'program-2',
          uuid: 'program-uuid-2',
          programName: 'TB Program',
          dateEnrolled: '2022-06-10T08:15:00.000+00:00',
          dateCompleted: '2023-01-10T08:15:00.000+00:00',
          outcomeName: 'Cured',
          outcomeDetails: 'Patient completed treatment successfully',
          currentStateName: 'Treatment Complete',
          attributes: {},
        },
      ],
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('HIV Program')).toBeInTheDocument();
    const activeStateTag = screen.getByTestId('program-uuid-1-state-test-id');
    expect(activeStateTag).toHaveTextContent('On ART');
    expect(screen.getByText('TB Program')).toBeInTheDocument();
    const completedStateTag = screen.getByTestId(
      'program-uuid-2-state-test-id',
    );
    expect(completedStateTag).toHaveTextContent('Treatment Complete');
    expect(screen.getByText('Cured')).toBeInTheDocument();
  });

  it('should render custom program attributes', () => {
    const wrapperWithAttributes = (
      <QueryClientProvider client={queryClient}>
        <PatientProgramsTable
          config={{
            fields: [
              'programName',
              'Registration Number',
              'Treatment Category',
              'startDate',
              'state',
            ],
          }}
        />
      </QueryClientProvider>
    );

    (useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'program-1',
          uuid: 'program-uuid-1',
          programName: 'HIV Program',
          dateEnrolled: '2023-01-15T10:30:00.000+00:00',
          dateCompleted: null,
          outcomeName: null,
          outcomeDetails: null,
          currentStateName: null,
          attributes: {
            'Registration Number': 'REG123456',
            'Treatment Category': 'Category I',
          },
        },
        {
          id: 'program-2',
          uuid: 'program-uuid-2',
          programName: 'TB Program',
          dateEnrolled: '2022-06-10T08:15:00.000+00:00',
          dateCompleted: '2023-01-10T08:15:00.000+00:00',
          outcomeName: 'Cured',
          outcomeDetails: 'Patient completed treatment successfully',
          currentStateName: 'Treatment Complete',
          attributes: {
            'Registration Number': 'REG789012',
            'Treatment Category': null,
          },
        },
      ],
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapperWithAttributes);
    expect(
      screen.getByTestId('patient-programs-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('REG123456')).toBeInTheDocument();
    expect(screen.getByText('Category I')).toBeInTheDocument();
    expect(screen.getByText('REG789012')).toBeInTheDocument();
    const nullAttributeCell = screen.getByTestId(
      'program-uuid-2-Treatment Category-test-id',
    );
    expect(nullAttributeCell).toHaveTextContent('-');
  });

  it('should match snapshot with program data', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'program-1',
          uuid: 'program-uuid-1',
          programName: 'HIV Program',
          dateEnrolled: '2023-01-15T10:30:00.000+00:00',
          dateCompleted: null,
          outcomeName: null,
          outcomeDetails: null,
          currentStateName: 'On ART',
          attributes: {},
        },
        {
          id: 'program-2',
          uuid: 'program-uuid-2',
          programName: 'TB Program',
          dateEnrolled: '2022-06-10T08:15:00.000+00:00',
          dateCompleted: '2023-01-10T08:15:00.000+00:00',
          outcomeName: 'Cured',
          outcomeDetails: 'Patient completed treatment successfully',
          currentStateName: 'Treatment Complete',
          attributes: {},
        },
      ],
      error: null,
      isError: false,
      isLoading: false,
    });
    const { container } = render(wrapper);
    expect(container).toMatchSnapshot();
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [
          {
            id: 'program-1',
            uuid: 'program-uuid-1',
            programName: 'HIV Program',
            dateEnrolled: '2023-01-15T10:30:00.000+00:00',
            dateCompleted: null,
            outcomeName: null,
            outcomeDetails: null,
            currentStateName: 'On ART',
            attributes: {},
          },
          {
            id: 'program-2',
            uuid: 'program-uuid-2',
            programName: 'TB Program',
            dateEnrolled: '2022-06-10T08:15:00.000+00:00',
            dateCompleted: '2023-01-10T08:15:00.000+00:00',
            outcomeName: 'Cured',
            outcomeDetails: 'Patient completed treatment successfully',
            currentStateName: 'Treatment Complete',
            attributes: {},
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
