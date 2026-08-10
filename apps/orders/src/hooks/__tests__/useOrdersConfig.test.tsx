import { renderHook } from '@testing-library/react';
import React from 'react';
import { OrdersConfigContextType } from '../../contexts/OrdersConfigContext';
import { OrdersConfigProvider } from '../../providers/OrdersConfigProvider';
import { useOrdersConfig } from '../useOrdersConfig';

// Mock notification service
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getOrdersConfig: jest.fn(),
  getFormattedError: jest.fn((error) => ({
    title: 'Error',
    message:
      error instanceof Error ? error.message : 'An unexpected error occurred',
  })),
  notificationService: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  },
  __esModule: true,
}));

// Wrapper component to provide the OrdersConfigContext
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <OrdersConfigProvider>{children}</OrdersConfigProvider>
);

describe('useOrdersConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the context values with orders configuration', () => {
    // Mock context value
    const mockContextValue: OrdersConfigContextType = {
      ordersConfig: {
        bahmniClinicalPatientsSearchRadiologyOrderAllPatients: {
          id: 'bahmni.clinical.patients.search.RadiologyOrderAllPatients',
          extensionPointId: 'org.bahmni.patient.search',
          type: 'config',
          extensionParams: {
            searchHandler: 'emrapi.sqlSearch.patientsHasPendingOrders',
            display: 'Radiology Orders',
            translationKey: 'MODULE_LABEL_RADIOLOGY_ORDERS_KEY',
            forwardUrl:
              '../orders/#/patient/{{patientUuid}}/fulfillment/Radiology Order',
            forwardButtonTitle: 'View',
            view: 'tabular',
          },
          label: 'Radiology Order',
          order: 1,
          requiredPrivilege: 'app:orders',
        },
        bahmniClinicalPatientsSearchLabOrderAllPatients: {
          id: 'bahmni.clinical.patients.search.LabOrderAllPatients',
          extensionPointId: 'org.bahmni.patient.search',
          type: 'config',
          extensionParams: {
            searchHandler: 'emrapi.sqlSearch.patientsHasPendingLabOrders',
            display: 'Laboratory Orders',
            translationKey: 'MODULE_LABEL_LAB_ORDERS_KEY',
            forwardUrl: '../../lab/patient/{{patientUuid}}',
            targetedTab: 'Lab Entry',
            forwardButtonTitle: 'View',
            view: 'tabular',
          },
          label: 'Lab Order',
          order: 2,
          requiredPrivilege: 'app:orders',
        },
      },
      setOrdersConfig: jest.fn(),
      tabs: [
        {
          id: 'bahmni.clinical.patients.search.RadiologyOrderAllPatients',
          label: 'Radiology Order',
          display: 'Radiology Orders',
          translationKey: 'MODULE_LABEL_RADIOLOGY_ORDERS_KEY',
          order: 1,
        },
        {
          id: 'bahmni.clinical.patients.search.LabOrderAllPatients',
          label: 'Lab Order',
          display: 'Laboratory Orders',
          translationKey: 'MODULE_LABEL_LAB_ORDERS_KEY',
          order: 2,
        },
      ],
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    };

    // Mock the OrdersConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useOrdersConfig(), { wrapper });

    // Verify the hook returns the context values
    expect(result.current).toEqual(mockContextValue);
    expect(result.current.ordersConfig).toEqual(mockContextValue.ordersConfig);
    expect(result.current.tabs).toEqual(mockContextValue.tabs);
    expect(result.current.tabs).toHaveLength(2);
  });

  it('should handle error state correctly', () => {
    const mockError = new Error('Config error');

    // Mock context value with error
    const mockContextValue: OrdersConfigContextType = {
      ordersConfig: null,
      setOrdersConfig: jest.fn(),
      tabs: [],
      isLoading: false,
      setIsLoading: jest.fn(),
      error: mockError,
      setError: jest.fn(),
    };

    // Mock the OrdersConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useOrdersConfig(), { wrapper });

    // Verify the hook returns the error state
    expect(result.current.error).toEqual(mockError);
    expect(result.current.ordersConfig).toBeNull();
    expect(result.current.tabs).toEqual([]);
  });

  it('should handle loading state correctly', () => {
    // Mock context value with loading state
    const mockContextValue: OrdersConfigContextType = {
      ordersConfig: null,
      setOrdersConfig: jest.fn(),
      tabs: [],
      isLoading: true,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    };

    // Mock the OrdersConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useOrdersConfig(), { wrapper });

    // Verify the hook returns the loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.ordersConfig).toBeNull();
    expect(result.current.tabs).toEqual([]);
  });

  it('should return empty tabs when config is null', () => {
    // Mock context value with null config
    const mockContextValue: OrdersConfigContextType = {
      ordersConfig: null,
      setOrdersConfig: jest.fn(),
      tabs: [],
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    };

    // Mock the OrdersConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useOrdersConfig(), { wrapper });

    // Verify the hook returns empty tabs
    expect(result.current.tabs).toEqual([]);
    expect(result.current.ordersConfig).toBeNull();
  });

  it('should throw an error when used outside of OrdersConfigProvider', () => {
    // Suppress console.error for this test to avoid noisy output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock the OrdersConfigContext
    jest.spyOn(React, 'useContext').mockReturnValue(undefined);

    // Expect the hook to throw an error when used without a provider
    expect(() => {
      renderHook(() => useOrdersConfig());
    }).toThrow('useOrdersConfig must be used within an OrdersConfigProvider');
  });
});
