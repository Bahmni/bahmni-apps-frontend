import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import SelectedImmunizationItem from '../components/SelectedImmunizationItem';
import { useImmunizationHistoryStore } from '../stores';
import {
  mockCovid19VaccineDrugs,
  mockFullFormFields,
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
  formFields: mockFullFormFields,
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

    it('always renders drug name combobox regardless of formFields', () => {
      render(
        <SelectedImmunizationItem {...defaultProps} formFields={undefined} />,
      );
      expect(
        screen.getByPlaceholderText('Search drug name'),
      ).toBeInTheDocument();
    });

    it.each([
      [
        'administeredOn',
        { administeredOn: { required: true } },
        `immunization-administered-on-input-${id}-test-id`,
      ],
      [
        'administeredLocation',
        {
          administeredLocation: {
            required: true,
            administeredLocationTag: 'login-location',
          },
        },
        `immunization-administered-location-${id}-test-id`,
      ],
      [
        'route',
        { route: { required: false, routeConceptUuid: 'route-uuid' } },
        `immunization-route-${id}-test-id`,
      ],
      [
        'site',
        { site: { required: false, siteConceptUuid: 'site-uuid' } },
        `immunization-site-${id}-test-id`,
      ],
      [
        'manufacturer',
        { manufacturer: { required: false } },
        `immunization-manufacturer-${id}`,
      ],
      [
        'batchNumber',
        { batchNumber: { required: false } },
        `immunization-batch-number-${id}`,
      ],
      [
        'expiryDate',
        { expiryDate: { required: false } },
        `immunization-expiry-date-input-${id}`,
      ],
    ])(
      'renders %s field when formFields includes it',
      (_, formFields, testId) => {
        render(
          <SelectedImmunizationItem
            {...defaultProps}
            formFields={formFields}
          />,
        );
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      },
    );

    it.each([
      ['administeredOn', `immunization-administered-on-input-${id}-test-id`],
      [
        'administeredLocation',
        `immunization-administered-location-${id}-test-id`,
      ],
      ['route', `immunization-route-${id}-test-id`],
      ['site', `immunization-site-${id}-test-id`],
      ['manufacturer', `immunization-manufacturer-${id}`],
      ['batchNumber', `immunization-batch-number-${id}`],
      ['expiryDate', `immunization-expiry-date-input-${id}`],
    ])('does not render %s field when formFields excludes it', (_, testId) => {
      render(<SelectedImmunizationItem {...defaultProps} formFields={{}} />);
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
      ['drugCode', 'Please select a drug name'],
      ['administeredOn', 'Please select the administered on date'],
      ['administeredLocation', 'Please select an administered location'],
      ['route', 'Please select a route'],
      ['site', 'Please select a site'],
      ['manufacturer', 'Please enter a manufacturer'],
      ['batchNumber', 'Please enter a batch number'],
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
    it('calls updateVaccineDrug when a drug is selected from the drug combobox', async () => {
      const user = userEvent.setup();
      render(<SelectedImmunizationItem {...defaultProps} />);
      await user.type(screen.getByPlaceholderText('Search drug name'), 'COVID');
      await user.click(screen.getByText('COVID-19 Drug'));
      await waitFor(() => {
        expect(mockStore.updateVaccineDrug).toHaveBeenCalledWith(
          id,
          'covid-19',
        );
      });
    });

    it('calls updateAdministeredLocation when a location is selected', async () => {
      const user = userEvent.setup();
      render(<SelectedImmunizationItem {...defaultProps} />);
      await user.type(
        screen.getByPlaceholderText('Select administered location'),
        'Main',
      );
      await user.click(screen.getByText('Main Clinic'));
      await waitFor(() => {
        expect(mockStore.updateAdministeredLocation).toHaveBeenCalledWith(
          id,
          'location-uuid-1',
        );
      });
    });

    it('calls updateRoute when a route is selected', async () => {
      const user = userEvent.setup();
      render(<SelectedImmunizationItem {...defaultProps} />);
      await user.type(screen.getByPlaceholderText('Select route'), 'Intra');
      await user.click(screen.getByText('Intramuscular'));
      await waitFor(() => {
        expect(mockStore.updateRoute).toHaveBeenCalledWith(id, 'im');
      });
    });

    it('calls updateSite when a site is selected', async () => {
      const user = userEvent.setup();
      render(<SelectedImmunizationItem {...defaultProps} />);
      await user.type(screen.getByPlaceholderText('Select site'), 'Left');
      await user.click(screen.getByText('Left Arm'));
      await waitFor(() => {
        expect(mockStore.updateSite).toHaveBeenCalledWith(id, 'arm');
      });
    });

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

    it('calls updateManufacturer when manufacturer input changes', async () => {
      const user = userEvent.setup();
      render(<SelectedImmunizationItem {...defaultProps} />);
      await user.type(
        screen.getByTestId(`immunization-manufacturer-${id}`),
        'Pfizer',
      );
      await waitFor(() => {
        expect(mockStore.updateManufacturer).toHaveBeenCalledWith(
          id,
          expect.any(String),
        );
      });
    });

    it('calls updateBatchNumber when batch number input changes', async () => {
      const user = userEvent.setup();
      render(<SelectedImmunizationItem {...defaultProps} />);
      await user.type(
        screen.getByTestId(`immunization-batch-number-${id}`),
        'BATCH001',
      );
      await waitFor(() => {
        expect(mockStore.updateBatchNumber).toHaveBeenCalledWith(
          id,
          expect.any(String),
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

  describe('Snapshots', () => {
    it.each([
      ['all form fields', defaultProps],
      ['no optional fields', { ...defaultProps, formFields: undefined }],
      [
        'with field errors',
        { ...defaultProps, immunization: mockImmunizationEntryWithErrors },
      ],
    ])('matches snapshot with %s', (_, props) => {
      const { container } = render(<SelectedImmunizationItem {...props} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it.each([
      ['all form fields', defaultProps],
      ['no optional fields', { ...defaultProps, formFields: undefined }],
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
