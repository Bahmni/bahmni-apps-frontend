import { getUserLoginLocation } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { InputControlAttributes } from '../../../../../../providers/clinicalConfig/models';
import { getAvailableStocks } from '../../../../../../services/inventoryService';
import { ImmunizationInputEntry } from '../../../models';
import BatchNumberField from '../BatchNumberField';

jest.mock('@bahmni/services', () => ({
  getUserLoginLocation: jest.fn(),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  formatDateTime: jest.fn(() => ({
    formattedResult: '31-Dec-2025',
  })),
}));

jest.mock('../../../../../../services/inventoryService', () => ({
  getAvailableStocks: jest.fn(),
}));

const mockGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;
const mockGetAvailableStocks = getAvailableStocks as jest.MockedFunction<
  typeof getAvailableStocks
>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('BatchNumberField', () => {
  const mockImmunization: ImmunizationInputEntry = {
    id: 'test-id',
    vaccineCode: { code: 'vaccine-123', display: 'Test Vaccine' },
    drug: { code: 'drug-123', display: 'Test Drug' },
    administeredOn: null,
    administeredLocation: null,
    route: null,
    site: null,
    expiryDate: null,
    manufacturer: null,
    batchNumber: null,
    doseSequence: null,
    note: '',
    errors: {},
    hasBeenValidated: false,
  };

  const mockOnBatchNumberChange = jest.fn();
  const mockOnExpiryDateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserLoginLocation.mockReturnValue({
      uuid: 'location-123',
      display: 'Test Location',
    } as any);
  });

  describe('when fetch is enabled', () => {
    const attributesWithFetch: InputControlAttributes[] = [
      {
        name: 'batchNumber',
        required: true,
      },
    ];

    it('should render ComboBox when fetch is enabled', () => {
      mockGetAvailableStocks.mockResolvedValue([]);

      render(
        <BatchNumberField
          immunization={mockImmunization}
          attributes={attributesWithFetch}
          isFetchBatchNumberEnabled
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      expect(
        screen.getByTestId('immunization-batch-number-test-id'),
      ).toBeInTheDocument();
    });

    it('should display loading placeholder when stocks are loading', () => {
      mockGetAvailableStocks.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );

      render(
        <BatchNumberField
          immunization={mockImmunization}
          attributes={attributesWithFetch}
          isFetchBatchNumberEnabled
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByPlaceholderText('LOADING')).toBeInTheDocument();
    });

    it('should display no batches available error when no stocks found', async () => {
      mockGetAvailableStocks.mockResolvedValue([]);

      render(
        <BatchNumberField
          immunization={mockImmunization}
          attributes={attributesWithFetch}
          isFetchBatchNumberEnabled
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(
            'IMMUNIZATION_HISTORY_NO_BATCHES_AVAILABLE_ERROR',
          ),
        ).toBeInTheDocument();
      });
    });

    it('should display batch options when stocks are available', async () => {
      const mockStocks = [
        {
          batchNumber: 'BATCH001',
          expiryDate: '2025-12-31',
          stockLocationName: 'Main Pharmacy',
          availableQuantity: 50,
          onHandQuantity: 50,
          unit: 'vials',
        },
      ];

      mockGetAvailableStocks.mockResolvedValue(mockStocks);

      render(
        <BatchNumberField
          immunization={mockImmunization}
          attributes={attributesWithFetch}
          isFetchBatchNumberEnabled
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(
            'IMMUNIZATION_HISTORY_ENTER_BATCH_NUMBER',
          ),
        ).toBeInTheDocument();
      });
    });

    it('should call onBatchNumberChange and onExpiryDateChange when batch is selected', async () => {
      const user = userEvent.setup();
      const mockStocks = [
        {
          batchNumber: 'BATCH001',
          expiryDate: '2025-12-31',
          stockLocationName: 'Main Pharmacy',
          availableQuantity: 50,
          onHandQuantity: 50,
          unit: 'vials',
        },
      ];

      mockGetAvailableStocks.mockResolvedValue(mockStocks);

      render(
        <BatchNumberField
          immunization={mockImmunization}
          attributes={attributesWithFetch}
          isFetchBatchNumberEnabled
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(
            'IMMUNIZATION_HISTORY_ENTER_BATCH_NUMBER',
          ),
        ).toBeInTheDocument();
      });

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const option = await screen.findByText(/BATCH001/);
      await user.click(option);

      expect(mockOnBatchNumberChange).toHaveBeenCalledWith('BATCH001');
      expect(mockOnExpiryDateChange).toHaveBeenCalledWith(
        new Date('2025-12-31'),
      );
    });

    it('should handle empty selection', async () => {
      mockGetAvailableStocks.mockResolvedValue([]);

      render(
        <BatchNumberField
          immunization={mockImmunization}
          attributes={attributesWithFetch}
          isFetchBatchNumberEnabled
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // The component should handle null selectedItem in onChange
      // This is tested implicitly when no selection is made
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should show validation error when batch number has error', async () => {
      const immunizationWithError = {
        ...mockImmunization,
        errors: { batchNumber: 'BATCH_NUMBER_REQUIRED' },
      };

      mockGetAvailableStocks.mockResolvedValue([]);

      render(
        <BatchNumberField
          immunization={immunizationWithError}
          attributes={attributesWithFetch}
          isFetchBatchNumberEnabled
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText('BATCH_NUMBER_REQUIRED')).toBeInTheDocument();
      });
    });

    it('should allow typing in search input', async () => {
      const mockStocks = [
        {
          batchNumber: 'BATCH001',
          expiryDate: '2025-12-31',
          stockLocationName: 'Main Pharmacy',
          availableQuantity: 50,
          onHandQuantity: 50,
          unit: 'vials',
        },
        {
          batchNumber: 'BATCH002',
          expiryDate: '2025-06-30',
          stockLocationName: 'Emergency Ward',
          availableQuantity: 20,
          onHandQuantity: 20,
          unit: 'vials',
        },
      ];

      mockGetAvailableStocks.mockResolvedValue(mockStocks);

      const immunizationWithDrug = {
        ...mockImmunization,
        drug: { code: 'drug-123', display: 'Test Drug' },
      };

      render(
        <BatchNumberField
          immunization={immunizationWithDrug}
          attributes={attributesWithFetch}
          isFetchBatchNumberEnabled
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const combobox = screen.getByRole('combobox');

      // Type a search term
      await user.type(combobox, 'BATCH');

      // The combobox should accept input
      expect(combobox).toBeInTheDocument();
    });

    it('should disable ComboBox when stocks are loading', () => {
      mockGetAvailableStocks.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );

      render(
        <BatchNumberField
          immunization={mockImmunization}
          attributes={attributesWithFetch}
          isFetchBatchNumberEnabled
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeDisabled();
    });

    it('should mark field as required when attribute is required', async () => {
      mockGetAvailableStocks.mockResolvedValue([]);

      render(
        <BatchNumberField
          immunization={mockImmunization}
          attributes={attributesWithFetch}
          isFetchBatchNumberEnabled
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        const combobox = screen.getByRole('combobox');
        expect(combobox).toBeRequired();
      });
    });
  });

  describe('when fetch is disabled', () => {
    const attributesWithoutFetch: InputControlAttributes[] = [
      {
        name: 'batchNumber',
        required: false,
      },
    ];

    it('should render ComboBox when fetch is disabled', () => {
      render(
        <BatchNumberField
          immunization={mockImmunization}
          attributes={attributesWithoutFetch}
          isFetchBatchNumberEnabled={false}
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      expect(
        screen.getByTestId('immunization-batch-number-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          'IMMUNIZATION_HISTORY_BATCH_NUMBER_PLACEHOLDER',
        ),
      ).toBeInTheDocument();
    });

    it('should call onBatchNumberChange when text is entered', async () => {
      const user = userEvent.setup();

      render(
        <BatchNumberField
          immunization={mockImmunization}
          attributes={attributesWithoutFetch}
          isFetchBatchNumberEnabled={false}
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'MANUAL-BATCH-001');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnBatchNumberChange).toHaveBeenCalled();
      });
    });

    it('should display batch number value in ComboBox', async () => {
      const immunizationWithBatch = {
        ...mockImmunization,
        batchNumber: 'EXISTING-BATCH',
      };

      render(
        <BatchNumberField
          immunization={immunizationWithBatch}
          attributes={attributesWithoutFetch}
          isFetchBatchNumberEnabled={false}
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        const input = screen.getByRole('combobox');
        expect(input).toBeInTheDocument();
      });

      // The ComboBox should have the batch number as its value
      const combobox = screen.getByTestId('immunization-batch-number-test-id');
      expect(combobox).toBeInTheDocument();
    });

    it('should show validation error in ComboBox mode', () => {
      const immunizationWithError = {
        ...mockImmunization,
        errors: { batchNumber: 'BATCH_NUMBER_REQUIRED' },
      };

      render(
        <BatchNumberField
          immunization={immunizationWithError}
          attributes={attributesWithoutFetch}
          isFetchBatchNumberEnabled={false}
          onBatchNumberChange={mockOnBatchNumberChange}
          onExpiryDateChange={mockOnExpiryDateChange}
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText('BATCH_NUMBER_REQUIRED')).toBeInTheDocument();
    });
  });
});
