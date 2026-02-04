import {
  getPatientRadiologyInvestigationBundleWithImagingStudy,
  getCategoryUuidFromOrderTypes,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { useNotification } from '../../notification';
import { mockCategoryUuid, mockValidBundle } from '../__mocks__/mocks';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';

jest.mock('../../notification');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientRadiologyInvestigationBundleWithImagingStudy: jest.fn(),
  getCategoryUuidFromOrderTypes: jest.fn(),
}));
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
const mockAddNotification = jest.fn();

describe('RadiologyInvestigationTable', () => {
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
      <RadiologyInvestigationTable config={{ orderType: 'Radiology Order' }} />
    </QueryClientProvider>
  );

  it('should show radiology investigations table when patient has investigations', async () => {
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
    expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(
      getPatientRadiologyInvestigationBundleWithImagingStudy,
    ).toHaveBeenCalledTimes(1);
  });

  it('should show error state when an error occurs', async () => {
    (getCategoryUuidFromOrderTypes as jest.Mock).mockResolvedValue(
      mockCategoryUuid,
    );
    const errorMessage = 'Failed to fetch radiology investigations from server';
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
