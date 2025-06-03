import React from 'react';
import axios from 'axios';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ConsultationPad from '../ConsultationPad';
import { NotificationProvider } from '@providers/NotificationProvider';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';
import { validBundle } from '@__mocks__/consultationBundleMock';
import {
  mockLocations,
  mockEncounterConcepts,
  mockPractitioner,
  mockCurrentEncounter,
  mockDiagnosisSearchResults,
} from '@__mocks__/consultationPadMocks';

// Mock store factory functions
const createDiagnosisStore = () => ({
  selectedDiagnoses: [],
  validateAllDiagnoses: jest.fn().mockReturnValue(true),
  reset: jest.fn(),
  addDiagnosis: jest.fn(),
  removeDiagnosis: jest.fn(),
  updateCertainty: jest.fn(),
  getState: jest.fn(),
});

const createAllergyStore = () => ({
  selectedAllergies: [],
  validateAllAllergies: jest.fn().mockReturnValue(true),
  reset: jest.fn(),
  addAllergy: jest.fn(),
  removeAllergy: jest.fn(),
  updateSeverity: jest.fn(),
  updateReactions: jest.fn(),
  getState: jest.fn(),
});

// Mock the Zustand stores
jest.mock('@stores/diagnosisStore', () => ({
  useDiagnosisStore: jest.fn().mockImplementation(createDiagnosisStore),
}));

jest.mock('@stores/allergyStore', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(createAllergyStore),
}));

// Configure jest-axe
expect.extend(toHaveNoViolations);

// Mock axios at the module level
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: {
      headers: { common: { 'Content-Type': 'application/json' } },
    },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
  isAxiosError: jest.fn().mockReturnValue(true),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock date formatting
jest.mock('@utils/date', () => ({
  formatDate: jest.fn().mockReturnValue({
    formattedResult: '2025-05-26',
    error: undefined,
  }),
}));

// Mock getCookieByName
jest.mock('@utils/common', () => ({
  ...jest.requireActual('@utils/common'),
  getCookieByName: jest.fn().mockReturnValue(encodeURIComponent('"testUser"')),
}));

// Mock crypto for consistent UUIDs in tests
global.crypto.randomUUID = jest
  .fn()
  .mockReturnValue('1d87ab20-8b86-4b41-a30d-984b2208d945');

// Mock scrollIntoView (required for Carbon ComboBox)
Element.prototype.scrollIntoView = jest.fn();

describe('ConsultationPad Integration', () => {
  const mockPatientUUID = 'patient-123';
  const mockOnClose = jest.fn();
  let mockDiagnosisStore: ReturnType<typeof createDiagnosisStore>;
  let mockAllergyStore: ReturnType<typeof createAllergyStore>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create fresh store instances for each test
    mockDiagnosisStore = createDiagnosisStore();
    mockAllergyStore = createAllergyStore();

    // Update the mock implementations
    const { useDiagnosisStore } = jest.requireMock('@stores/diagnosisStore');
    const allergyStore = jest.requireMock('@stores/allergyStore');
    useDiagnosisStore.mockReturnValue(mockDiagnosisStore);
    allergyStore.default.mockReturnValue(mockAllergyStore);

    jest.spyOn(console, 'error').mockImplementation();
    const mockedAxios = axios.create() as jest.Mocked<typeof axios>;

    // Setup successful API responses
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/user')) {
        return Promise.resolve({
          data: { results: [{ uuid: 'user-123', username: 'testUser' }] },
        });
      }
      if (url.includes('/provider')) {
        return Promise.resolve({ data: { results: [mockPractitioner] } });
      }
      if (url.includes('/location')) {
        return Promise.resolve({ data: { results: mockLocations } });
      }
      if (url.includes('/encountertype')) {
        return Promise.resolve({ data: mockEncounterConcepts });
      }
      if (url.includes('/encounter')) {
        return Promise.resolve({ data: mockCurrentEncounter });
      }
      if (url.includes('/concept')) {
        return Promise.resolve({
          data: { results: mockDiagnosisSearchResults },
        });
      }
      return Promise.resolve({ data: {} });
    });

    mockedAxios.post.mockImplementation((url: string) => {
      if (url.includes('/consultation')) {
        return Promise.resolve({ data: validBundle });
      }
      return Promise.resolve({ data: {} });
    });
  });

  const renderConsultationPad = () => {
    return render(
      <NotificationProvider>
        <ClinicalConfigProvider>
          <ConsultationPad
            patientUUID={mockPatientUUID}
            onClose={mockOnClose}
          />
        </ClinicalConfigProvider>
      </NotificationProvider>,
    );
  };

  describe('Component Integration', () => {
    it('should load data and render successfully', async () => {
      renderConsultationPad();

      // Initially shows loading state
      expect(screen.getByText('CONSULTATION_PAD_LOADING')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify main components are rendered
      expect(screen.getByText('CONSULTATION_PAD_TITLE')).toBeInTheDocument();
      expect(
        screen.getByText('CONSULTATION_PAD_DONE_BUTTON'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('CONSULTATION_PAD_CANCEL_BUTTON'),
      ).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const mockedAxios = axios.create() as jest.Mocked<typeof axios>;
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      renderConsultationPad();

      await waitFor(() => {
        expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
      });
    });

    it('should handle submission errors', async () => {
      const mockedAxios = axios.create() as jest.Mocked<typeof axios>;
      mockedAxios.post.mockRejectedValueOnce(new Error('Submission Error'));

      renderConsultationPad();

      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('CONSULTATION_PAD_DONE_BUTTON'));

      await waitFor(() => {
        expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should close and reset stores when cancel button is clicked', async () => {
      renderConsultationPad();

      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('CONSULTATION_PAD_CANCEL_BUTTON'));
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockDiagnosisStore.reset).toHaveBeenCalled();
      expect(mockAllergyStore.reset).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderConsultationPad();

      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
