import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import SelectedImmunizationItem from '../components/SelectedImmunizationItem';
import { useImmunizationHistoryStore } from '../stores';
import {
  mockCovid19VaccineDrugs,
  mockFullAttributes,
  mockImmunizationEntry,
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

    it.each([
      ['drug', `immunization-drug-name-combobox-${id}-test-id`],
      ['administeredOn', `immunization-administered-on-input-${id}-test-id`],
      [
        'administeredLocation',
        `immunization-administered-location-${id}-test-id`,
      ],
      ['route', `immunization-route-${id}-test-id`],
      ['site', `immunization-site-${id}-test-id`],
      ['manufacturer', `immunization-manufacturer-${id}`],
      ['batchNumber', `immunization-batch-number-${id}`],
      ['doseSequence', `immunization-dose-sequence-${id}`],
      ['expiryDate', `immunization-expiry-date-input-${id}`],
      ['note', `immunization-add-note-link-${id}-test-id`],
    ])('does not render %s field when attributes is empty', (_, testId) => {
      render(<SelectedImmunizationItem {...defaultProps} attributes={[]} />);
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
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

    it.each([
      [
        'updateManufacturer',
        `immunization-manufacturer-${id}`,
        mockStore.updateManufacturer,
      ],
      [
        'updateBatchNumber',
        `immunization-batch-number-${id}`,
        mockStore.updateBatchNumber,
      ],
    ])(
      'calls %s when the text input changes',
      async (_, testId, storeMethod) => {
        const user = userEvent.setup();
        render(<SelectedImmunizationItem {...defaultProps} />);
        await user.type(screen.getByTestId(testId), 'value');
        await waitFor(() => {
          expect(storeMethod).toHaveBeenCalledWith(id, expect.any(String));
        });
      },
    );

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

  describe('Note field interactions', () => {
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
