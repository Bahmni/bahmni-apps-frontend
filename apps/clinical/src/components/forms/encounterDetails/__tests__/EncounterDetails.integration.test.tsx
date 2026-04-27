import {
  getCookieByName,
  getFormattedError,
  getActiveVisit,
  getCurrentUser,
  getCurrentProvider,
} from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import { render, screen, waitFor, act } from '@testing-library/react';
import { getEncounterConcepts } from '../../../../services/encounterConceptsService';
import { getLocations } from '../../../../services/locationService';
import { useEncounterDetailsStore } from '../../../../stores/encounterDetailsStore';
import BasicForm from '../EncounterDetails';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getCookieByName: jest.fn(),
  getFormattedError: jest.fn(),
  getActiveVisit: jest.fn(),
  getCurrentUser: jest.fn(),
  getCurrentProvider: jest.fn(),
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

// Mock encounter concepts service
jest.mock('../../../../services/encounterConceptsService', () => ({
  getEncounterConcepts: jest.fn(),
}));

// Mock location service
jest.mock('../../../../services/locationService', () => ({
  getLocations: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useActivePractitioner: jest.fn(),
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

describe('BasicForm Integration Tests', () => {
  const mockLocationData = {
    uuid: '123',
    display: 'Test Location',
    links: [],
  };

  const mockEncounterConcepts = {
    visitTypes: [
      { name: 'OPD', uuid: '345' },
      { name: 'IPD', uuid: '678' },
    ],
    encounterTypes: [
      { name: 'Consultation', uuid: '789' },
      { name: 'Follow-up', uuid: '012' },
    ],
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

    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: jest.fn().mockReturnValue('MM/dd/yyyy h:mm a'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
      configurable: true,
    });

    (getCookieByName as jest.Mock).mockImplementation((cookieName) => {
      if (cookieName === 'bahmni.user.location') {
        return encodeURIComponent(JSON.stringify(mockLocationData));
      } else if (cookieName === 'bahmni.user') {
        return encodeURIComponent('"testuser"');
      }
      return null;
    });

    (getFormattedError as jest.Mock).mockImplementation((error: any) => ({
      title: error.title ?? 'unknown title',
      message: error.message ?? 'Unknown error',
    }));

    (getEncounterConcepts as jest.Mock).mockResolvedValue(
      mockEncounterConcepts,
    );
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (getCurrentProvider as jest.Mock).mockResolvedValue(mockProvider);
    (getActiveVisit as jest.Mock).mockResolvedValue(mockActiveVisit);
    (getLocations as jest.Mock).mockResolvedValue([mockLocationData]);

    (useActivePractitioner as jest.Mock).mockReturnValue({
      practitioner: mockProvider,
      user: mockUser,
      loading: false,
      error: null,
    });

    // Reset the store before each test
    useEncounterDetailsStore.getState().reset();
  });

  const renderBasicForm = (customPractitionerState?: any) => {
    const practitionerState = customPractitionerState ?? {
      practitioner: mockProvider,
      user: mockUser,
      loading: false,
      error: null,
      refetch: jest.fn(),
    };
    return render(<BasicForm practitionerState={practitionerState} />);
  };

  test('successfully initializes form with all data loaded', async () => {
    renderBasicForm();

    // Wait for all API calls to complete and form to be ready.
    // Real hooks (useLocations, useEncounterConcepts, useActiveVisit) each trigger
    // async render cycles, so we allow up to 10 s for the cascade to settle.
    await waitFor(
      () => {
        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByText('Encounter Type')).toBeInTheDocument();
        expect(screen.getByText('Participant(s)')).toBeInTheDocument();
        expect(screen.getByText('Encounter Date')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    let store = useEncounterDetailsStore.getState();
    act(() => {
      store.setSelectedVisitType({ name: 'OPD', uuid: '345' });
    });

    await waitFor(() => {
      expect(screen.getByText('Visit Type')).toBeInTheDocument();
    });

    // Verify field labels are displayed
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Encounter Type')).toBeInTheDocument();
    expect(screen.getByText('Visit Type')).toBeInTheDocument();
    expect(screen.getByText('Participant(s)')).toBeInTheDocument();

    store = useEncounterDetailsStore.getState();
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
  }, 15000);

  test('handles location cookie not found error', async () => {
    (getCookieByName as jest.Mock).mockImplementation((cookieName) => {
      if (cookieName === 'bahmni.user.location') {
        return null;
      } else if (cookieName === 'bahmni.user') {
        return encodeURIComponent('"testuser"');
      }
      return null;
    });

    (getLocations as jest.Mock).mockResolvedValue([]);

    renderBasicForm();

    await waitFor(() => {
      // When no locations are available, skeleton placeholders are shown
      const skeletonElements = document.querySelectorAll(
        '.cds--skeleton__text',
      );
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
    const store = useEncounterDetailsStore.getState();
    expect(store.selectedLocation).toBeNull();
  });

  test('handles encounter concepts API error', async () => {
    (getEncounterConcepts as jest.Mock).mockRejectedValue(
      new Error('Encounter concepts API error'),
    );

    renderBasicForm();

    await waitFor(() => {
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Encounter Type')).toBeInTheDocument();
    });
    await waitFor(() => {
      const store = useEncounterDetailsStore.getState();
      expect(store.isError).toBe(true);
    });
  });

  test('handles practitioner API error', async () => {
    (getCurrentUser as jest.Mock).mockRejectedValue(
      new Error('User API error'),
    );

    (useActivePractitioner as jest.Mock).mockReturnValue({
      practitioner: null,
      user: null,
      loading: false,
      error: new Error('User API error'),
    });

    renderBasicForm({
      practitioner: null,
      user: null,
      loading: false,
      error: new Error('User API error'),
      refetch: jest.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Participant(s)')).toBeInTheDocument();
    });
    await waitFor(() => {
      const store = useEncounterDetailsStore.getState();
      expect(store.isError).toBe(true);
    });
  });

  test('handles active visit API error', async () => {
    (getActiveVisit as jest.Mock).mockRejectedValue(
      new Error('Active visit API error'),
    );

    renderBasicForm();

    await waitFor(() => {
      expect(screen.getByText('Location')).toBeInTheDocument();
    });
    await waitFor(() => {
      const store = useEncounterDetailsStore.getState();
      expect(store.isError).toBe(true);
    });
  });

  test('updates form ready state correctly', async () => {
    // Mock active visit without a matching visit type to prevent auto-selection
    const mockActiveVisitNoType = {
      ...mockActiveVisit,
      type: [
        {
          coding: [
            {
              code: 'non-matching-code',
              system: '',
              display: '',
            },
          ],
        },
      ],
    };

    (getActiveVisit as jest.Mock).mockResolvedValue(mockActiveVisitNoType);

    renderBasicForm();

    // Initially, form should not be ready because selectedVisitType is null
    await waitFor(() => {
      const store = useEncounterDetailsStore.getState();
      expect(store.isEncounterDetailsFormReady).toBe(false);
    });

    await waitFor(() => {
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Encounter Type')).toBeInTheDocument();
      expect(screen.getByText('Participant(s)')).toBeInTheDocument();
    });

    // Set the visit type to make form ready
    const store = useEncounterDetailsStore.getState();
    act(() => {
      store.setSelectedVisitType({ name: 'OPD', uuid: '345' });
    });

    await waitFor(() => {
      expect(screen.getByText('Visit Type')).toBeInTheDocument();
    });

    await waitFor(() => {
      const currentStore = useEncounterDetailsStore.getState();
      expect(currentStore.isEncounterDetailsFormReady).toBe(true);
    });
  });

  test('sets isError when requestedEncounterType is not in the fetched encounterTypes list', async () => {
    useEncounterDetailsStore
      .getState()
      .setRequestedEncounterType('NonExistentEncounterType');

    renderBasicForm();

    await waitFor(() => {
      const store = useEncounterDetailsStore.getState();
      expect(store.isError).toBe(true);
    });
  });

  test('displays error messages when API calls fail', async () => {
    // Mock all APIs to fail
    (getEncounterConcepts as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );
    (getCurrentUser as jest.Mock).mockRejectedValue(new Error('API Error'));
    (getCurrentProvider as jest.Mock).mockRejectedValue(new Error('API Error'));
    (getActiveVisit as jest.Mock).mockRejectedValue(new Error('API Error'));
    (getLocations as jest.Mock).mockRejectedValue(new Error('API Error'));
    (getCookieByName as jest.Mock).mockImplementation(() => {
      throw new Error('Cookie error');
    });

    (useActivePractitioner as jest.Mock).mockReturnValue({
      practitioner: null,
      user: null,
      loading: false,
      error: new Error('API Error'),
    });

    renderBasicForm({
      practitioner: null,
      user: null,
      loading: false,
      error: new Error('API Error'),
      refetch: jest.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Encounter Type')).toBeInTheDocument();
    });
    await waitFor(() => {
      const store = useEncounterDetailsStore.getState();
      expect(store.isError).toBe(true);
    });
  });
});
