import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';
import { useClinicalConfig } from '../useClinicalConfig';
import { getConfig } from '@services/configService';
import { ClinicalConfig } from '@types/config';
import notificationService from '@services/notificationService';

// Mock the configService and notificationService
jest.mock('@services/configService');
jest.mock('@services/notificationService', () => ({
  showError: jest.fn(),
}));

describe('useClinicalConfig Integration', () => {
  // Mock ClinicalConfig matching the schema
  const mockAppConfig: ClinicalConfig = {
    patientInformation: {},
    actions: [],
    dashboards: [
      {
        name: 'Department 1',
        url: 'http://example.com/dept1',
        requiredPrivileges: ['VIEW_DEPT1'],
        icon: 'fa fa-dashboard',
        default: true,
      },
      {
        name: 'Department 2',
        url: 'http://example.com/dept2',
        requiredPrivileges: ['VIEW_DEPT2'],
        icon: 'fa fa-chart',
        default: false,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle loading states correctly', async () => {
    // Mock a delayed response
    (getConfig as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockAppConfig), 100)),
    );

    const TestComponent = () => {
      const { isLoading } = useClinicalConfig();
      return (
        <div data-testid="loading-state">
          {isLoading ? 'Loading' : 'Loaded'}
        </div>
      );
    };

    const { getByTestId } = render(
      <ClinicalConfigProvider>
        <TestComponent />
      </ClinicalConfigProvider>,
    );

    // Initially it should be loading
    expect(getByTestId('loading-state').textContent).toBe('Loading');

    // After the config is loaded, it should not be loading
    await waitFor(() => {
      expect(getByTestId('loading-state').textContent).toBe('Loaded');
    });
  });

  it('should handle error states and show notification', async () => {
    // Mock an error response
    const mockError = new Error('Failed to fetch config');
    (getConfig as jest.Mock).mockRejectedValueOnce(mockError);

    const TestComponent = () => {
      const { error, clinicalConfig } = useClinicalConfig();
      return (
        <div data-testid="error-state">
          {error ? 'Error' : 'No Error'} | Config:{' '}
          {JSON.stringify(clinicalConfig)}
        </div>
      );
    };

    const { getByTestId } = render(
      <ClinicalConfigProvider>
        <TestComponent />
      </ClinicalConfigProvider>,
    );

    // Wait for the error to be processed
    await waitFor(() => {
      expect(getByTestId('error-state').textContent).toContain('Error');
      expect(getByTestId('error-state').textContent).toContain('Config: null');
    });

    // Verify notification service was called
    expect(notificationService.showError).toHaveBeenCalled();
  });
});
