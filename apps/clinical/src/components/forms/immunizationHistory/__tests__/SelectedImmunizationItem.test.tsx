import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import SelectedImmunizationItem from '../components/SelectedImmunizationItem';
import { IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY } from '../constants';
import { useImmunizationHistoryStore } from '../stores';
import {
  mockAvailableStockResponse,
  mockEmptyAvailableStockResponse,
  mockCovid19VaccineDrugs,
  mockFullAttributes,
  mockImmunizationEntry,
  mockImmunizationEntryWithBasedOn,
  mockImmunizationEntryWithBasedOnAndNullFields,
  mockImmunizationEntryWithCustomDrug,
  mockImmunizationEntryWithCustomLocation,
  mockImmunizationEntryWithDate,
  mockImmunizationEntryWithErrors,
  mockLocations,
  mockRoutesValueSet,
  mockSitesValueSet,
  mockStore,
} from './__mocks__/immunizationHistoryMocks';

jest.mock('../stores');

expect.extend(toHaveNoViolations);

Element.prototype.scrollIntoView = jest.fn();

const { id } = mockImmunizationEntry;

const defaultProps = {
  immunization: mockImmunizationEntry,
  routes: mockRoutesValueSet,
  sites: mockSitesValueSet,
  administeredLocationTag: mockLocations,
  attributes: mockFullAttributes,
  vaccineDrugs: mockCovid19VaccineDrugs,
  storeKey: IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY,
  availableStocks: mockAvailableStockResponse,
  stocksError: false,
  stockBatchesEnabled: true,
};

describe('SelectedImmunizationItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useImmunizationHistoryStore).mockReturnValue(mockStore);
  });

  describe('Rendering', () => {
    it('displays vaccine display name', () => {
      render(<SelectedImmunizationItem {...defaultProps} />);
      expect(
        screen.getByTestId(`immunization-drug-name-${id}-test-id`),
      ).toHaveTextContent('COVID-19 Vaccine');
    });

    it.each([
      [
        'drug',
        [{ name: 'drug', required: true }],
        `immunization-drug-name-combobox-${id}-test-id`,
      ],
      [
        'administeredOn',
        [{ name: 'administeredOn', required: true }],
        `immunization-administered-on-input-${id}-test-id`,
      ],
      [
        'administeredLocation',
        [{ name: 'administeredLocation', required: true }],
        `immunization-administered-location-${id}-test-id`,
      ],
      [
        'route',
        [{ name: 'route', required: false, routeConceptUuid: 'route-uuid' }],
        `immunization-route-${id}-test-id`,
      ],
      [
        'site',
        [{ name: 'site', required: false, siteConceptUuid: 'site-uuid' }],
        `immunization-site-${id}-test-id`,
      ],
      [
        'manufacturer',
        [{ name: 'manufacturer', required: false }],
        `immunization-manufacturer-${id}`,
      ],
      [
        'batchNumber',
        [{ name: 'batchNumber', required: false }],
        `immunization-batch-number-${id}`,
      ],
      [
        'doseSequence',
        [{ name: 'doseSequence', required: false }],
        `immunization-dose-sequence-${id}`,
      ],
      [
        'expiryDate',
        [{ name: 'expiryDate', required: false }],
        `immunization-expiry-date-input-${id}`,
      ],
      [
        'note',
        [{ name: 'note', required: false }],
        `immunization-add-note-link-${id}-test-id`,
      ],
    ])(
      'renders %s field when attributes includes it',
      (_, attributes, testId) => {
        render(
          <SelectedImmunizationItem
            {...defaultProps}
            attributes={attributes}
          />,
        );
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      },
    );

    it('does not render any field when attributes is empty', () => {
      render(<SelectedImmunizationItem {...defaultProps} attributes={[]} />);
      [
        `immunization-drug-name-combobox-${id}-test-id`,
        `immunization-administered-on-input-${id}-test-id`,
        `immunization-administered-location-${id}-test-id`,
        `immunization-route-${id}-test-id`,
        `immunization-site-${id}-test-id`,
        `immunization-manufacturer-${id}`,
        `immunization-batch-number-${id}`,
        `immunization-dose-sequence-${id}`,
        `immunization-expiry-date-input-${id}`,
        `immunization-add-note-link-${id}-test-id`,
      ].forEach((testId) =>
        expect(screen.queryByTestId(testId)).not.toBeInTheDocument(),
      );
    });

    it.each([
      [
        'drug combobox shows display when drug has no code (custom value)',
        mockImmunizationEntryWithCustomDrug,
        [{ name: 'drug', required: false }],
        'Custom Drug Name',
      ],
      [
        'administeredLocation combobox shows display when location has no uuid (custom value)',
        mockImmunizationEntryWithCustomLocation,
        [{ name: 'administeredLocation', required: false }],
        'Custom Ward',
      ],
    ])('%s', (_, immunization, attributes, expectedDisplay) => {
      render(
        <SelectedImmunizationItem
          {...defaultProps}
          immunization={immunization}
          attributes={attributes}
        />,
      );
      expect(screen.getByRole('combobox')).toHaveValue(expectedDisplay);
    });

    it('sets expiryDate minDate to the day after administeredOn when administeredOn is set', () => {
      render(
        <SelectedImmunizationItem
          {...defaultProps}
          immunization={mockImmunizationEntryWithDate}
        />,
      );
      expect(
        screen.getByTestId(`immunization-expiry-date-input-${id}`),
      ).toBeInTheDocument();
    });
  });

  describe('Error display', () => {
    it.each([
      ['drug', 'Please select a drug name'],
      ['administeredOn', 'Please select the administered on date'],
      ['administeredLocation', 'Please select an administered location'],
      ['route', 'Please select a route'],
      ['site', 'Please select a site'],
      ['manufacturer', 'Please enter a manufacturer'],
      ['batchNumber', 'Please enter a batch number'],
      ['doseSequence', 'Please enter a dose sequence'],
      ['expiryDate', 'Please select an expiry date'],
    ])('shows error message for %s field when error is set', (_, errorText) => {
      render(
        <SelectedImmunizationItem
          {...defaultProps}
          immunization={mockImmunizationEntryWithErrors}
        />,
      );
      expect(screen.getByText(errorText)).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it.each([
      ['drug', () => screen.getByPlaceholderText('Search drug name')],
      [
        'administeredOn',
        () =>
          screen.getByTestId(
            `immunization-administered-on-input-${id}-test-id`,
          ),
      ],
      [
        'administeredLocation',
        () => screen.getByPlaceholderText('Select administered location'),
      ],
    ])(
      '%s field is disabled when basedOnReference is set and field has a value',
      (_, getElement) => {
        render(
          <SelectedImmunizationItem
            {...defaultProps}
            immunization={mockImmunizationEntryWithBasedOn}
          />,
        );
        expect(getElement()).toBeDisabled();
      },
    );

    it.each([
      ['drug', () => screen.getByPlaceholderText('Search drug name')],
      [
        'administeredOn',
        () =>
          screen.getByTestId(
            `immunization-administered-on-input-${id}-test-id`,
          ),
      ],
      [
        'administeredLocation',
        () => screen.getByPlaceholderText('Select administered location'),
      ],
    ])(
      '%s field is not disabled when basedOnReference is set but field value is null',
      (_, getElement) => {
        render(
          <SelectedImmunizationItem
            {...defaultProps}
            immunization={mockImmunizationEntryWithBasedOnAndNullFields}
          />,
        );
        expect(getElement()).not.toBeDisabled();
      },
    );
  });

  describe('Store interactions', () => {
    it.each([
      [
        'updateVaccineDrug',
        'Search drug name',
        'COVID',
        'COVID-19 Drug',
        mockStore.updateVaccineDrug,
        { code: 'covid-drug-uuid', display: 'COVID-19 Drug' },
      ],
      [
        'updateAdministeredLocation',
        'Select administered location',
        'Main',
        'Main Clinic',
        mockStore.updateAdministeredLocation,
        { uuid: 'location-uuid-1', display: 'Main Clinic' },
      ],
      [
        'updateRoute',
        'Select route',
        'Intra',
        'Intramuscular',
        mockStore.updateRoute,
        'im',
      ],
      [
        'updateSite',
        'Select site',
        'Left',
        'Left Arm',
        mockStore.updateSite,
        'arm',
      ],
    ])(
      'calls %s when an item is selected from the combobox',
      async (
        _,
        placeholder,
        searchTerm,
        itemText,
        storeMethod,
        expectedValue,
      ) => {
        const user = userEvent.setup();
        render(<SelectedImmunizationItem {...defaultProps} />);
        await user.type(screen.getByPlaceholderText(placeholder), searchTerm);
        await user.click(screen.getByText(itemText));
        await waitFor(() => {
          expect(storeMethod).toHaveBeenCalledWith(id, expectedValue);
        });
      },
    );

    it.each([
      [
        'updateVaccineDrug',
        'Search drug name',
        'My Custom Drug',
        mockStore.updateVaccineDrug,
        { display: 'My Custom Drug' },
      ],
      [
        'updateAdministeredLocation',
        'Select administered location',
        'Custom Ward',
        mockStore.updateAdministeredLocation,
        { display: 'Custom Ward' },
      ],
    ])(
      'calls %s with display only when a custom value is entered',
      async (_, placeholder, inputText, storeMethod, expectedValue) => {
        const user = userEvent.setup();
        render(<SelectedImmunizationItem {...defaultProps} />);
        await user.type(screen.getByPlaceholderText(placeholder), inputText);
        await user.keyboard('{Enter}');
        await waitFor(() => {
          expect(storeMethod).toHaveBeenCalledWith(id, expectedValue);
        });
      },
    );

    it.each([
      [
        'updateRoute',
        'Select route',
        'Intra',
        'Intramuscular',
        mockStore.updateRoute,
      ],
      ['updateSite', 'Select site', 'Left', 'Left Arm', mockStore.updateSite],
    ])(
      'does not call %s when selection is cleared',
      async (_, placeholder, searchTerm, itemText, storeMethod) => {
        const user = userEvent.setup();
        render(<SelectedImmunizationItem {...defaultProps} />);
        await user.type(screen.getByPlaceholderText(placeholder), searchTerm);
        await user.click(screen.getByText(itemText));
        storeMethod.mockClear();
        await user.click(
          screen.getByRole('button', { name: 'Clear selected item' }),
        );
        expect(storeMethod).not.toHaveBeenCalled();
      },
    );

    it.each([
      [
        'updateVaccineDrug',
        'Search drug name',
        'COVID',
        'COVID-19 Drug',
        mockStore.updateVaccineDrug,
      ],
      [
        'updateAdministeredLocation',
        'Select administered location',
        'Main',
        'Main Clinic',
        mockStore.updateAdministeredLocation,
      ],
    ])(
      'calls %s with null when selection is cleared',
      async (_, placeholder, searchTerm, itemText, storeMethod) => {
        const user = userEvent.setup();
        render(<SelectedImmunizationItem {...defaultProps} />);
        await user.type(screen.getByPlaceholderText(placeholder), searchTerm);
        await user.click(screen.getByText(itemText));
        storeMethod.mockClear();
        await user.click(
          screen.getByRole('button', { name: 'Clear selected item' }),
        );
        await waitFor(() => {
          expect(storeMethod).toHaveBeenCalledWith(id, null);
        });
      },
    );

    it('calls updateManufacturer when the text input changes', async () => {
      const user = userEvent.setup();
      render(<SelectedImmunizationItem {...defaultProps} />);
      await user.type(
        screen.getByTestId(`immunization-manufacturer-${id}`),
        'value',
      );
      await waitFor(() => {
        expect(mockStore.updateManufacturer).toHaveBeenCalledWith(
          id,
          expect.any(String),
        );
      });
    });

    it('calls updateDoseSequence with a number when value is typed', async () => {
      const user = userEvent.setup();
      render(<SelectedImmunizationItem {...defaultProps} />);
      await user.type(
        screen.getByTestId(`immunization-dose-sequence-${id}`),
        '3',
      );
      await waitFor(() => {
        expect(mockStore.updateDoseSequence).toHaveBeenCalledWith(
          id,
          expect.any(Number),
        );
      });
    });

    it.each([
      [
        'updateAdministeredOn',
        `immunization-administered-on-input-${id}-test-id`,
        mockStore.updateAdministeredOn,
        0,
      ],
      [
        'updateExpiryDate',
        `immunization-expiry-date-input-${id}`,
        mockStore.updateExpiryDate,
        1,
      ],
    ])(
      'calls %s when a date is selected from the calendar',
      async (_, testId, storeMethod, calendarIndex) => {
        const user = userEvent.setup();
        render(<SelectedImmunizationItem {...defaultProps} />);
        await user.click(screen.getByTestId(testId));
        const calendars = screen.getAllByRole('application', {
          name: /calendar/i,
        });
        await user.click(
          within(calendars[calendarIndex]).getAllByRole('button')[0],
        );
        await waitFor(() => {
          expect(storeMethod).toHaveBeenCalledWith(id, expect.any(Date));
        });
      },
    );
  });

  describe('Batch number ComboBox', () => {
    it('shows available stock batches as options in the dropdown', async () => {
      const user = userEvent.setup();
      render(<SelectedImmunizationItem {...defaultProps} />);
      await user.click(screen.getByPlaceholderText('Enter batch number'));
      await waitFor(() => {
        expect(screen.getByText('BATCH-001')).toBeInTheDocument();
        expect(screen.getByText('BATCH-002')).toBeInTheDocument();
      });
    });

    it('calls updateBatchNumber and updateExpiryDate when a batch is selected from the stock list', async () => {
      const user = userEvent.setup();
      render(<SelectedImmunizationItem {...defaultProps} />);
      await user.click(screen.getByPlaceholderText('Enter batch number'));
      await user.click(screen.getByText('BATCH-001'));
      await waitFor(() => {
        expect(mockStore.updateBatchNumber).toHaveBeenCalledWith(
          id,
          'BATCH-001',
        );
        expect(mockStore.updateExpiryDate).toHaveBeenCalledWith(
          id,
          new Date('2026-12-31'),
        );
      });
    });

    it('calls updateBatchNumber but not updateExpiryDate when a batch without an expiry date is selected', async () => {
      const user = userEvent.setup();
      render(
        <SelectedImmunizationItem
          {...defaultProps}
          availableStocks={{
            count: 1,
            data: [
              {
                stockLocationName: 'Nurse Station',
                availableQuantity: 5,
                onHandQuantity: 5,
                unit: 'vial',
                batchNumber: 'BATCH-NO-EXPIRY',
                expiryDate: '',
              },
            ],
          }}
        />,
      );
      await user.click(screen.getByPlaceholderText('Enter batch number'));
      await user.click(screen.getByText('BATCH-NO-EXPIRY'));
      await waitFor(() => {
        expect(mockStore.updateBatchNumber).toHaveBeenCalledWith(
          id,
          'BATCH-NO-EXPIRY',
        );
      });
      expect(mockStore.updateExpiryDate).not.toHaveBeenCalled();
    });

    it('calls updateBatchNumber with custom text without calling updateExpiryDate when a custom value is entered', async () => {
      const user = userEvent.setup();
      render(
        <SelectedImmunizationItem
          {...defaultProps}
          stockBatchesEnabled={false}
        />,
      );
      await user.type(
        screen.getByPlaceholderText('Enter batch number'),
        'MY-CUSTOM-BATCH',
      );
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(mockStore.updateBatchNumber).toHaveBeenCalledWith(
          id,
          'MY-CUSTOM-BATCH',
        );
      });
      expect(mockStore.updateExpiryDate).not.toHaveBeenCalled();
    });

    it('calls updateBatchNumber with empty string when the batch number input is cleared', async () => {
      const user = userEvent.setup();
      render(<SelectedImmunizationItem {...defaultProps} />);
      await user.click(screen.getByPlaceholderText('Enter batch number'));
      await user.click(screen.getByText('BATCH-001'));
      mockStore.updateBatchNumber.mockClear();
      await user.click(
        screen.getByRole('button', { name: 'Clear selected item' }),
      );
      await waitFor(() => {
        expect(mockStore.updateBatchNumber).toHaveBeenCalledWith(id, '');
      });
    });

    it('shows disabled no-stock option in the dropdown when there are no available stocks', async () => {
      const user = userEvent.setup();
      render(
        <SelectedImmunizationItem
          {...defaultProps}
          availableStocks={mockEmptyAvailableStockResponse}
          stocksError={false}
        />,
      );
      await user.click(screen.getByPlaceholderText('Enter batch number'));
      await waitFor(() => {
        expect(
          screen.getByText('No stock batches available'),
        ).toBeInTheDocument();
      });
    });

    it('shows disabled error option in the dropdown when stocksError is true', async () => {
      const user = userEvent.setup();
      render(
        <SelectedImmunizationItem
          {...defaultProps}
          availableStocks={undefined}
          stocksError
        />,
      );
      await user.click(screen.getByPlaceholderText('Enter batch number'));
      await waitFor(() => {
        expect(
          screen.getByText('Error loading stock batches'),
        ).toBeInTheDocument();
      });
    });

    it.each([
      ['matches a stock item', 'BATCH-001'],
      ['is a custom value not in the stock list', 'MY-CUSTOM-BATCH'],
    ])(
      'shows existing batch number from immunization when it %s',
      (_, batchNumber) => {
        render(
          <SelectedImmunizationItem
            {...defaultProps}
            immunization={{ ...mockImmunizationEntry, batchNumber }}
          />,
        );
        expect(screen.getByPlaceholderText('Enter batch number')).toHaveValue(
          batchNumber,
        );
      },
    );
  });

  describe('Note field interactions', () => {
    it('shows textarea directly when immunization already has a note', () => {
      render(
        <SelectedImmunizationItem
          {...defaultProps}
          attributes={[{ name: 'note', required: false }]}
          immunization={{ ...mockImmunizationEntry, note: 'Pre-existing note' }}
        />,
      );
      expect(
        screen.queryByTestId(`immunization-add-note-link-${id}-test-id`),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId(`immunization-note-${id}-test-id`),
      ).toBeInTheDocument();
    });

    it('opens textarea on link click, calls updateNote on input, and clears on close', async () => {
      const user = userEvent.setup();
      render(
        <SelectedImmunizationItem
          {...defaultProps}
          attributes={[{ name: 'note', required: false }]}
        />,
      );

      expect(
        screen.getByTestId(`immunization-add-note-link-${id}-test-id`),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId(`immunization-note-${id}-test-id`),
      ).not.toBeInTheDocument();

      await user.click(
        screen.getByTestId(`immunization-add-note-link-${id}-test-id`),
      );
      expect(
        screen.queryByTestId(`immunization-add-note-link-${id}-test-id`),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId(`immunization-note-${id}-test-id`),
      ).toBeInTheDocument();

      await user.type(
        screen.getByTestId(`immunization-note-${id}-test-id`),
        'A',
      );
      await waitFor(() => {
        expect(mockStore.updateNote).toHaveBeenCalledWith(
          id,
          expect.any(String),
        );
      });

      await user.click(screen.getByRole('button', { name: /close/i }));
      expect(
        screen.queryByTestId(`immunization-note-${id}-test-id`),
      ).not.toBeInTheDocument();
      expect(mockStore.updateNote).toHaveBeenCalledWith(id, '');
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot with all form fields', () => {
      const { container } = render(
        <SelectedImmunizationItem {...defaultProps} />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it.each([
      ['all form fields', defaultProps],
      ['no optional fields', { ...defaultProps, attributes: undefined }],
      [
        'with field errors',
        { ...defaultProps, immunization: mockImmunizationEntryWithErrors },
      ],
    ])('has no accessibility violations with %s', async (_, props) => {
      const { container } = render(<SelectedImmunizationItem {...props} />);
      await act(async () => {});
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
