// Create shared mock functions that will be reused across all axios instances
const sharedMockGet = jest.fn();
const sharedMockPost = jest.fn();
const sharedMockPut = jest.fn();
const sharedMockDelete = jest.fn();

// Create a complete axios mock that satisfies all requirements
const createMockAxiosInstance = () => ({
  // HTTP methods - all instances share the same mock functions
  get: sharedMockGet,
  post: sharedMockPost,
  put: sharedMockPut,
  delete: sharedMockDelete,

  // Configuration
  defaults: {
    headers: {
      common: {},
    },
  },

  // Interceptors with proper return values
  interceptors: {
    request: {
      use: jest.fn(() => {
        // Store interceptors for potential use and return ID
        return Math.floor(Math.random() * 1000);
      }),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(() => {
        // Store interceptors for potential use and return ID
        return Math.floor(Math.random() * 1000);
      }),
      eject: jest.fn(),
    },
  },
});

// Mock axios module completely
jest.mock('axios', () => {
  const mockAxios = {
    ...createMockAxiosInstance(),
    create: jest.fn(() => createMockAxiosInstance()),
    isAxiosError: jest.fn((error) => error && error.isAxiosError === true),
    CancelToken: {
      source: jest.fn(() => ({
        token: {},
        cancel: jest.fn(),
      })),
    },
  };

  return {
    __esModule: true,
    default: mockAxios,
    create: mockAxios.create,
    isAxiosError: mockAxios.isAxiosError,
    CancelToken: mockAxios.CancelToken,
  };
});

// Mock the notification service BEFORE imports
jest.mock('@services/notificationService', () => ({
  __esModule: true,
  default: {
    register: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  },
}));

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ConsultationPad from '../ConsultationPad';
import { NotificationProvider } from '@providers/NotificationProvider';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';
import { ClinicalConfig } from '@types/config';
import notificationService from '@services/notificationService';

// Mock browser cache if used
const mockCache = new Map();
global.caches = {
  open: jest.fn().mockResolvedValue({
    put: jest.fn((key, value) => {
      mockCache.set(key, value);
      return Promise.resolve();
    }),
    match: jest.fn((key) => Promise.resolve(mockCache.get(key))),
    delete: jest.fn((key) => {
      mockCache.delete(key);
      return Promise.resolve(true);
    }),
  }),
  match: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(),
} as unknown as CacheStorage;

// Mock crypto for UUID generation
global.crypto.randomUUID = jest.fn().mockReturnValue('test-uuid-12345');

// Configure jest-axe
expect.extend(toHaveNoViolations);

describe('ConsultationPad Integration Tests', () => {
  // Test data
  const mockPatientUUID = 'patient-uuid-123';
  const mockOnClose = jest.fn();

  const mockClinicalConfig: ClinicalConfig = {
    patientInformation: {},
    actions: [],
    dashboards: [],
    consultationPad: {
      allergyConceptMap: {
        medicationAllergenUuid: 'med-allergen-uuid',
        foodAllergenUuid: 'food-allergen-uuid',
        environmentalAllergenUuid: 'env-allergen-uuid',
        allergyReactionUuid: 'reaction-uuid',
      },
    },
  };

  const mockLocations = [
    { uuid: 'loc-1', display: 'OPD Ward', links: [] },
    { uuid: 'loc-2', display: 'ICU', links: [] },
  ];

  const mockEncounterConcepts = {
    encounterTypes: [
      { uuid: 'enc-type-1', name: 'Consultation' },
      { uuid: 'enc-type-2', name: 'Follow-up' },
    ],
    visitTypes: [
      { uuid: 'visit-type-1', name: 'OPD' },
      { uuid: 'visit-type-2', name: 'IPD' },
    ],
  };

  const mockProvider = {
    uuid: 'provider-123',
    display: 'Dr. John Doe',
    person: {
      uuid: 'person-123',
      display: 'Dr. John Doe',
      gender: 'M',
      age: 35,
      birthdate: '1990-01-01T00:00:00.000+0000',
      birthdateEstimated: false,
      dead: false,
      deathDate: null,
      causeOfDeath: null,
      preferredName: {
        uuid: 'name-123',
        display: 'Dr. John Doe',
        links: [],
      },
      voided: false,
      birthtime: null,
      deathdateEstimated: false,
      links: [],
      resourceVersion: '1.9',
    },
  };

  const mockUser = {
    uuid: 'user-123',
    display: 'admin',
    username: 'admin',
    systemId: 'admin',
    userProperties: {},
    person: {
      uuid: 'person-123',
      display: 'Admin User',
    },
    privileges: [],
    roles: [],
  };

  const mockActiveVisit = {
    id: 'visit-123',
    status: 'in-progress',
    type: [
      {
        coding: [
          {
            code: 'visit-type-1',
            display: 'OPD',
          },
        ],
      },
    ],
    period: {
      start: '2025-06-01T10:00:00Z',
    },
  };

  const renderWithProviders = (component: React.ReactElement) => {
    // Initialize notification service
    const mockAddNotification = jest.fn();
    (notificationService.register as jest.Mock).mockImplementation(
      (callback) => {
        mockAddNotification.mockImplementation(callback);
      },
    );

    return render(
      <ClinicalConfigProvider>
        <NotificationProvider>{component}</NotificationProvider>
      </ClinicalConfigProvider>,
    );
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCache.clear();

    // Setup axios mock responses for various service calls
    sharedMockGet.mockImplementation((url: string) => {
      // Mock config service
      if (url.includes('/config')) {
        return Promise.resolve({ data: mockClinicalConfig });
      }

      // Mock locations service
      if (url.includes('/location')) {
        return Promise.resolve({ data: { results: mockLocations } });
      }

      // Mock encounter concepts service
      if (url.includes('/encountertype')) {
        return Promise.resolve({
          data: { results: mockEncounterConcepts.encounterTypes },
        });
      }
      if (url.includes('/visittype')) {
        return Promise.resolve({
          data: { results: mockEncounterConcepts.visitTypes },
        });
      }

      // Mock provider service
      if (url.includes('/provider')) {
        return Promise.resolve({ data: { results: [mockProvider] } });
      }

      // Mock user service
      if (url.includes('/user') || url.includes('/session')) {
        return Promise.resolve({ data: mockUser });
      }

      // Mock patient service (active visit)
      if (url.includes('/visit') && url.includes('active')) {
        return Promise.resolve({ data: { results: [mockActiveVisit] } });
      }

      // Mock concept search
      if (url.includes('/concept') && url.includes('search')) {
        return Promise.resolve({ data: { results: [] } });
      }

      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    });

    // Mock axios post for consultation bundle submission
    sharedMockPost.mockResolvedValue({
      data: {
        resourceType: 'Bundle',
        type: 'transaction-response',
        entry: [],
      },
    });

    // Mock window location
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.location = { search: `?patientUuid=${mockPatientUUID}` } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Integration Tests', () => {
    it('should render consultation pad with basic elements', async () => {
      const { container } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );

      // Wait for initial data to load
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /New Consultation/i }),
        ).toBeInTheDocument();
      });

      // Verify basic form elements are present using container queries
      expect(container.querySelector('#location-dropdown')).toBeInTheDocument();
      expect(
        container.querySelector('#encounter-type-dropdown'),
      ).toBeInTheDocument();

      // Verify diagnoses and allergies forms are present
      expect(
        screen.getByPlaceholderText(/Search to add new diagnosis/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Search to add new allergy/i),
      ).toBeInTheDocument();

      // Verify action buttons are present
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('should load initial data and show expected form state', async () => {
      const { container } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );

      // Wait for initial rendering
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /New Consultation/i }),
        ).toBeInTheDocument();
      });

      // Verify that the component has rendered with expected form elements
      expect(container.querySelector('#location-dropdown')).toBeInTheDocument();
      expect(
        container.querySelector('#encounter-type-dropdown'),
      ).toBeInTheDocument();

      // Verify that the forms are present
      expect(
        screen.getByPlaceholderText(/Search to add new diagnosis/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Search to add new allergy/i),
      ).toBeInTheDocument();
    });

    it('should handle form submission attempt', async () => {
      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      // Wait for initial rendering
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /New Consultation/i }),
        ).toBeInTheDocument();
      });

      // Try to click the submit button (should be disabled)
      const submitButton = screen.getByText('Done');
      expect(submitButton).toBeInTheDocument();

      // The button should be disabled since required fields aren't filled
      expect(submitButton).toBeDisabled();

      // Ensure no submission occurred since button is disabled
      expect(sharedMockPost).not.toHaveBeenCalled();
    });

    it('should handle form cancellation', async () => {
      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /New Consultation/i }),
        ).toBeInTheDocument();
      });

      // Cancel the form
      const cancelButton = screen.getByText('Cancel');
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      // Verify callback was called
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should prevent submission when required fields are missing', async () => {
      renderWithProviders(<ConsultationPad onClose={mockOnClose} />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /New Consultation/i }),
        ).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByText('Done');
      expect(submitButton).toBeDisabled();

      // Ensure no submission occurred
      expect(sharedMockPost).not.toHaveBeenCalled();
    });

    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <ConsultationPad onClose={mockOnClose} />,
      );

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /New Consultation/i }),
        ).toBeInTheDocument();
      });

      // Check for accessibility violations
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
