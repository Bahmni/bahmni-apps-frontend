import { getProgramByUUID } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { mockProgramWithAttributes } from '../__mocks__/mocks';
import ProgramDetails from '../ProgramDetails';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getProgramByUUID: jest.fn(),
}));

describe('ProgramDetails Integration', () => {
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
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch and display program details correctly', async () => {
    (getProgramByUUID as jest.Mock).mockResolvedValue(
      mockProgramWithAttributes,
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="enrollment-uuid-2"
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
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('patient-programs-table-loading-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-programs-tile-test-id'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByTestId('program-details-programName-value-test-id'),
    ).toHaveTextContent('TB Program');
    expect(screen.getByTestId('program-status-test-id')).toHaveTextContent(
      'Treatment Phase',
    );
    expect(screen.getByText('REG123456')).toBeInTheDocument();
    expect(screen.getByText('Category I')).toBeInTheDocument();

    expect(getProgramByUUID).toHaveBeenCalledTimes(1);
    expect(getProgramByUUID).toHaveBeenCalledWith('enrollment-uuid-2');
  });

  it('should show error state when an error occurs', async () => {
    const errorMessage = 'Failed to fetch program details from server';
    (getProgramByUUID as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="enrollment-uuid-1"
          config={{
            fields: ['programName', 'startDate', 'endDate', 'state'],
          }}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('patient-programs-table-loading-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-programs-table-error-test-id'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('ERROR_FETCHING_PROGRAM_DETAILS'),
    ).toBeInTheDocument();
  });
});
