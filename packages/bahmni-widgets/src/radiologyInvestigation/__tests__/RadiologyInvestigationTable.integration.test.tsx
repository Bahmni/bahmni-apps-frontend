import {
  getPatientRadiologyInvestigationBundleWithImagingStudy,
  getCategoryUuidFromOrderTypes,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useNotification } from '../../notification';
import { mockCategoryUuid, mockValidBundle } from '../__mocks__/mocks';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';

jest.mock('../../notification');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientRadiologyInvestigationBundleWithImagingStudy: jest.fn(),
  getCategoryUuidFromOrderTypes: jest.fn(),
}));

const mockAddNotification = jest.fn();

describe('RadiologyInvestigationTable Integration', () => {
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
    <MemoryRouter initialEntries={['/patient/test-patient-uuid']}>
      <Routes>
        <Route
          path="/patient/:patientUuid"
          element={
            <QueryClientProvider client={queryClient}>
              <RadiologyInvestigationTable
                config={{ orderType: 'Radiology Order' }}
              />
            </QueryClientProvider>
          }
        />
      </Routes>
    </MemoryRouter>
  );

  describe('Component States', () => {
    it('shows loading state during service call', () => {
      (getCategoryUuidFromOrderTypes as jest.Mock).mockResolvedValue(
        mockCategoryUuid,
      );
      (
        getPatientRadiologyInvestigationBundleWithImagingStudy as jest.Mock
      ).mockImplementation(() => new Promise(() => {}));

      render(wrapper);

      expect(
        screen.getByTestId('radiology-investigations-table-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('radiology-investigations-table-skeleton'),
      ).toBeInTheDocument();
    });

    it('shows empty state when patient has no recorded radiology investigations', async () => {
      (getCategoryUuidFromOrderTypes as jest.Mock).mockResolvedValue(
        mockCategoryUuid,
      );
      (
        getPatientRadiologyInvestigationBundleWithImagingStudy as jest.Mock
      ).mockResolvedValue([]);

      render(wrapper);

      expect(
        screen.getByTestId('radiology-investigations-table-test-id'),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByTestId('radiology-investigations-table-empty'),
        ).toBeInTheDocument();
      });
    });

    it('shows error state when radiology investigation data cannot be fetched', async () => {
      (getCategoryUuidFromOrderTypes as jest.Mock).mockResolvedValue(
        mockCategoryUuid,
      );
      const errorMessage =
        'Failed to fetch radiology investigations from server';
      (
        getPatientRadiologyInvestigationBundleWithImagingStudy as jest.Mock
      ).mockRejectedValue(new Error(errorMessage));

      render(wrapper);

      expect(
        screen.getByTestId('radiology-investigations-table-test-id'),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByTestId('radiology-investigations-table-error'),
        ).toBeInTheDocument();
        expect(mockAddNotification).toHaveBeenCalledWith({
          type: 'error',
          title: 'ERROR_DEFAULT_TITLE',
          message: 'Failed to fetch radiology investigations from server',
        });
      });
    });
  });

  describe('Data Display', () => {
    it('displays patient radiology investigations with all critical information for clinical review', async () => {
      (getCategoryUuidFromOrderTypes as jest.Mock).mockResolvedValue(
        mockCategoryUuid,
      );
      (
        getPatientRadiologyInvestigationBundleWithImagingStudy as jest.Mock
      ).mockReturnValue(mockValidBundle);

      render(wrapper);

      expect(
        screen.getByTestId('radiology-investigations-table-test-id'),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
      });

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(
        getPatientRadiologyInvestigationBundleWithImagingStudy,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
