import { getCurrentUser } from '@bahmni/services';
import { renderHook, waitFor } from '@testing-library/react';
import { useCurrentUserId } from '../useCurrentUserId';

jest.mock('@bahmni/services', () => ({
  getCurrentUser: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.Mock;

describe('useCurrentUserId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in a loading state', () => {
    mockGetCurrentUser.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useCurrentUserId());

    expect(result.current.loading).toBe(true);
    expect(result.current.userId).toBeNull();
  });

  it('resolves the current user uuid', async () => {
    mockGetCurrentUser.mockResolvedValue({
      uuid: 'user-1',
      username: 'jdoe',
      display: 'J Doe',
    });

    const { result } = renderHook(() => useCurrentUserId());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userId).toBe('user-1');
  });

  it('resolves to null when there is no logged-in user', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const { result } = renderHook(() => useCurrentUserId());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userId).toBeNull();
  });

  it('resolves to null when fetching the current user fails', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useCurrentUserId());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userId).toBeNull();
  });
});
