import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ProgramDetails from '../ProgramDetails';

expect.extend(toHaveNoViolations);

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
}));

describe('ProgramDetails', () => {
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
      <ProgramDetails
        programUUID="test-program-uuid"
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
      screen.getByTestId('patient-programs-table-loading-test-id'),
    ).toBeInTheDocument();
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
      screen.getByTestId('patient-programs-table-error-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('patient-programs-table-error-test-id'),
    ).toHaveTextContent('ERROR_FETCHING_PROGRAM_DETAILS');
  });

  it('should show error state when an program uuid is falsy', () => {
    const wrapperWithAttributes = (
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID=""
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
    render(wrapperWithAttributes);
    expect(
      screen.getByTestId('patient-programs-table-error-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('patient-programs-table-error-test-id'),
    ).toHaveTextContent('ERROR_FETCHING_PROGRAM_DETAILS');
  });

  it('should display program details and handle missing values gracefully', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: '2023-01-14T10:30:00.000+00:00',
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: null,
        attributes: {},
      },
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-tile-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('program-details-programName-value-test-id'),
    ).toHaveTextContent('TB Program');
    expect(
      screen.getByTestId('program-details-endDate-value-test-id'),
    ).toHaveTextContent('14/01/2023');
    expect(
      screen.getByTestId('program-details-state-value-test-id'),
    ).toHaveTextContent('-');
    expect(
      screen.getByTestId('program-details-outcome-value-test-id'),
    ).toHaveTextContent('-');
  });

  it('should render custom program attributes with values and missing values', () => {
    const wrapperWithAttributes = (
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="test-program-uuid"
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
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: 'Treatment Phase',
        attributes: {
          'Registration Number': 'REG123456',
        },
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapperWithAttributes);
    expect(
      screen.getByTestId('patient-programs-tile-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('program-details-Registration Number-value-test-id'),
    ).toHaveTextContent('REG123456');
    expect(
      screen.getByTestId('program-details-Treatment Category-value-test-id'),
    ).toHaveTextContent('-');
  });

  it('should not render description items when config fields is undefined', () => {
    const wrapperWithoutFields = (
      <QueryClientProvider client={queryClient}>
        <ProgramDetails programUUID="test-program-uuid" config={{} as any} />
      </QueryClientProvider>
    );

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: 'Treatment Phase',
        attributes: {},
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapperWithoutFields);
    expect(
      screen.getByTestId('patient-programs-tile-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('TB Program')).toBeInTheDocument();
    expect(
      screen.queryByTestId(/program-details-.*-value-test-id/),
    ).not.toBeInTheDocument();
  });

  describe('Snapshot', () => {
    it('should match snapshot with program data', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: {
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
        error: null,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: {
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
