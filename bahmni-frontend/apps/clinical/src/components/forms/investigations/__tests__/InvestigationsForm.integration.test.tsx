import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from '../../../../../setupTests.i18n';
import useServiceRequestStore from '../../../../stores/serviceRequestStore';
import {
  getFlattenedInvestigations,
  getFormattedError,
} from '@bahmni-frontend/bahmni-services';
import { ServiceRequestInputEntry } from '../../../../models/serviceRequest';
import { FlattenedInvestigations } from '../../../../models/investigations';
import InvestigationsForm from '../InvestigationsForm';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  getFlattenedInvestigations: jest.fn(),
  getFormattedError: jest.fn(),
}));

jest.mock('../../../../stores/serviceRequestStore');

const mockFlattenedInvestigations: FlattenedInvestigations[] = [
  {
    code: 'cbc-001',
    display: 'Complete Blood Count',
    category: 'Laboratory',
    categoryCode: 'LAB',
  },
  {
    code: 'hb-001',
    display: 'Hemoglobin',
    category: 'Laboratory',
    categoryCode: 'LAB',
  },
  {
    code: 'glucose-001',
    display: 'Blood Glucose Test',
    category: 'Laboratory',
    categoryCode: 'LAB',
  },
  {
    code: 'lipid-001',
    display: 'Lipid Profile',
    category: 'Laboratory',
    categoryCode: 'LAB',
  },
  {
    code: 'xray-chest-001',
    display: 'Chest X-Ray',
    category: 'Radiology',
    categoryCode: 'RAD',
  },
  {
    code: 'xray-abdomen-001',
    display: 'Abdomen X-Ray',
    category: 'Radiology',
    categoryCode: 'RAD',
  },
  {
    code: 'ct-head-001',
    display: 'CT Head',
    category: 'Radiology',
    categoryCode: 'RAD',
  },
];

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
    jest.spyOn(console, 'error').mockImplementation(() => {});
    i18n.changeLanguage('en');

    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    (getFlattenedInvestigations as jest.Mock).mockResolvedValue(
      mockFlattenedInvestigations,
    );

    (getFormattedError as jest.Mock).mockImplementation((error: any) => ({
      title: error.title || 'unknown title',
      message: error.message || 'Unknown error',
    }));
    (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(mockStore);
    mockStore.reset();
  });

  describe('Component Initialization and Search', () => {
    test('should load investigations on component mount and display them when searching', async () => {
      const user = userEvent.setup();
      render(<InvestigationsForm />);

      expect(
        screen.getByText('Order Investigations/Procedures'),
      ).toBeInTheDocument();

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();

      await user.type(combobox, 'blood');

      await waitFor(() => {
        expect(getFlattenedInvestigations).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);

        expect(screen.getByText(/laboratory/i)).toBeInTheDocument();
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
        expect(screen.getByText('Blood Glucose Test')).toBeInTheDocument();
      });
    });

    test('should filter investigations based on search term', async () => {
      const user = userEvent.setup();
      render(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      await user.type(combobox, 'glucose');

      await waitFor(() => {
        expect(screen.getByText('Blood Glucose Test')).toBeInTheDocument();
        expect(
          screen.queryByText('Complete Blood Count'),
        ).not.toBeInTheDocument();
      });
    });

    test('should show "No matching investigations found" when search returns no results', async () => {
      const user = userEvent.setup();
      render(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

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
      render(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      await user.type(combobox, 'complete blood');

      await waitFor(() => {
        const option = screen.getByRole('option', {
          name: 'Complete Blood Count',
        });
        expect(option).toBeInTheDocument();
      });

      const option = screen.getByRole('option', {
        name: 'Complete Blood Count',
      });
      await user.click(option);

      await waitFor(() => {
        expect(screen.getByText('Added Laboratory')).toBeInTheDocument();

        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();

        expect(screen.getByLabelText(/urgent/i)).toBeInTheDocument();
      });
    });

    test('should handle multiple investigation selections from different categories', async () => {
      const user = userEvent.setup();
      render(<InvestigationsForm />);

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

      await user.clear(combobox);
      await user.type(combobox, 'chest');
      await waitFor(() => {
        const option = screen.getByRole('option', { name: 'Chest X-Ray' });
        expect(option).toBeInTheDocument();
      });
      await user.click(screen.getByRole('option', { name: 'Chest X-Ray' }));

      await waitFor(() => {
        expect(screen.getByText('Added Laboratory')).toBeInTheDocument();
        expect(screen.getByText('Added Radiology')).toBeInTheDocument();

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
      render(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      await user.type(combobox, 'hemoglobin');
      await waitFor(() => {
        const option = screen.getByRole('option', { name: 'Hemoglobin' });
        expect(option).toBeInTheDocument();
      });
      await user.click(screen.getByRole('option', { name: 'Hemoglobin' }));

      await waitFor(() => {
        const urgentCheckbox = screen.getByLabelText(/urgent/i);
        expect(urgentCheckbox).toBeInTheDocument();
        expect(urgentCheckbox).not.toBeChecked();
      });

      const urgentCheckbox = screen.getByLabelText(/urgent/i);
      await user.click(urgentCheckbox);

      expect(urgentCheckbox).toBeChecked();
    });

    test('should remove investigation when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

      await user.type(combobox, 'lipid');
      await waitFor(() => {
        const option = screen.getByRole('option', { name: 'Lipid Profile' });
        expect(option).toBeInTheDocument();
      });
      await user.click(screen.getByRole('option', { name: 'Lipid Profile' }));

      await waitFor(() => {
        expect(screen.getByText('Added Laboratory')).toBeInTheDocument();
        const labBox = screen.getByLabelText('Added Laboratory');
        expect(within(labBox).getByText('Lipid Profile')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /close/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('Lipid Profile')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle empty investigations response gracefully', async () => {
      (getFlattenedInvestigations as jest.Mock).mockResolvedValue([]);

      const user = userEvent.setup();
      render(<InvestigationsForm />);

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
      (getFlattenedInvestigations as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const user = userEvent.setup();
      render(<InvestigationsForm />);

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

    test('should handle empty investigations response', async () => {
      (getFlattenedInvestigations as jest.Mock).mockResolvedValue([]);

      const user = userEvent.setup();
      render(<InvestigationsForm />);

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
      (getFlattenedInvestigations as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockFlattenedInvestigations), 100),
          ),
      );

      const user = userEvent.setup();
      render(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      await waitFor(() => {
        expect(getFlattenedInvestigations).toHaveBeenCalled();
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Complex User Workflows', () => {
    test('should handle adding multiple investigations of same category and managing priorities', async () => {
      const user = userEvent.setup();

      render(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');

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

      expect(mockStore.addServiceRequest).toHaveBeenCalledWith(
        'Laboratory',
        'cbc-001',
        'Complete Blood Count',
      );

      await user.clear(combobox);
      await user.type(combobox, 'hemoglobin');
      await waitFor(() => {
        const option = screen.getByRole('option', { name: 'Hemoglobin' });
        expect(option).toBeInTheDocument();
      });
      await user.click(screen.getByRole('option', { name: 'Hemoglobin' }));

      expect(mockStore.addServiceRequest).toHaveBeenCalledWith(
        'Laboratory',
        'hb-001',
        'Hemoglobin',
      );

      expect(mockStore.addServiceRequest).toHaveBeenCalledTimes(2);
    });

    test('should maintain search input value after selection', async () => {
      const user = userEvent.setup();
      render(<InvestigationsForm />);

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

      expect(combobox).toHaveValue('Blood Glucose Test');
    });

    test('should display panel indicator for LabSet concept class', async () => {
      const mockFlattenedInvestigationsWithPanel: FlattenedInvestigations[] = [
        ...mockFlattenedInvestigations,
        {
          code: 'panel-001',
          display: 'Liver Function Test (Panel)',
          category: 'Laboratory',
          categoryCode: 'LAB',
        },
      ];

      (getFlattenedInvestigations as jest.Mock).mockResolvedValue(
        mockFlattenedInvestigationsWithPanel,
      );

      const user = userEvent.setup();
      render(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'liver');

      await waitFor(() => {
        const option = screen.getByRole('option', {
          name: /Liver Function Test.*Panel/i,
        });
        expect(option).toBeInTheDocument();
      });
    });

    test('should prevent selection of already selected investigations', async () => {
      const user = userEvent.setup();

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

      render(<InvestigationsForm />);

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete blood');

      await waitFor(() => {
        const option = screen.getByRole('option', {
          name: /Complete Blood Count.*already selected/i,
        });
        expect(option).toBeInTheDocument();
        expect(option).toHaveAttribute('disabled');
      });
    });
  });
});
