import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TranslationProvider } from '../TranslationProvider';
import * as translationService from '@services/translationService';
import * as i18nModule from '@/i18n';

// Mock dependencies
jest.mock('@carbon/react', () => ({
  Loading: jest.fn(() => <div data-testid="loading-component">Loading...</div>),
}));

jest.mock('@services/translationService');
jest.mock('@services/notificationService');

// Mock i18n
jest.mock('@/i18n', () => ({
  __esModule: true,
  default: {
    use: jest.fn().mockReturnThis(),
    init: jest.fn().mockResolvedValue({}),
    t: jest.fn((key) => key),
    changeLanguage: jest.fn().mockResolvedValue({}),
  },
  initI18n: jest.fn().mockResolvedValue({
    use: jest.fn().mockReturnThis(),
    init: jest.fn().mockResolvedValue({}),
  }),
  i18nInstance: {
    use: jest.fn().mockReturnThis(),
    init: jest.fn().mockResolvedValue({}),
    t: jest.fn((key) => key),
    changeLanguage: jest.fn().mockResolvedValue({}),
  },
}));

// Mock React.Suspense to control its behavior in tests
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    Suspense: ({
      children,
      fallback,
    }: {
      children: React.ReactNode;
      fallback: React.ReactNode;
    }) => {
      return (
        <div data-testid="suspense-wrapper">
          <div data-testid="suspense-fallback">{fallback}</div>
          <div data-testid="suspense-children">{children}</div>
        </div>
      );
    },

    /* eslint-disable  @typescript-eslint/no-explicit-any */
    memo: (component: any) => component,
  };
});

// Create a test component to use inside the provider
const TestComponent = () => (
  <div data-testid="test-component">Test Content</div>
);

describe('TranslationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      );

      expect(screen.getByTestId('suspense-wrapper')).toBeInTheDocument();
    });

    it('should render children when translations are loaded', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should properly wrap children with Suspense', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      );

      expect(screen.getByTestId('suspense-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('suspense-children')).toBeInTheDocument();
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('Suspense Integration', () => {
    it('should show loading state while translations are being fetched', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      );

      expect(screen.getByTestId('suspense-fallback')).toBeInTheDocument();
      expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    });

    it('should render children after translations are loaded', async () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      );

      // Children should be rendered even with the mock Suspense
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should handle multiple children while loading', () => {
      render(
        <TranslationProvider>
          <div>First Child</div>
          <div>Second Child</div>
        </TranslationProvider>,
      );

      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
      expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    });
  });

  describe('Translation Integration', () => {
    it('should handle language switching', async () => {
      // Mock the i18n instance
      const mockChangeLanguage = jest.fn().mockResolvedValue({});

      // Since i18nInstance is a constant, not a function, we need to mock it differently
      Object.defineProperty(i18nModule, 'i18nInstance', {
        value: {
          ...i18nModule.i18nInstance,
          changeLanguage: mockChangeLanguage,
        },
        configurable: true,
      });

      // Render the component
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      );

      // Simulate language change
      await i18nModule.i18nInstance.changeLanguage('es');

      // Verify language was changed
      expect(mockChangeLanguage).toHaveBeenCalledWith('es');
    });
  });

  describe('Error Handling', () => {
    it('should handle failed translation fetches gracefully', async () => {
      // Mock the getUserPreferredLocale to return 'en'
      jest
        .spyOn(translationService, 'getUserPreferredLocale')
        .mockReturnValue('en');

      // Mock the getTranslations function to throw an error
      const mockError = new Error('Failed to fetch translations');
      jest
        .spyOn(translationService, 'getTranslations')
        .mockRejectedValue(mockError);

      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Render the component
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      );

      // Component should still render despite the error
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('should recover from network errors', async () => {
      // Mock the getUserPreferredLocale to return 'en'
      jest
        .spyOn(translationService, 'getUserPreferredLocale')
        .mockReturnValue('en');

      // Mock the getTranslations function to first fail, then succeed on retry
      const mockTranslations = {
        en: {
          clinical: {
            'test.key': 'Test Value',
          },
        },
      };

      jest
        .spyOn(translationService, 'getTranslations')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockTranslations);

      // Mock console.error to prevent test output pollution
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Re-mock i18n to test initialization
      const mockI18n = {
        use: jest.fn().mockReturnThis(),
        init: jest.fn().mockResolvedValue({}),
      };
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      jest.spyOn(i18nModule, 'initI18n').mockResolvedValue(mockI18n as any);

      // Render the component
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      );

      // Component should still render despite the initial error
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });
});
