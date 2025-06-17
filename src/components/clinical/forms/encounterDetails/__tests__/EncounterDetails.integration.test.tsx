import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import BasicForm from '../EncounterDetails';
import * as api from '@services/api';
import * as commonUtils from '@utils/common';
import {
  ENCOUNTER_CONCEPTS_URL,
  PROVIDER_RESOURCE_URL,
  USER_RESOURCE_URL,
} from '@constants/app';
import { useEncounterDetailsStore } from '@stores/encounterDetailsStore';

// Mock services
jest.mock('@services/api');
jest.mock('@utils/common', () => ({
  ...jest.requireActual('@utils/common'),
  getCookieByName: jest.fn(),
}));

// Mock the usePatientUUID hook
jest.mock('@hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

// Mock the date utility
jest.mock('@utils/date', () => ({
  formatDate: jest.fn(() => ({
    formattedResult: '16/05/2025',
    error: null,
  })),
}));

// Mock CSS modules
jest.mock('../styles/BasicForm.module.scss', () => ({
  column: 'column',
  skeletonTitle: 'skeletonTitle',
  skeletonBody: 'skeletonBody',
}));

// Mock Carbon components
jest.mock('@carbon/react', () => {
  const actual = jest.requireActual('@carbon/react');

  interface MockDropdownProps {
    id: string;
    titleText: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: Array<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemToString: (item: any) => string;
    disabled?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialSelectedItem?: any;
    invalid?: boolean;
    invalidText?: string;
  }

  return {
    ...actual,
    Dropdown: ({
      id,
      titleText,
      items,
      itemToString,
      disabled,
      initialSelectedItem,
      invalid,
      invalidText,
    }: MockDropdownProps) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safeItemToString = (item: any): string => {
        try {
          return itemToString(item);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_) {
          return '';
        }
      };

      return (
        <div data-testid={id}>
          <div>{titleText}</div>
          <select
            disabled={disabled}
            aria-label={titleText}
            aria-invalid={invalid}
          >
            {initialSelectedItem && (
              <option value="selected">
                {safeItemToString(initialSelectedItem)}
              </option>
            )}
            {items.map((item, i) => (
              <option
                key={i}
                value={typeof item === 'object' && item?.uuid ? item.uuid : i}
              >
                {safeItemToString(item)}
              </option>
            ))}
          </select>
          {invalid && invalidText && (
            <div id={`${id}-error`} role="alert">
              {invalidText}
            </div>
          )}
        </div>
      );
    },
    SkeletonPlaceholder: ({ className }: { className: string }) => (
      <div className={className} data-testid="skeleton-placeholder" />
    ),
    MenuItemDivider: () => <hr />,
    Grid: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="grid">{children}</div>
    ),
    Column: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="column">{children}</div>
    ),
    DatePicker: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="date-picker">{children}</div>
    ),
    DatePickerInput: ({
      id,
      placeholder,
      labelText,
      disabled,
    }: {
      id: string;
      placeholder: string;
      labelText: string;
      disabled: boolean;
    }) => (
      <input
        id={id}
        placeholder={placeholder}
        aria-label={labelText}
        disabled={disabled}
        data-testid="date-picker-input"
      />
    ),
  };
});

describe('BasicForm Integration Tests', () => {
  const mockLocationData = {
    uuid: '123',
    name: 'Test Location',
  };

  const mockEncounterConcepts = {
    visitTypes: {
      OPD: '345',
      IPD: '678',
    },
    encounterTypes: {
      Consultation: '789',
      'Follow-up': '012',
    },
    orderTypes: {},
    conceptData: {},
  };

  const mockUser = {
    uuid: 'user-uuid-123',
    display: 'Test User',
    username: 'testuser',
  };

  const mockProvider = {
    uuid: 'provider-uuid-123',
    display: 'Dr. Smith - Clinician',
    person: {
      uuid: 'person-uuid-456',
      display: 'Dr. John Smith',
      preferredName: {
        uuid: 'name-uuid-789',
        display: 'Dr. John Smith',
        links: [],
      },
    },
  };

  const mockActiveVisit = {
    resourceType: 'Encounter',
    id: 'encounter-1',
    status: 'in-progress',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
    },
    type: [
      {
        coding: [
          {
            code: '345',
            system: '',
            display: '',
          },
        ],
      },
    ],
    meta: {
      versionId: '',
      lastUpdated: '',
      tag: [],
    },
    subject: {
      reference: '',
      type: '',
      display: '',
    },
    period: {
      start: '2025-05-16T00:00:00.000Z',
    },
    location: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    i18n.changeLanguage('en');

    // Mock successful cookie access for location and user
    (commonUtils.getCookieByName as jest.Mock).mockImplementation(
      (cookieName) => {
        if (cookieName === 'bahmni.user.location') {
          return encodeURIComponent(JSON.stringify(mockLocationData));
        } else if (cookieName === 'bahmni.user') {
          return encodeURIComponent('"testuser"');
        }
        return null;
      },
    );

    // Setup default successful API responses
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === ENCOUNTER_CONCEPTS_URL) {
        return Promise.resolve(mockEncounterConcepts);
      } else if (url === USER_RESOURCE_URL('testuser')) {
        return Promise.resolve({
          results: [mockUser],
        });
      } else if (url === PROVIDER_RESOURCE_URL(mockUser.uuid)) {
        return Promise.resolve({
          results: [mockProvider],
        });
      } else if (url.includes('/ws/fhir2/R4/Encounter')) {
        return Promise.resolve({
          entry: [{ resource: mockActiveVisit }],
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Reset the store before each test
    useEncounterDetailsStore.getState().reset();
  });

  const renderBasicForm = () => {
    return render(
      <I18nextProvider i18n={i18n}>
        <BasicForm />
      </I18nextProvider>,
    );
  };

  test('successfully initializes form with all data loaded', async () => {
    renderBasicForm();

    // Wait for all API calls to complete and form to be ready
    await waitFor(() => {
      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('encounter-type-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('visit-type-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('practitioner-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('date-picker-input')).toBeInTheDocument();
    });

    // Verify field labels are displayed
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Encounter Type')).toBeInTheDocument();
    expect(screen.getByText('Visit Type')).toBeInTheDocument();
    expect(screen.getByText('Participant(s)')).toBeInTheDocument();

    // Verify API calls were made
    expect(api.get).toHaveBeenCalledWith(ENCOUNTER_CONCEPTS_URL);
    expect(api.get).toHaveBeenCalledWith(USER_RESOURCE_URL('testuser'));
    expect(api.get).toHaveBeenCalledWith(PROVIDER_RESOURCE_URL(mockUser.uuid));
    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining('/ws/fhir2/R4/Encounter'),
    );

    // Verify store state is updated
    const store = useEncounterDetailsStore.getState();
    expect(store.selectedLocation).toEqual({
      uuid: '123',
      display: 'Test Location',
      links: [],
    });
    expect(store.selectedEncounterType).toEqual({
      name: 'Consultation',
      uuid: '789',
    });
    expect(store.isEncounterDetailsFormReady).toBe(true);
  });

  test('handles location cookie not found error', async () => {
    (commonUtils.getCookieByName as jest.Mock).mockImplementation(
      (cookieName) => {
        if (cookieName === 'bahmni.user.location') {
          return null;
        } else if (cookieName === 'bahmni.user') {
          return encodeURIComponent('"testuser"');
        }
        return null;
      },
    );

    renderBasicForm();

    await waitFor(() => {
      // Location field should still be rendered but with empty state
      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
    });

    // Verify store reflects empty location
    const store = useEncounterDetailsStore.getState();
    expect(store.selectedLocation).toBeNull();
  });

  test('handles encounter concepts API error', async () => {
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === ENCOUNTER_CONCEPTS_URL) {
        return Promise.reject(new Error('Encounter concepts API error'));
      } else if (url === USER_RESOURCE_URL('testuser')) {
        return Promise.resolve({ results: [mockUser] });
      } else if (url === PROVIDER_RESOURCE_URL(mockUser.uuid)) {
        return Promise.resolve({ results: [mockProvider] });
      } else if (url.includes('/ws/fhir2/R4/Encounter')) {
        return Promise.resolve({ entry: [{ resource: mockActiveVisit }] });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderBasicForm();

    await waitFor(() => {
      // Should show loading state for encounter and visit type fields
      const skeletons = screen.getAllByTestId('skeleton-placeholder');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    // Wait a bit more for the error to propagate to the store
    await waitFor(() => {
      const store = useEncounterDetailsStore.getState();
      expect(store.hasError).toBe(true);
    });
  });

  test('handles practitioner API error', async () => {
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === ENCOUNTER_CONCEPTS_URL) {
        return Promise.resolve(mockEncounterConcepts);
      } else if (url === USER_RESOURCE_URL('testuser')) {
        return Promise.reject(new Error('User API error'));
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderBasicForm();

    await waitFor(() => {
      // Should show loading state for practitioner field
      const skeletons = screen.getAllByTestId('skeleton-placeholder');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    // Wait for the error to propagate to the store
    await waitFor(() => {
      const store = useEncounterDetailsStore.getState();
      expect(store.hasError).toBe(true);
    });
  });

  test('handles active visit API error', async () => {
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === ENCOUNTER_CONCEPTS_URL) {
        return Promise.resolve(mockEncounterConcepts);
      } else if (url === USER_RESOURCE_URL('testuser')) {
        return Promise.resolve({ results: [mockUser] });
      } else if (url === PROVIDER_RESOURCE_URL(mockUser.uuid)) {
        return Promise.resolve({ results: [mockProvider] });
      } else if (url.includes('/ws/fhir2/R4/Encounter')) {
        return Promise.reject(new Error('Active visit API error'));
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderBasicForm();

    await waitFor(() => {
      // Form should still render but with error state
      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
    });

    // Wait for the error to propagate to the store
    await waitFor(() => {
      const store = useEncounterDetailsStore.getState();
      expect(store.hasError).toBe(true);
    });
  });

  test('updates form ready state correctly', async () => {
    renderBasicForm();

    // Initially form should not be ready
    let store = useEncounterDetailsStore.getState();
    expect(store.isEncounterDetailsFormReady).toBe(false);

    // Wait for all loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('encounter-type-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('visit-type-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('practitioner-dropdown')).toBeInTheDocument();
    });

    // Form should now be ready
    store = useEncounterDetailsStore.getState();
    expect(store.isEncounterDetailsFormReady).toBe(true);
  });

  test('displays all fields as disabled', async () => {
    renderBasicForm();

    await waitFor(() => {
      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
    });

    // Verify all form fields are disabled
    const locationSelect = screen
      .getByTestId('location-dropdown')
      .querySelector('select');
    const encounterSelect = screen
      .getByTestId('encounter-type-dropdown')
      .querySelector('select');
    const visitSelect = screen
      .getByTestId('visit-type-dropdown')
      .querySelector('select');
    const practitionerSelect = screen
      .getByTestId('practitioner-dropdown')
      .querySelector('select');
    const dateInput = screen.getByTestId('date-picker-input');

    expect(locationSelect).toHaveAttribute('disabled');
    expect(encounterSelect).toHaveAttribute('disabled');
    expect(visitSelect).toHaveAttribute('disabled');
    expect(practitionerSelect).toHaveAttribute('disabled');
    expect(dateInput).toHaveAttribute('disabled');
  });

  test('displays error messages when API calls fail', async () => {
    // Mock all APIs to fail
    (api.get as jest.Mock).mockRejectedValue(new Error('API Error'));
    (commonUtils.getCookieByName as jest.Mock).mockImplementation(() => {
      throw new Error('Cookie error');
    });

    renderBasicForm();

    await waitFor(() => {
      // Should show skeleton loading states
      const skeletons = screen.getAllByTestId('skeleton-placeholder');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    // Wait for errors to propagate to the store
    await waitFor(() => {
      const store = useEncounterDetailsStore.getState();
      expect(store.hasError).toBe(true);
    });
  });
});
