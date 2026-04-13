import {
  getPatientDiagnoses,
  useSubscribeConsultationSaved,
  Diagnosis,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useNotification } from '../../notification';
import DiagnosesTable from '../DiagnosesTable';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientDiagnoses: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));

jest.mock('../../notification');

const mockAddNotification = jest.fn();

const mockDiagnoses: Diagnosis[] = [
  {
    id: '1',
    display: 'Hypertension',
    certainty: {
      code: 'confirmed',
      display: 'CERTAINITY_CONFIRMED',
      system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    },
    recordedDate: '2024-03-15T10:30:00+00:00',
    recorder: 'Dr. Smith',
  },
  {
    id: '2',
    display: 'Type 2 Diabetes',
    certainty: {
      code: 'provisional',
      display: 'CERTAINITY_PROVISIONAL',
      system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    },
    recordedDate: '2024-01-20T14:15:00+00:00',
    recorder: 'Dr. Johnson',
  },
];

const renderWithQueryClient = (
  component: React.ReactElement,
  patientUuid = 'patient-123',
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  return render(
    <MemoryRouter initialEntries={[`/patient/${patientUuid}`]}>
      <Routes>
        <Route
          path="/patient/:patientUuid"
          element={
            <QueryClientProvider client={queryClient}>
              {component}
            </QueryClientProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
};

describe('DiagnosesTable Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    (useSubscribeConsultationSaved as jest.Mock).mockImplementation(() => {});
  });

  describe('Component States', () => {
    it('shows loading state during service call', async () => {
      let resolvePromise: (value: Diagnosis[]) => void;
      const servicePromise = new Promise<Diagnosis[]>((resolve) => {
        resolvePromise = resolve;
      });
      (getPatientDiagnoses as jest.Mock).mockReturnValue(servicePromise);

      renderWithQueryClient(<DiagnosesTable />);

      expect(
        screen.getByTestId('diagnoses-table-skeleton'),
      ).toBeInTheDocument();

      resolvePromise!(mockDiagnoses);
      await waitFor(() => {
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
      });
    });

    it('shows empty state when patient has no recorded diagnoses', async () => {
      (getPatientDiagnoses as jest.Mock).mockResolvedValue([]);

      renderWithQueryClient(<DiagnosesTable />);

      await waitFor(() => {
        expect(screen.getByTestId('diagnoses-table-empty')).toBeInTheDocument();
        expect(screen.getByText('NO_DIAGNOSES')).toBeInTheDocument();
      });
    });

    it('shows error state when diagnosis data cannot be fetched', async () => {
      const serviceError = new Error('Network timeout');
      (getPatientDiagnoses as jest.Mock).mockRejectedValue(serviceError);

      renderWithQueryClient(<DiagnosesTable />);

      await waitFor(() => {
        expect(screen.getByTestId('diagnoses-table-error')).toBeInTheDocument();
        expect(screen.getByText(/Network timeout/)).toBeInTheDocument();
      });

      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'ERROR_DEFAULT_TITLE',
        message: 'Network timeout',
        type: 'error',
      });
    });

    it('handles missing patient UUID - query is disabled', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: 0 } },
      });
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={
                <QueryClientProvider client={queryClient}>
                  <DiagnosesTable />
                </QueryClientProvider>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('diagnoses-table-empty')).toBeInTheDocument();
      });

      expect(getPatientDiagnoses).not.toHaveBeenCalled();
    });
  });

  describe('Data Display', () => {
    it('renders diagnoses from service through complete data flow', async () => {
      (getPatientDiagnoses as jest.Mock).mockResolvedValue(mockDiagnoses);

      renderWithQueryClient(<DiagnosesTable />);

      await waitFor(() => {
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
        expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
        expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
        expect(screen.getByText('CERTAINITY_CONFIRMED')).toBeInTheDocument();
        expect(screen.getByText('CERTAINITY_PROVISIONAL')).toBeInTheDocument();
      });

      expect(getPatientDiagnoses).toHaveBeenCalledWith('patient-123');
    });
  });

  describe('Consultation Events', () => {
    it('registers consultation saved event listener', async () => {
      (getPatientDiagnoses as jest.Mock).mockResolvedValue(mockDiagnoses);

      renderWithQueryClient(<DiagnosesTable />);

      await waitFor(() => {
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
      });

      expect(useSubscribeConsultationSaved).toHaveBeenCalled();
    });

    it('refetches data when consultation saved event is triggered', async () => {
      let eventCallback: any;
      (useSubscribeConsultationSaved as jest.Mock).mockImplementation(
        (callback) => {
          eventCallback = callback;
        },
      );

      (getPatientDiagnoses as jest.Mock).mockResolvedValue(mockDiagnoses);

      renderWithQueryClient(<DiagnosesTable />);

      await waitFor(() => {
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
      });

      expect(getPatientDiagnoses).toHaveBeenCalledTimes(1);

      const updatedDiagnoses: Diagnosis[] = [
        ...mockDiagnoses,
        {
          id: '3',
          display: 'Asthma',
          certainty: {
            code: 'confirmed',
            display: 'CERTAINITY_CONFIRMED',
            system:
              'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          },
          recordedDate: '2024-03-16T10:30:00+00:00',
          recorder: 'Dr. Wilson',
        },
      ];
      (getPatientDiagnoses as jest.Mock).mockResolvedValue(updatedDiagnoses);

      eventCallback({
        patientUUID: 'patient-123',
        updatedResources: { conditions: true, allergies: false },
      });

      await waitFor(() => {
        expect(getPatientDiagnoses).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Asthma')).toBeInTheDocument();
      });
    });
  });
});
