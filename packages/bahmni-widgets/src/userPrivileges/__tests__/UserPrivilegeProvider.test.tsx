import {
  getCurrentUserPrivileges,
  UserPrivilege,
  getFormattedError,
} from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';

import '@testing-library/jest-dom';

import { UserPrivilegeProvider } from '../UserPrivilegeProvider';
import { useUserPrivilege } from '../useUserPrivilege';

// Mock the privilegeService
jest.mock('@bahmni/services', () => ({
  getCurrentUserPrivileges: jest.fn(),
  getFormattedError: jest.fn(),
  notificationService: {
    showError: jest.fn(),
  },
}));

const mockGetCurrentUserPrivileges =
  getCurrentUserPrivileges as jest.MockedFunction<
    typeof getCurrentUserPrivileges
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

// Test privilege data
const mockUserPrivileges: UserPrivilege[] = [
  { name: 'app:clinical:observationForms' },
  { name: 'view:forms' },
  { name: 'edit:forms' },
];

const mockAdminPrivileges: UserPrivilege[] = [
  { name: 'app:clinical:observationForms' },
  { name: 'view:forms' },
  { name: 'edit:forms' },
  { name: 'admin:superuser' },
  { name: 'manage:users' },
];

const mockLimitedPrivileges: UserPrivilege[] = [{ name: 'view:forms' }];

const mockEmptyPrivileges: UserPrivilege[] = [];

// Test component that uses the useUserPrivilege hook
const TestComponent = () => {
  const { userPrivileges, isLoading, error } = useUserPrivilege();
  return (
    <div>
      <div data-testid="privilege-test">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="privilege-data">
        {userPrivileges ? JSON.stringify(userPrivileges) : 'No privileges'}
      </div>
      <div data-testid="privilege-error">
        {error ? error.message : 'No error'}
      </div>
    </div>
  );
};

describe('UserPrivilegeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Initial Load Tests', () => {
    it('should load user privileges successfully on mount', async () => {
      mockGetCurrentUserPrivileges.mockResolvedValueOnce(mockUserPrivileges);

      render(
        <UserPrivilegeProvider>
          <TestComponent />
        </UserPrivilegeProvider>,
      );

      // Initially should be loading
      expect(screen.getByTestId('privilege-test').textContent).toBe('Loading');

      await waitFor(() => {
        expect(screen.getByTestId('privilege-test').textContent).toBe('Loaded');
      });

      expect(screen.getByTestId('privilege-data').textContent).toBe(
        JSON.stringify(mockUserPrivileges),
      );
      expect(screen.getByTestId('privilege-error').textContent).toBe(
        'No error',
      );
      expect(mockGetCurrentUserPrivileges).toHaveBeenCalledTimes(1);
    });

    it('should handle empty privileges array', async () => {
      mockGetCurrentUserPrivileges.mockResolvedValueOnce(mockEmptyPrivileges);

      render(
        <UserPrivilegeProvider>
          <TestComponent />
        </UserPrivilegeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('privilege-test').textContent).toBe('Loaded');
      });

      expect(screen.getByTestId('privilege-data').textContent).toBe(
        JSON.stringify(mockEmptyPrivileges),
      );
      expect(screen.getByTestId('privilege-error').textContent).toBe(
        'No error',
      );
    });

    it('should handle admin privileges', async () => {
      mockGetCurrentUserPrivileges.mockResolvedValueOnce(mockAdminPrivileges);

      render(
        <UserPrivilegeProvider>
          <TestComponent />
        </UserPrivilegeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('privilege-test').textContent).toBe('Loaded');
      });

      expect(screen.getByTestId('privilege-data').textContent).toBe(
        JSON.stringify(mockAdminPrivileges),
      );
      expect(screen.getByTestId('privilege-error').textContent).toBe(
        'No error',
      );
    });

    it('should handle limited privileges', async () => {
      mockGetCurrentUserPrivileges.mockResolvedValueOnce(mockLimitedPrivileges);

      render(
        <UserPrivilegeProvider>
          <TestComponent />
        </UserPrivilegeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('privilege-test').textContent).toBe('Loaded');
      });

      expect(screen.getByTestId('privilege-data').textContent).toBe(
        JSON.stringify(mockLimitedPrivileges),
      );
      expect(screen.getByTestId('privilege-error').textContent).toBe(
        'No error',
      );
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle malformed response error', async () => {
      const jsonError = new SyntaxError('Unexpected token in JSON');
      mockGetCurrentUserPrivileges.mockRejectedValueOnce(jsonError);
      mockGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'Unexpected token in JSON',
      });

      render(
        <UserPrivilegeProvider>
          <TestComponent />
        </UserPrivilegeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('privilege-test').textContent).toBe('Loaded');
      });
      expect(screen.getByTestId('privilege-data').textContent).toBe(
        'No privileges',
      );
      expect(screen.getByTestId('privilege-error').textContent).not.toBe(
        'No error',
      );
    });
  });
  describe('Provider Integration Tests', () => {
    it('should provide context to multiple child components', async () => {
      mockGetCurrentUserPrivileges.mockResolvedValueOnce(mockUserPrivileges);

      const ChildComponent1 = () => {
        const { userPrivileges } = useUserPrivilege();
        return (
          <div data-testid="child1">
            {userPrivileges ? userPrivileges.length : 0}
          </div>
        );
      };

      const ChildComponent2 = () => {
        const { isLoading } = useUserPrivilege();
        return (
          <div data-testid="child2">{isLoading ? 'Loading' : 'Ready'}</div>
        );
      };

      render(
        <UserPrivilegeProvider>
          <ChildComponent1 />
          <ChildComponent2 />
        </UserPrivilegeProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('child2').textContent).toBe('Ready');
      });

      expect(screen.getByTestId('child1').textContent).toBe('3');
      expect(screen.getByTestId('child2').textContent).toBe('Ready');
    });
  });
});
