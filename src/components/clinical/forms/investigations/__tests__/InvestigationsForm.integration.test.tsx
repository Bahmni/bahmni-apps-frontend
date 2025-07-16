import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValueSet } from 'fhir/r4';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import { ORDER_TYPE_URL, ALL_ORDERABLES_CONCEPT_NAME } from '@constants/app';
import { FHIR_CONCEPT_CLASS_EXTENSION_URL } from '@constants/fhir';
import { NotificationProvider } from '@providers/NotificationProvider';
import { get } from '@services/api';
import useServiceRequestStore from '@stores/serviceRequestStore';
import { OrderTypeResponse } from '@types/orderType';
import { ServiceRequestInputEntry } from '@types/serviceRequest';
import InvestigationsForm from '../InvestigationsForm';

// Mock only the API layer
jest.mock('@services/api', () => ({
  get: jest.fn(),
}));

jest.mock('@stores/serviceRequestStore');
Element.prototype.scrollIntoView = jest.fn();

// Mock data for the OrderType response
const mockOrderTypeResponse: OrderTypeResponse = {
  results: [
    {
      uuid: 'd3560b17-5e07-11ef-8f7c-0242ac120002',
      display: 'Laboratory',
      conceptClasses: [
        { uuid: 'class-1', name: 'Test' },
        { uuid: 'class-2', name: 'LabTest' },
      ],
    },
    {
      uuid: 'd3561dc0-5e07-11ef-8f7c-0242ac120002',
      display: 'Radiology',
      conceptClasses: [
        { uuid: 'class-3', name: 'Radiology/Imaging Procedure' },
      ],
    },
  ],
};

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
                extension: [
                  {
                    url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                    valueString: 'Test',
                  },
                ],
              },
              {
                code: 'hb-001',
                display: 'Hemoglobin',
                extension: [
                  {
                    url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                    valueString: 'LabTest',
                  },
                ],
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
                extension: [
                  {
                    url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                    valueString: 'Test',
                  },
                ],
              },
              {
                code: 'lipid-001',
                display: 'Lipid Profile',
                extension: [
                  {
                    url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                    valueString: 'LabTest',
                  },
                ],
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
                extension: [
                  {
                    url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                    valueString: 'Radiology/Imaging Procedure',
                  },
                ],
              },
              {
                code: 'xray-abdomen-001',
                display: 'Abdomen X-Ray',
                extension: [
                  {
                    url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                    valueString: 'Radiology/Imaging Procedure',
                  },
                ],
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
                extension: [
                  {
                    url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                    valueString: 'Radiology/Imaging Procedure',
                  },
                ],
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
    // Setup default mock for successful API responses
    (get as jest.Mock).mockImplementation((url: string) => {
      if (url === ORDER_TYPE_URL) {
        return Promise.resolve(mockOrderTypeResponse);
      }
      if (url.includes('/ValueSet/$expand')) {
        return Promise.resolve(mockValueSetResponse);
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(mockStore);
    mockStore.reset();
  });

  describe('Component Initialization and Search', () => {
    test('should load investigations on component mount and display them when searching', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      // Verify the form renders with title
      expect(
        screen.getByText('Order Investigations/Procedures'),
      ).toBeInTheDocument();

      // Verify the search combobox is present
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();

      // Type in the search box
      await user.type(combobox, 'blood');

      // Wait for the API calls to complete and results to be displayed
      await waitFor(() => {
        // Should call order types first
        expect(get).toHaveBeenCalledWith(ORDER_TYPE_URL);
        // Then call ValueSet expand
        expect(get).toHaveBeenCalledWith(
          expect.stringContaining(
            `/ValueSet/$expand?filter=${encodeURIComponent(ALL_ORDERABLES_CONCEPT_NAME)}`,
          ),
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
            mockStore.selectedServiceRequests.get(category) ?? [];
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
      (get as jest.Mock).mockImplementation((url: string) => {
        if (url === ORDER_TYPE_URL) {
          return Promise.resolve(mockOrderTypeResponse);
        }
        if (url.includes('/ValueSet/$expand')) {
          return Promise.resolve({
            resourceType: 'ValueSet',
            status: 'active',
            expansion: {
              timestamp: new Date().toISOString(),
              contains: [],
            },
          });
        }
        return Promise.reject(new Error('Unknown URL'));
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

    test('should handle API errors gracefully', async () => {
      const errorMessage = 'Failed to fetch investigations';
      (get as jest.Mock).mockImplementation((url: string) => {
        if (url === ORDER_TYPE_URL) {
          return Promise.resolve(mockOrderTypeResponse);
        }
        if (url.includes('/ValueSet/$expand')) {
          return Promise.reject(new Error(errorMessage));
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      await waitFor(() => {
        expect(
          screen.getByRole('option', {
            name: new RegExp('error searching investigations', 'i'),
          }),
        ).toBeInTheDocument();
      });
    });

    test('should handle empty order types response', async () => {
      (get as jest.Mock).mockImplementation((url: string) => {
        if (url === ORDER_TYPE_URL) {
          return Promise.resolve({ results: [] });
        }
        if (url.includes('/ValueSet/$expand')) {
          return Promise.resolve(mockValueSetResponse);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      await waitFor(() => {
        // Should show no matching investigations since no order types are configured
        expect(
          screen.getByText(/no matching investigations found/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading state while fetching investigations', async () => {
      // Mock a delayed response
      (get as jest.Mock).mockImplementation((url: string) => {
        if (url === ORDER_TYPE_URL) {
          return Promise.resolve(mockOrderTypeResponse);
        }
        if (url.includes('/ValueSet/$expand')) {
          return new Promise((resolve) =>
            setTimeout(() => resolve(mockValueSetResponse), 100),
          );
        }
        return Promise.reject(new Error('Unknown URL'));
      });

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

      // Verify the first was added with the order type UUID
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

      // Verify the second was added with the order type UUID
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

    test('should display panel indicator for LabSet concept class', async () => {
      // Add a panel investigation to the mock data
      const mockValueSetWithPanel: ValueSet = {
        ...mockValueSetResponse,
        expansion: {
          ...mockValueSetResponse.expansion!,
          contains: [
            {
              code: 'lab',
              display: 'Laboratory',
              contains: [
                {
                  code: 'panels',
                  display: 'Panels',
                  contains: [
                    {
                      code: 'panel-001',
                      display: 'Liver Function Test',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: 'LabSet',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      (get as jest.Mock).mockImplementation((url: string) => {
        if (url === ORDER_TYPE_URL) {
          return Promise.resolve({
            results: [
              {
                uuid: 'd3560b17-5e07-11ef-8f7c-0242ac120002',
                display: 'Laboratory',
                conceptClasses: [{ uuid: 'class-1', name: 'LabSet' }],
              },
            ],
          });
        }
        if (url.includes('/ValueSet/$expand')) {
          return Promise.resolve(mockValueSetWithPanel);
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const user = userEvent.setup();
      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'liver');

      await waitFor(() => {
        // Should show the panel investigation with panel indicator
        const option = screen.getByRole('option', {
          name: /Liver Function Test.*Panel/i,
        });
        expect(option).toBeInTheDocument();
      });
    });

    test('should prevent selection of already selected investigations', async () => {
      const user = userEvent.setup();

      // Mock store with an already selected investigation
      const mockStoreWithSelection = {
        ...mockStore,
        selectedServiceRequests: new Map([
          [
            'Laboratory',
            [
              {
                id: 'cbc-001',
                display: 'Complete Blood Count',
                selectedPriority: 'routine',
              },
            ],
          ],
        ]),
      };

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(
        mockStoreWithSelection,
      );

      renderWithProviders(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete blood');

      await waitFor(() => {
        // Should show the investigation as already selected
        const option = screen.getByRole('option', {
          name: /Complete Blood Count.*already selected/i,
        });
        expect(option).toBeInTheDocument();
        expect(option).toHaveAttribute('disabled');
      });
    });
  });
});
