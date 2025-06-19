import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import InvestigationsForm from '../InvestigationsForm';
import { NotificationProvider } from '@providers/NotificationProvider';
import { ValueSet } from 'fhir/r4';
import useServiceRequestStore from '@stores/serviceRequestStore';

// Mock only the API layer
jest.mock('@services/api', () => ({
  get: jest.fn(),
}));

jest.mock('@stores/serviceRequestStore');
Element.prototype.scrollIntoView = jest.fn();

import { get } from '@services/api';
import { ServiceRequestInputEntry } from '@types/serviceRequest';

// Mock data for the ValueSet response
const mockValueSetResponse: ValueSet = {
  resourceType: 'ValueSet',
  status: 'active',
  expansion: {
    timestamp: new Date().toISOString(),
    contains: [
      {
        code: 'lab',
        display: 'Laboratory',
        contains: [
          {
            code: 'hematology',
            display: 'Hematology',
            contains: [
              {
                code: 'cbc-001',
                display: 'Complete Blood Count',
              },
              {
                code: 'hb-001',
                display: 'Hemoglobin',
              },
            ],
          },
          {
            code: 'biochemistry',
            display: 'Biochemistry',
            contains: [
              {
                code: 'glucose-001',
                display: 'Blood Glucose Test',
              },
              {
                code: 'lipid-001',
                display: 'Lipid Profile',
              },
            ],
          },
        ],
      },
      {
        code: 'rad',
        display: 'Radiology',
        contains: [
          {
            code: 'xray',
            display: 'X-Ray',
            contains: [
              {
                code: 'xray-chest-001',
                display: 'Chest X-Ray',
              },
              {
                code: 'xray-abdomen-001',
                display: 'Abdomen X-Ray',
              },
            ],
          },
          {
            code: 'ct',
            display: 'CT Scan',
            contains: [
              {
                code: 'ct-head-001',
                display: 'CT Head',
              },
            ],
          },
        ],
      },
    ],
  },
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <NotificationProvider>{component}</NotificationProvider>
    </I18nextProvider>,
  );
};

describe('InvestigationsForm Integration Tests', () => {
  const mockStore = {
    selectedServiceRequests: new Map<string, ServiceRequestInputEntry[]>(),
    addServiceRequest: jest.fn(),
    removeServiceRequest: jest.fn(),
    updatePriority: jest.fn(),
    reset: jest.fn(),
    getState: jest.fn(() => ({
      selectedServiceRequests: new Map<string, ServiceRequestInputEntry[]>(),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock for successful API response
    (get as jest.Mock).mockResolvedValue(mockValueSetResponse);
    (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(mockStore);
    mockStore.reset();
  });

  describe('Component Initialization and Search', () => {
    test('should load investigations on component mount and display them when searching', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      // Verify the form renders with title
      expect(screen.getByText('Order Investigations')).toBeInTheDocument();

      // Verify the search combobox is present
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();

      // Type in the search box
      await user.type(combobox, 'blood');

      // Wait for the API call to complete and results to be displayed
      await waitFor(() => {
        expect(get).toHaveBeenCalledWith(
          expect.stringContaining('/ValueSet/$expand?filter=All%20Orderables'),
        );
      });

      // Verify that the dropdown shows filtered results
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);

        // Should show category headers and matching investigations
        expect(screen.getByText('LABORATORY')).toBeInTheDocument();
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
        expect(screen.getByText('Blood Glucose Test')).toBeInTheDocument();
      });
    });

    test('should filter investigations based on search term', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      // Search for "glucose"
      await user.type(combobox, 'glucose');

      await waitFor(() => {
        // Should show only glucose-related items
        expect(screen.getByText('Blood Glucose Test')).toBeInTheDocument();
        expect(
          screen.queryByText('Complete Blood Count'),
        ).not.toBeInTheDocument();
      });
    });

    test('should show "No matching investigations found" when search returns no results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      // Search for something that doesn't exist
      await user.type(combobox, 'xyz123notfound');

      await waitFor(() => {
        expect(
          screen.getByText(/no matching investigations found/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Investigation Selection and Management', () => {
    beforeEach(() => {
      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        addServiceRequest: jest.fn((category, id, display) => {
          mockStore.selectedServiceRequests.set(category, [
            { id, display, selectedPriority: 'routine' },
          ]);
        }),
        removeServiceRequest: jest.fn((category, code) => {
          const requests =
            mockStore.selectedServiceRequests.get(category) || [];
          mockStore.selectedServiceRequests.set(
            category,
            requests.filter((req) => req.id !== code),
          );
        }),
      });
      mockStore.reset();
      mockStore.selectedServiceRequests.clear();
    });
    test('should add investigation when selected and display it with priority checkbox', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      // Search and select an investigation
      await user.type(combobox, 'complete blood');

      await waitFor(() => {
        // Look for the option in the dropdown
        const option = screen.getByRole('option', {
          name: 'Complete Blood Count',
        });
        expect(option).toBeInTheDocument();
      });

      // Click on the investigation option to select it
      const option = screen.getByRole('option', {
        name: 'Complete Blood Count',
      });
      await user.click(option);

      // Verify the investigation is added to the selected list
      await waitFor(() => {
        // Should show the category box
        expect(screen.getByText('Added Laboratory')).toBeInTheDocument();

        // Should show the selected investigation in the selected items area
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();

        // Should have the urgent checkbox
        expect(screen.getByLabelText(/urgent/i)).toBeInTheDocument();
      });
    });

    test('should handle multiple investigation selections from different categories', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      // Add a laboratory investigation
      await user.type(combobox, 'glucose');
      await waitFor(() => {
        const option = screen.getByRole('option', {
          name: 'Blood Glucose Test',
        });
        expect(option).toBeInTheDocument();
      });
      await user.click(
        screen.getByRole('option', { name: 'Blood Glucose Test' }),
      );

      // Clear and add a radiology investigation
      await user.clear(combobox);
      await user.type(combobox, 'chest');
      await waitFor(() => {
        const option = screen.getByRole('option', { name: 'Chest X-Ray' });
        expect(option).toBeInTheDocument();
      });
      await user.click(screen.getByRole('option', { name: 'Chest X-Ray' }));

      // Verify both categories are displayed
      await waitFor(() => {
        expect(screen.getByText('Added Laboratory')).toBeInTheDocument();
        expect(screen.getByText('Added Radiology')).toBeInTheDocument();

        // Check within specific containers to avoid duplicates
        const labBox = screen.getByLabelText('Added Laboratory');
        const radBox = screen.getByLabelText('Added Radiology');

        expect(
          within(labBox).getByText('Blood Glucose Test'),
        ).toBeInTheDocument();
        expect(within(radBox).getByText('Chest X-Ray')).toBeInTheDocument();
      });
    });

    test('should toggle investigation priority when urgent checkbox is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      // Add an investigation
      await user.type(combobox, 'hemoglobin');
      await waitFor(() => {
        const option = screen.getByRole('option', { name: 'Hemoglobin' });
        expect(option).toBeInTheDocument();
      });
      await user.click(screen.getByRole('option', { name: 'Hemoglobin' }));

      // Find and click the urgent checkbox
      await waitFor(() => {
        const urgentCheckbox = screen.getByLabelText(/urgent/i);
        expect(urgentCheckbox).toBeInTheDocument();
        expect(urgentCheckbox).not.toBeChecked();
      });

      const urgentCheckbox = screen.getByLabelText(/urgent/i);
      await user.click(urgentCheckbox);

      // Verify the checkbox is now checked
      expect(urgentCheckbox).toBeChecked();
    });

    test('should remove investigation when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      // Add an investigation
      await user.type(combobox, 'lipid');
      await waitFor(() => {
        const option = screen.getByRole('option', { name: 'Lipid Profile' });
        expect(option).toBeInTheDocument();
      });
      await user.click(screen.getByRole('option', { name: 'Lipid Profile' }));

      // Verify it's added
      await waitFor(() => {
        expect(screen.getByText('Added Laboratory')).toBeInTheDocument();
        const labBox = screen.getByLabelText('Added Laboratory');
        expect(within(labBox).getByText('Lipid Profile')).toBeInTheDocument();
      });

      // Click the remove button
      const removeButton = screen.getByRole('button', { name: /close/i });
      await user.click(removeButton);

      // Verify the investigation is removed
      await waitFor(() => {
        expect(screen.queryByText('Lipid Profile')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle empty ValueSet response gracefully', async () => {
      (get as jest.Mock).mockResolvedValue({
        resourceType: 'ValueSet',
        status: 'active',
        expansion: {
          timestamp: new Date().toISOString(),
          contains: [],
        },
      });

      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      await waitFor(() => {
        expect(
          screen.getByText(/no matching investigations found/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading state while fetching investigations', async () => {
      // Mock a delayed response
      (get as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockValueSetResponse), 100),
          ),
      );

      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      // Should show loading state initially
      expect(screen.getByText(/loading concepts/i)).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading concepts/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Complex User Workflows', () => {
    test('should handle adding multiple investigations of same category and managing priorities', async () => {
      const user = userEvent.setup();

      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      // Add first investigation
      await user.type(combobox, 'complete blood');
      await waitFor(() => {
        const option = screen.getByRole('option', {
          name: 'Complete Blood Count',
        });
        expect(option).toBeInTheDocument();
      });
      await user.click(
        screen.getByRole('option', { name: 'Complete Blood Count' }),
      );

      // Verify the first was added
      expect(mockStore.addServiceRequest).toHaveBeenCalledWith(
        'Laboratory',
        'cbc-001',
        'Complete Blood Count',
      );

      // Add second investigation
      await user.clear(combobox);
      await user.type(combobox, 'hemoglobin');
      await waitFor(() => {
        const option = screen.getByRole('option', { name: 'Hemoglobin' });
        expect(option).toBeInTheDocument();
      });
      await user.click(screen.getByRole('option', { name: 'Hemoglobin' }));

      // Verify the second was added
      expect(mockStore.addServiceRequest).toHaveBeenCalledWith(
        'Laboratory',
        'hb-001',
        'Hemoglobin',
      );

      // Verify both were added through mock calls
      expect(mockStore.addServiceRequest).toHaveBeenCalledTimes(2);
    });

    test('should maintain search input value after selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      await user.type(combobox, 'glucose');
      await waitFor(() => {
        const option = screen.getByRole('option', {
          name: 'Blood Glucose Test',
        });
        expect(option).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('option', { name: 'Blood Glucose Test' }),
      );

      // Carbon ComboBox updates the value to the selected item's display text
      expect(combobox).toHaveValue('Blood Glucose Test');
    });
  });
});
