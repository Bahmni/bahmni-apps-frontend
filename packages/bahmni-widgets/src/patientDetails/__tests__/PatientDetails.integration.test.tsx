import {
  getFormattedPatientById,
  getPatientPhotoDataUrl,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PatientDetails from '../PatientDetails';
import { mockFullPatient } from './__mocks__/patientDetailsMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFormattedPatientById: jest.fn(),
  getPatientPhotoDataUrl: jest.fn(),
}));

const mockedGetFormattedPatientById =
  getFormattedPatientById as jest.MockedFunction<
    typeof getFormattedPatientById
  >;
const mockedGetPatientPhotoDataUrl =
  getPatientPhotoDataUrl as jest.MockedFunction<typeof getPatientPhotoDataUrl>;

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderPatientDetails = (queryClient: QueryClient) =>
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/patient/test-uuid']}>
        <Routes>
          <Route path="/patient/:patientUuid" element={<PatientDetails />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('PatientDetails Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-03-16'));
    queryClient = createQueryClient();
    mockedGetPatientPhotoDataUrl.mockResolvedValue(
      'data:image/jpeg;base64,/9j/photo==',
    );
  });

  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
  });

  it('integrates usePatient hook with loading to success state', async () => {
    mockedGetFormattedPatientById.mockResolvedValue(mockFullPatient);

    renderPatientDetails(queryClient);

    await waitFor(() => {
      expect(screen.getByTestId('patient-name')).toHaveTextContent('John Doe');
    });

    expect(screen.getByText('MRN123456 | OP789')).toBeInTheDocument();
    expect(screen.getByText('male')).toBeInTheDocument();
    expect(screen.getByText(/35YEARS 2MONTHS 15DAYS/)).toBeInTheDocument();
  });

  it('renders patient photo when query resolves', async () => {
    mockedGetFormattedPatientById.mockResolvedValue(mockFullPatient);

    renderPatientDetails(queryClient);

    await waitFor(() => {
      expect(screen.getByTestId('patient-photo-test-id')).toHaveAttribute(
        'src',
        'data:image/jpeg;base64,/9j/photo==',
      );
    });
  });

  it('does not render photo when photo query fails', async () => {
    mockedGetFormattedPatientById.mockResolvedValue(mockFullPatient);
    mockedGetPatientPhotoDataUrl.mockRejectedValue(new Error('No photo'));

    renderPatientDetails(queryClient);

    await waitFor(() => {
      expect(screen.getByTestId('patient-name')).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId('patient-photo-test-id'),
    ).not.toBeInTheDocument();
  });

  it('integrates usePatient hook with error state', async () => {
    mockedGetFormattedPatientById.mockRejectedValue(new Error('Network error'));

    renderPatientDetails(queryClient);

    await waitFor(() => {
      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
    });
  });

  it('integrates usePatient hook with loading state', () => {
    mockedGetFormattedPatientById.mockImplementation(
      () => new Promise(() => {}),
    );

    renderPatientDetails(queryClient);

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('integrates translation system with singular age formatting', async () => {
    const mockPatient: FormattedPatientData = {
      id: 'test-uuid',
      fullName: 'Jane Doe',
      gender: 'female',
      birthDate: '2024-02-15',
      formattedAddress: null,
      formattedContact: null,
      identifiers: new Map([['ID', 'ID123']]),
    };

    mockedGetFormattedPatientById.mockResolvedValue(mockPatient);

    renderPatientDetails(queryClient);

    await waitFor(() => {
      expect(screen.getByText(/1YEARS 1MONTHS 1DAYS/)).toBeInTheDocument();
    });
  });
});
