import {
  getCurrentProvider,
  getCurrentUser,
  Provider,
  User,
  getFormattedError,
} from '@bahmni/services';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ActivePractitionerProvider } from '../ActivePractitionerProvider';
import { useActivePractitioner } from '../useActivePractitioner';

// Mock the services
jest.mock('@bahmni/services', () => ({
  getCurrentUser: jest.fn(),
  getCurrentProvider: jest.fn(),
  getFormattedError: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;

const mockGetCurrentProvider = getCurrentProvider as jest.MockedFunction<
  typeof getCurrentProvider
>;

const mockGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

// Mock react-router-dom to prevent TextEncoder issues
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock the timer functions
jest.useFakeTimers();

// Test user data
const mockUser: User = {
  uuid: 'user-uuid-123',
  username: 'testdoctor',
};

const mockAnotherUser: User = {
  uuid: 'user-uuid-456',
  username: 'anotherdoctor',
};

// Test provider data
const mockProvider: Provider = {
  uuid: 'provider-uuid-123',
  display: 'Dr. Test Doctor',
  person: {
    uuid: 'person-uuid-123',
    display: 'Dr. Test Doctor',
    gender: 'M',
    age: 45,
    birthdate: '1980-01-01',
    birthdateEstimated: false,
    dead: false,
    deathDate: null,
    causeOfDeath: null,
    preferredName: {
      uuid: 'name-uuid-123',
      display: 'Dr. Test Doctor',
      links: [],
    },
    voided: false,
    birthtime: null,
    deathdateEstimated: false,
    links: [],
    resourceVersion: '1.8',
  },
};

const mockAnotherProvider: Provider = {
  uuid: 'provider-uuid-456',
  display: 'Dr. Another Doctor',
  person: {
    uuid: 'person-uuid-456',
    display: 'Dr. Another Doctor',
    gender: 'F',
    age: 38,
    birthdate: '1987-05-15',
    birthdateEstimated: false,
    dead: false,
    deathDate: null,
    causeOfDeath: null,
    preferredName: {
      uuid: 'name-uuid-456',
      display: 'Dr. Another Doctor',
      links: [],
    },
    voided: false,
    birthtime: null,
    deathdateEstimated: false,
    links: [],
    resourceVersion: '1.8',
  },
};

// Test component that uses the useActivePractitioner hook
const TestComponent = () => {
  const { practitioner, user, loading, error } = useActivePractitioner();
  return (
    <div>
      <div data-testid="practitioner-loading">
        {loading ? 'Loading' : 'Loaded'}
      </div>
      <div data-testid="practitioner-data">
        {practitioner ? practitioner.uuid : 'No practitioner'}
      </div>
      <div data-testid="user-data">{user ? user.uuid : 'No user'}</div>
      <div data-testid="practitioner-error">
        {error ? error.message : 'No error'}
      </div>
    </div>
  );
};

// Test component to test refetch functionality
const TestRefetchComponent = () => {
  const { practitioner, user, loading, error, refetch } =
    useActivePractitioner();
  return (
    <div>
      <div data-testid="practitioner-loading">
        {loading ? 'Loading' : 'Loaded'}
      </div>
      <div data-testid="practitioner-data">
        {practitioner ? practitioner.uuid : 'No practitioner'}
      </div>
      <div data-testid="user-data">{user ? user.uuid : 'No user'}</div>
      <div data-testid="practitioner-error">
        {error ? error.message : 'No error'}
      </div>
      <button onClick={refetch} data-testid="refetch-button">
        Refetch
      </button>
    </div>
  );
};

describe('ActivePractitionerProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Initial Load Tests', () => {
    it('should load user and practitioner successfully on mount', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(mockUser);
      mockGetCurrentProvider.mockResolvedValueOnce(mockProvider);

      render(
        <ActivePractitionerProvider>
          <TestComponent />
        </ActivePractitionerProvider>,
      );

      // Initially should be loading
      expect(screen.getByTestId('practitioner-loading').textContent).toBe(
        'Loading',
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      expect(screen.getByTestId('practitioner-data').textContent).toBe(
        mockProvider.uuid,
      );
      expect(screen.getByTestId('user-data').textContent).toBe(mockUser.uuid);
      expect(screen.getByTestId('practitioner-error').textContent).toBe(
        'No error',
      );
      expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
      expect(mockGetCurrentProvider).toHaveBeenCalledWith(mockUser.uuid);
    });

    it('should handle user without practitioner role', async () => {
      const userWithoutProvider: User = {
        uuid: 'user-uuid-789',
        username: 'admin',
      };

      mockGetCurrentUser.mockResolvedValueOnce(userWithoutProvider);
      mockGetCurrentProvider.mockResolvedValueOnce(null);
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'ERROR_FETCHING_PRACTITIONERS_DETAILS',
      });

      render(
        <ActivePractitionerProvider>
          <TestComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      expect(screen.getByTestId('practitioner-data').textContent).toBe(
        'No practitioner',
      );
      expect(screen.getByTestId('user-data').textContent).toBe(
        userWithoutProvider.uuid,
      );
      expect(screen.getByTestId('practitioner-error').textContent).toContain(
        'ERROR_FETCHING_PRACTITIONERS_DETAILS',
      );
    });

    it('should handle different practitioner types correctly', async () => {
      const specialistProvider: Provider = {
        uuid: 'provider-uuid-special',
        display: 'Dr. Specialist',
        person: {
          uuid: 'person-uuid-special',
          display: 'Dr. Specialist',
          gender: 'M',
          age: 50,
          birthdate: '1975-03-20',
          birthdateEstimated: false,
          dead: false,
          deathDate: null,
          causeOfDeath: null,
          preferredName: {
            uuid: 'name-uuid-special',
            display: 'Dr. Specialist',
            links: [],
          },
          voided: false,
          birthtime: null,
          deathdateEstimated: false,
          links: [],
          resourceVersion: '1.8',
        },
      };

      mockGetCurrentUser.mockResolvedValueOnce(mockUser);
      mockGetCurrentProvider.mockResolvedValueOnce(specialistProvider);

      render(
        <ActivePractitionerProvider>
          <TestComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      expect(screen.getByTestId('practitioner-data').textContent).toBe(
        specialistProvider.uuid,
      );
      expect(screen.getByTestId('practitioner-error').textContent).toBe(
        'No error',
      );
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle user fetch error', async () => {
      const networkError = new Error('Network error');
      mockGetCurrentUser.mockRejectedValueOnce(networkError);
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'Network error',
      });

      render(
        <ActivePractitionerProvider>
          <TestComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      expect(screen.getByTestId('practitioner-data').textContent).toBe(
        'No practitioner',
      );
      expect(screen.getByTestId('user-data').textContent).toBe('No user');
      expect(screen.getByTestId('practitioner-error').textContent).toBe(
        'Network error',
      );
      expect(mockGetCurrentProvider).not.toHaveBeenCalled();
    });

    it('should handle null user response', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(null);
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'ERROR_FETCHING_USER_DETAILS',
      });

      render(
        <ActivePractitionerProvider>
          <TestComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      expect(screen.getByTestId('user-data').textContent).toBe('No user');
      expect(screen.getByTestId('practitioner-error').textContent).toContain(
        'ERROR_FETCHING_USER_DETAILS',
      );
    });

    it('should handle provider fetch error after successful user fetch', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(mockUser);
      mockGetCurrentProvider.mockRejectedValueOnce(
        new Error('Provider service unavailable'),
      );
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'Provider service unavailable',
      });

      render(
        <ActivePractitionerProvider>
          <TestComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      expect(screen.getByTestId('user-data').textContent).toBe(mockUser.uuid);
      expect(screen.getByTestId('practitioner-data').textContent).toBe(
        'No practitioner',
      );
      expect(screen.getByTestId('practitioner-error').textContent).toBe(
        'Provider service unavailable',
      );
    });

    it('should handle malformed JSON response', async () => {
      const jsonError = new SyntaxError('Unexpected token in JSON');
      mockGetCurrentUser.mockRejectedValueOnce(jsonError);
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'Unexpected token in JSON',
      });

      render(
        <ActivePractitionerProvider>
          <TestComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      expect(screen.getByTestId('practitioner-error').textContent).toBe(
        'Unexpected token in JSON',
      );
    });

    it('should handle 401 unauthorized error', async () => {
      const authError = new Error('Unauthorized');
      mockGetCurrentUser.mockRejectedValueOnce(authError);
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Authentication Error',
        message: 'Unauthorized',
      });

      render(
        <ActivePractitionerProvider>
          <TestComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      expect(screen.getByTestId('practitioner-error').textContent).toBe(
        'Unauthorized',
      );
    });
  });

  describe('Refetch Functionality Tests', () => {
    it('should refetch data when refetch is called', async () => {
      // Initial data
      mockGetCurrentUser.mockResolvedValueOnce(mockUser);
      mockGetCurrentProvider.mockResolvedValueOnce(mockProvider);

      const { rerender } = render(
        <ActivePractitionerProvider>
          <TestRefetchComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      expect(screen.getByTestId('practitioner-data').textContent).toBe(
        mockProvider.uuid,
      );

      // Set up new data for refetch
      mockGetCurrentUser.mockResolvedValueOnce(mockAnotherUser);
      mockGetCurrentProvider.mockResolvedValueOnce(mockAnotherProvider);

      // Trigger refetch
      act(() => {
        screen.getByTestId('refetch-button').click();
      });

      // Should show loading state
      expect(screen.getByTestId('practitioner-loading').textContent).toBe(
        'Loading',
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      // Should have new data
      expect(screen.getByTestId('practitioner-data').textContent).toBe(
        mockAnotherProvider.uuid,
      );
      expect(screen.getByTestId('user-data').textContent).toBe(
        mockAnotherUser.uuid,
      );
      expect(mockGetCurrentUser).toHaveBeenCalledTimes(2);
      expect(mockGetCurrentProvider).toHaveBeenCalledTimes(2);
    });

    it('should handle error on refetch', async () => {
      // Initial successful load
      mockGetCurrentUser.mockResolvedValueOnce(mockUser);
      mockGetCurrentProvider.mockResolvedValueOnce(mockProvider);

      render(
        <ActivePractitionerProvider>
          <TestRefetchComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      // Setup error for refetch
      mockGetCurrentUser.mockRejectedValueOnce(new Error('Refetch failed'));
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'Refetch failed',
      });

      // Trigger refetch
      act(() => {
        screen.getByTestId('refetch-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      expect(screen.getByTestId('practitioner-error').textContent).toBe(
        'Refetch failed',
      );
    });

    it('should clear error on successful refetch after error', async () => {
      // Initial error
      mockGetCurrentUser.mockRejectedValueOnce(new Error('Initial error'));
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'Initial error',
      });

      render(
        <ActivePractitionerProvider>
          <TestRefetchComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-error').textContent).toBe(
          'Initial error',
        );
      });

      // Successful refetch
      mockGetCurrentUser.mockResolvedValueOnce(mockUser);
      mockGetCurrentProvider.mockResolvedValueOnce(mockProvider);

      act(() => {
        screen.getByTestId('refetch-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      expect(screen.getByTestId('practitioner-error').textContent).toBe(
        'No error',
      );
      expect(screen.getByTestId('practitioner-data').textContent).toBe(
        mockProvider.uuid,
      );
    });
  });

  describe('Provider Integration Tests', () => {
    it('should provide context to multiple child components', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(mockUser);
      mockGetCurrentProvider.mockResolvedValueOnce(mockProvider);

      const ChildComponent1 = () => {
        const { practitioner } = useActivePractitioner();
        return (
          <div data-testid="child1">
            {practitioner ? practitioner.display : 'No ID'}
          </div>
        );
      };

      const ChildComponent2 = () => {
        const { user } = useActivePractitioner();
        return (
          <div data-testid="child2">{user ? user.username : 'No username'}</div>
        );
      };

      const ChildComponent3 = () => {
        const { loading } = useActivePractitioner();
        return <div data-testid="child3">{loading ? 'Loading' : 'Ready'}</div>;
      };

      render(
        <ActivePractitionerProvider>
          <ChildComponent1 />
          <ChildComponent2 />
          <ChildComponent3 />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('child3').textContent).toBe('Ready');
      });

      expect(screen.getByTestId('child1').textContent).toBe(
        mockProvider.display,
      );
      expect(screen.getByTestId('child2').textContent).toBe(mockUser.username);
      expect(screen.getByTestId('child3').textContent).toBe('Ready');
    });

    it('should share same state across all consumers', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(mockUser);
      mockGetCurrentProvider.mockResolvedValueOnce(mockProvider);

      const Component1 = () => {
        const { practitioner } = useActivePractitioner();
        return <div data-testid="comp1">{practitioner?.uuid}</div>;
      };

      const Component2 = () => {
        const { practitioner } = useActivePractitioner();
        return <div data-testid="comp2">{practitioner?.uuid}</div>;
      };

      render(
        <ActivePractitionerProvider>
          <Component1 />
          <Component2 />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('comp1').textContent).toBe(mockProvider.uuid);
      });

      // Both components should show the same UUID
      expect(screen.getByTestId('comp1').textContent).toBe(mockProvider.uuid);
      expect(screen.getByTestId('comp2').textContent).toBe(mockProvider.uuid);

      // API should only be called once, not twice
      expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
      expect(mockGetCurrentProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hook Error Tests', () => {
    it('should throw error when useActivePractitioner is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const TestComponentOutsideProvider = () => {
        useActivePractitioner();
        return <div>Test</div>;
      };

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow(
        'useActivePractitioner must be used within ActivePractitionerProvider',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data consistency during state updates', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(mockUser);
      mockGetCurrentProvider.mockResolvedValueOnce(mockProvider);

      const { rerender } = render(
        <ActivePractitionerProvider>
          <TestComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      const initialPractitionerId =
        screen.getByTestId('practitioner-data').textContent;
      const initialUserId = screen.getByTestId('user-data').textContent;

      // Rerender should maintain the same data
      rerender(
        <ActivePractitionerProvider>
          <TestComponent />
        </ActivePractitionerProvider>,
      );

      expect(screen.getByTestId('practitioner-data').textContent).toBe(
        initialPractitionerId,
      );
      expect(screen.getByTestId('user-data').textContent).toBe(initialUserId);
    });

    it('should handle rapid consecutive refetch calls correctly', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetCurrentProvider.mockResolvedValue(mockProvider);

      render(
        <ActivePractitionerProvider>
          <TestRefetchComponent />
        </ActivePractitionerProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      // Trigger multiple refetch calls
      act(() => {
        screen.getByTestId('refetch-button').click();
        screen.getByTestId('refetch-button').click();
        screen.getByTestId('refetch-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('practitioner-loading').textContent).toBe(
          'Loaded',
        );
      });

      // Should still have correct data
      expect(screen.getByTestId('practitioner-data').textContent).toBe(
        mockProvider.uuid,
      );
      expect(screen.getByTestId('practitioner-error').textContent).toBe(
        'No error',
      );
    });
  });
});
