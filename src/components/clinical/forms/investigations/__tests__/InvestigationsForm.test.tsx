import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import InvestigationsForm from '../InvestigationsForm';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { FlattenedInvestigations } from '@types/investigations';

expect.extend(toHaveNoViolations);

Element.prototype.scrollIntoView = jest.fn();

jest.mock('../styles/InvestigationsForm.module.scss', () => ({
  investigationsFormTile: 'investigationsFormTile',
  investigationsFormTitle: 'investigationsFormTitle',
  addedInvestigationsBox: 'addedInvestigationsBox',
  selectedInvestigationItem: 'selectedInvestigationItem',
}));

jest.mock('@hooks/useInvestigationsSearch');
jest.mock('@stores/serviceRequestStore');
jest.mock('@components/common/boxWHeader/BoxWHeader', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, title, className }: any) => (
    <div className={className} data-testid="box-w-header">
      <h3>{title}</h3>
      {children}
    </div>
  ),
}));
jest.mock('@components/common/selectedItem/SelectedItem', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, onClose, className }: any) => (
    <div className={className} data-testid="selected-item">
      {children}
      <button onClick={onClose} aria-label="Remove">
        ×
      </button>
    </div>
  ),
}));
jest.mock('../SelectedInvestigationItem', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ investigation, onPriorityChange }: any) => (
    <div data-testid="selected-investigation-item">
      <span>{investigation.display}</span>
      <input
        type="checkbox"
        onChange={(e) =>
          onPriorityChange(e.target.checked ? 'stat' : 'routine')
        }
        aria-label="Set as urgent"
      />
    </div>
  ),
}));

import useInvestigationsSearch from '@hooks/useInvestigationsSearch';
import useServiceRequestStore from '@stores/serviceRequestStore';

const mockInvestigations: FlattenedInvestigations[] = [
  {
    code: 'cbc-001',
    display: 'Complete Blood Count',
    category: 'Laboratory',
    categoryCode: 'lab',
  },
  {
    code: 'glucose-001',
    display: 'Blood Glucose Test',
    category: 'Laboratory',
    categoryCode: 'lab',
  },
  {
    code: 'xray-001',
    display: 'Chest X-Ray',
    category: 'Radiology',
    categoryCode: 'rad',
  },
];
const mockStore = {
  selectedServiceRequests: new Map(),
  addServiceRequest: jest.fn(),
  removeServiceRequest: jest.fn(),
  updatePriority: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(() => ({
    selectedServiceRequests: new Map(),
  })),
};

describe('InvestigationsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
    (useInvestigationsSearch as jest.Mock).mockReturnValue({
      investigations: [],
      isLoading: false,
      error: null,
    });

    (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  describe('Component Rendering', () => {
    test('renders form with title and search combobox', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      expect(
        screen.getByText('Order Investigations/Procedures'),
      ).toBeInTheDocument();
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveAttribute(
        'id',
        'investigations-procedures-search',
      );
      expect(combobox).toHaveAttribute(
        'placeholder',
        'Search to add investigations/procedures',
      );
      expect(combobox).toHaveAttribute(
        'aria-label',
        'Search for investigations/prcedures',
      );
    });
  });

  describe('Search Functionality', () => {
    test('updates search term on input change', async () => {
      const user = userEvent.setup();

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'blood');

      expect(combobox).toHaveValue('blood');
    });

    test('displays loading state when searching', async () => {
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: [],
        isLoading: true,
        error: null,
      });

      const user = userEvent.setup();

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');
      await waitFor(() => {
        expect(screen.getByText(/loading concepts.../i)).toBeInTheDocument();
      });
    });

    test('displays error state when search fails', async () => {
      const mockError = new Error('Failed to fetch investigations');
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: [],
        isLoading: false,
        error: mockError,
      });

      const user = userEvent.setup();

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      await waitFor(() => {
        expect(
          screen.getByText(/error searching investigations/i),
        ).toBeInTheDocument();
      });
    });

    test('displays no results message when search returns empty', async () => {
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: [],
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'nonexistent');
      await waitFor(() => {
        expect(
          screen.getByText(/no matching investigations found/i),
        ).toBeInTheDocument();
      });
    });

    test('displays investigations grouped by category', async () => {
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      // The investigations are filtered and grouped in the component
      expect(combobox).toHaveValue('test');
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(5);
        expect(options[0]).toHaveTextContent('LABORATORY');
        expect(options[1]).toHaveTextContent('Complete Blood Count');
        expect(options[2]).toHaveTextContent('Blood Glucose Test');
        expect(options[3]).toHaveTextContent('RADIOLOGY');
        expect(options[4]).toHaveTextContent('Chest X-Ray');
      });
    });
  });

  describe('Investigation Selection', () => {
    test('adds investigation when selected from dropdown', async () => {
      const user = userEvent.setup();
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      // Simulate selecting an investigation by calling the onChange handler
      const combobox = screen.getByRole('combobox');

      await waitFor(async () => {
        await user.type(combobox, 'complete');
      });

      // Wait for the dropdown item to appear
      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      // Click on the dropdown item
      await waitFor(async () => {
        await user.click(screen.getByText('Complete Blood Count'));
      });

      // Verify the store was called correctly
      await waitFor(() => {
        expect(mockStore.addServiceRequest).toHaveBeenCalledWith(
          'Laboratory',
          'cbc-001',
          'Complete Blood Count',
        );
      });
    });
  });

  describe('Selected Investigations Display', () => {
    test('displays selected investigations grouped by category', () => {
      const selectedMap = new Map([
        [
          'Laboratory',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
            {
              id: 'glucose-001',
              display: 'Blood Glucose Test',
              selectedPriority: 'stat',
            },
          ],
        ],
        [
          'Radiology',
          [
            {
              id: 'xray-001',
              display: 'Chest X-Ray',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      // Check category headers
      expect(screen.getByText('Added Laboratory')).toBeInTheDocument();
      expect(screen.getByText('Added Radiology')).toBeInTheDocument();

      // Check investigations
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      expect(screen.getByText('Blood Glucose Test')).toBeInTheDocument();
      expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    });

    test('removes investigation when close button is clicked', async () => {
      const selectedMap = new Map([
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
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      const user = userEvent.setup();

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const removeButton = screen.getByLabelText('Remove');
      await user.click(removeButton);

      expect(mockStore.removeServiceRequest).toHaveBeenCalledWith(
        'Laboratory',
        'cbc-001',
      );
    });

    test('updates priority when urgent checkbox is toggled', async () => {
      const selectedMap = new Map([
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
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      const user = userEvent.setup();

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const urgentCheckbox = screen.getByLabelText('Set as urgent');
      await user.click(urgentCheckbox);

      expect(mockStore.updatePriority).toHaveBeenCalledWith(
        'Laboratory',
        'cbc-001',
        'stat',
      );
    });
  });

  describe('Already Selected Items', () => {
    test('displays already selected items as disabled with appropriate text', async () => {
      const selectedMap = new Map([
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
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'blood');

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        // Find the Complete Blood Count option
        const cbcOption = options.find((option) =>
          option.textContent?.includes('Complete Blood Count'),
        );
        expect(cbcOption).toHaveTextContent(
          'Complete Blood Count (Already selected)',
        );
        expect(cbcOption).toHaveAttribute('disabled');
      });
    });

    test('prevents selection of already selected items', async () => {
      const selectedMap = new Map([
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
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');

      await waitFor(() => {
        const cbcOption = screen.getByText(
          'Complete Blood Count (Already selected)',
        );
        expect(cbcOption).toBeInTheDocument();
      });

      // Try to click the disabled option
      const cbcOption = screen.getByText(
        'Complete Blood Count (Already selected)',
      );
      await user.click(cbcOption);

      // Verify that addServiceRequest was NOT called since the item is disabled
      expect(mockStore.addServiceRequest).not.toHaveBeenCalled();
    });

    test('allows selection of non-selected items when some items are already selected', async () => {
      const selectedMap = new Map([
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
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'glucose');

      await waitFor(() => {
        // Verify Blood Glucose Test is not marked as already selected
        const glucoseOption = screen.getByText('Blood Glucose Test');
        expect(glucoseOption).toBeInTheDocument();
        expect(glucoseOption).not.toHaveTextContent('(Already selected)');
      });

      // Click on the non-selected item
      await user.click(screen.getByText('Blood Glucose Test'));

      // Verify the store was called correctly
      await waitFor(() => {
        expect(mockStore.addServiceRequest).toHaveBeenCalledWith(
          'Laboratory',
          'glucose-001',
          'Blood Glucose Test',
        );
      });
    });

    test('handles multiple already selected items across different categories', async () => {
      const selectedMap = new Map([
        [
          'Laboratory',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
            {
              id: 'glucose-001',
              display: 'Blood Glucose Test',
              selectedPriority: 'stat',
            },
          ],
        ],
        [
          'Radiology',
          [
            {
              id: 'xray-001',
              display: 'Chest X-Ray',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      await waitFor(() => {
        const options = screen.getAllByRole('option');

        // Check that all selected items are marked as already selected
        const cbcOption = options.find((option) =>
          option.textContent?.includes('Complete Blood Count'),
        );
        const glucoseOption = options.find((option) =>
          option.textContent?.includes('Blood Glucose Test'),
        );
        const xrayOption = options.find((option) =>
          option.textContent?.includes('Chest X-Ray'),
        );

        expect(cbcOption).toHaveTextContent(
          'Complete Blood Count (Already selected)',
        );
        expect(cbcOption).toHaveAttribute('disabled');

        expect(glucoseOption).toHaveTextContent(
          'Blood Glucose Test (Already selected)',
        );
        expect(glucoseOption).toHaveAttribute('disabled');

        expect(xrayOption).toHaveTextContent('Chest X-Ray (Already selected)');
        expect(xrayOption).toHaveAttribute('disabled');
      });
    });

    test('updates already selected status when item is removed and search is performed again', async () => {
      let selectedMap = new Map([
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
      ]);

      const mockStoreWithDynamicMap = {
        ...mockStore,
        get selectedServiceRequests() {
          return selectedMap;
        },
        removeServiceRequest: jest.fn((category, id) => {
          const currentItems = selectedMap.get(category);
          const updatedItems = currentItems?.filter((item) => item.id !== id);
          if (updatedItems && updatedItems.length > 0) {
            selectedMap.set(category, updatedItems);
          } else {
            selectedMap.delete(category);
          }
        }),
      };

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(
        mockStoreWithDynamicMap,
      );

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      const { rerender } = render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      // First search - CBC should be marked as already selected
      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');

      await waitFor(() => {
        expect(
          screen.getByText('Complete Blood Count (Already selected)'),
        ).toBeInTheDocument();
      });

      // Clear the search
      await user.clear(combobox);

      // Remove the CBC from selected items
      const removeButton = screen.getByLabelText('Remove');
      await user.click(removeButton);

      // Update the mock to reflect the empty selected items
      selectedMap = new Map();

      // Rerender to reflect the state change
      rerender(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      // Search again - CBC should NOT be marked as already selected
      await user.type(combobox, 'complete');

      await waitFor(() => {
        const cbcOption = screen.getByText('Complete Blood Count');
        expect(cbcOption).toBeInTheDocument();
        expect(cbcOption).not.toHaveTextContent('(Already selected)');
        expect(cbcOption.closest('[role="option"]')).not.toHaveAttribute(
          'disabled',
        );
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty search term correctly', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveValue('');
    });
    test('should handle search result with empty display', async () => {
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: [
          {
            code: 'empty-001',
            display: '',
            category: 'Laboratory',
            categoryCode: 'lab',
          },
        ],
        isLoading: false,
        error: null,
      });

      render(
        <I18nextProvider i18n={i18n}>
          <InvestigationsForm />
        </I18nextProvider>,
      );

      const combobox = screen.getByRole('combobox');
      const user = userEvent.setup();
      await user.type(combobox, 'test');
      expect(combobox).toHaveValue('test');
      expect(screen.getByRole('option', { name: '' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'LABORATORY' }),
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      let container: HTMLElement;

      await act(async () => {
        const rendered = render(
          <I18nextProvider i18n={i18n}>
            <InvestigationsForm />
          </I18nextProvider>,
        );
        container = rendered.container;
      });

      const results = await axe(container!);
      expect(results).toHaveNoViolations();
    });
  });
});
