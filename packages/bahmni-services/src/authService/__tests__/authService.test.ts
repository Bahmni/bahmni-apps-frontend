import { del, get } from '../../api';
import { LOGIN_PATH } from '../../api/constants';
import {
  BAHMNI_USER_COOKIE_NAME,
  BAHMNI_USER_LOCATION_COOKIE,
  SESSION_URL,
} from '../../constants/app';
import { deleteCookie, getCookieByName } from '../../utils';
import { logout, validateSessionUser } from '../authService';

jest.mock('../../api', () => ({
  del: jest.fn(),
  get: jest.fn(),
}));

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  deleteCookie: jest.fn(),
  getCookieByName: jest.fn(),
}));

describe('authService', () => {
  describe('logout', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      delete (globalThis as { location?: Location }).location;
      (globalThis as { location: Partial<Location> }).location = {
        href: '',
      } as Location;
    });

    describe('on success', () => {
      beforeEach(() => {
        (del as jest.Mock).mockResolvedValue({});
      });

      it('should invalidate the server-side session with a request timeout', async () => {
        await logout();
        expect(del).toHaveBeenCalledWith(SESSION_URL, {
          timeout: expect.any(Number),
        });
      });

      it('should clear login cookies', async () => {
        await logout();
        expect(deleteCookie).toHaveBeenCalledWith(BAHMNI_USER_COOKIE_NAME);
        expect(deleteCookie).toHaveBeenCalledWith(BAHMNI_USER_LOCATION_COOKIE);
      });

      it('should redirect to the login page', async () => {
        await logout();
        expect(globalThis.location.href).toBe(LOGIN_PATH);
      });
    });

    describe('when the backend session call fails', () => {
      beforeEach(() => {
        (del as jest.Mock).mockRejectedValue(new Error('Network error'));
      });

      it('should reject with the error', async () => {
        await expect(logout()).rejects.toThrow('Network error');
      });

      it('should not clear cookies', async () => {
        await expect(logout()).rejects.toThrow();
        expect(deleteCookie).not.toHaveBeenCalled();
      });

      it('should not redirect', async () => {
        await expect(logout()).rejects.toThrow();
        expect(globalThis.location.href).toBe('');
      });
    });

    describe('when the session has already expired (401)', () => {
      const unauthorizedError = {
        isAxiosError: true,
        response: { status: 401 },
      };

      beforeEach(() => {
        (del as jest.Mock).mockRejectedValue(unauthorizedError);
      });

      it('should reject with the error', async () => {
        await expect(logout()).rejects.toBe(unauthorizedError);
      });

      it('should still clear local cookies so no stale session lingers', async () => {
        await expect(logout()).rejects.toBe(unauthorizedError);
        expect(deleteCookie).toHaveBeenCalledWith(BAHMNI_USER_COOKIE_NAME);
        expect(deleteCookie).toHaveBeenCalledWith(BAHMNI_USER_LOCATION_COOKIE);
      });

      it('should not redirect itself, leaving that to the api client interceptor', async () => {
        await expect(logout()).rejects.toBe(unauthorizedError);
        expect(globalThis.location.href).toBe('');
      });
    });
  });

  describe('validateSessionUser', () => {
    const sessionOf = (username?: string) => ({
      user: username === undefined ? null : { username },
    });

    beforeEach(() => {
      jest.clearAllMocks();
      delete (globalThis as { location?: Location }).location;
      (globalThis as { location: Partial<Location> }).location = {
        href: '',
      } as Location;
      (del as jest.Mock).mockResolvedValue({});
    });

    describe('when the session user still matches the logged-in user', () => {
      it('should leave the session alone', async () => {
        (getCookieByName as jest.Mock).mockReturnValue('superman');
        (get as jest.Mock).mockResolvedValue(sessionOf('superman'));

        await validateSessionUser();

        expect(get).toHaveBeenCalledWith(SESSION_URL);
        expect(del).not.toHaveBeenCalled();
        expect(globalThis.location.href).toBe('');
      });

      it('should compare case insensitively', async () => {
        (getCookieByName as jest.Mock).mockReturnValue('Superman');
        (get as jest.Mock).mockResolvedValue(sessionOf('superman'));

        await validateSessionUser();

        expect(del).not.toHaveBeenCalled();
      });

      it('should match a cookie value that is url encoded and quote wrapped', async () => {
        (getCookieByName as jest.Mock).mockReturnValue('%22superman%22');
        (get as jest.Mock).mockResolvedValue(sessionOf('superman'));

        await validateSessionUser();

        expect(del).not.toHaveBeenCalled();
      });
    });

    describe('when the session belongs to a different user', () => {
      beforeEach(() => {
        (getCookieByName as jest.Mock).mockReturnValue('superman');
        (get as jest.Mock).mockResolvedValue(sessionOf('registration'));
      });

      it('should end the OpenMRS session', async () => {
        await validateSessionUser();
        expect(del).toHaveBeenCalledWith(SESSION_URL, {
          timeout: expect.any(Number),
        });
      });

      it('should clear the login cookies', async () => {
        await validateSessionUser();
        expect(deleteCookie).toHaveBeenCalledWith(BAHMNI_USER_COOKIE_NAME);
        expect(deleteCookie).toHaveBeenCalledWith(BAHMNI_USER_LOCATION_COOKIE);
      });

      it('should redirect to the login page', async () => {
        await validateSessionUser();
        expect(globalThis.location.href).toBe(LOGIN_PATH);
      });
    });

    // An unreadable session user means nobody is authenticated, not that
    // somebody else is. Logging out on it ejected users mid-startup, when the
    // session legitimately reads as unauthenticated.
    it('should not log out when the session carries no user at all', async () => {
      (getCookieByName as jest.Mock).mockReturnValue('superman');
      (get as jest.Mock).mockResolvedValue(sessionOf(undefined));

      await validateSessionUser();

      expect(del).not.toHaveBeenCalled();
      expect(globalThis.location.href).toBe('');
    });

    it('should not log out when the session user has an empty username', async () => {
      (getCookieByName as jest.Mock).mockReturnValue('superman');
      (get as jest.Mock).mockResolvedValue({ user: { username: '' } });

      await validateSessionUser();

      expect(del).not.toHaveBeenCalled();
      expect(globalThis.location.href).toBe('');
    });

    it('should not log out when the session user has no username key', async () => {
      (getCookieByName as jest.Mock).mockReturnValue('superman');
      (get as jest.Mock).mockResolvedValue({ user: {} });

      await validateSessionUser();

      expect(del).not.toHaveBeenCalled();
      expect(globalThis.location.href).toBe('');
    });

    it('should do nothing when no user is logged in through Bahmni', async () => {
      (getCookieByName as jest.Mock).mockReturnValue('');

      await validateSessionUser();

      expect(get).not.toHaveBeenCalled();
      expect(del).not.toHaveBeenCalled();
    });

    it('should not log anyone out when the session lookup fails', async () => {
      (getCookieByName as jest.Mock).mockReturnValue('superman');
      (get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(validateSessionUser()).resolves.toBeUndefined();

      expect(del).not.toHaveBeenCalled();
      expect(globalThis.location.href).toBe('');
    });

    it('should share a single check between concurrent callers', async () => {
      (getCookieByName as jest.Mock).mockReturnValue('superman');
      (get as jest.Mock).mockResolvedValue(sessionOf('superman'));

      await Promise.all([
        validateSessionUser(),
        validateSessionUser(),
        validateSessionUser(),
      ]);

      expect(get).toHaveBeenCalledTimes(1);
    });

    it('should check again on a later call once the previous one settled', async () => {
      (getCookieByName as jest.Mock).mockReturnValue('superman');
      (get as jest.Mock).mockResolvedValue(sessionOf('superman'));

      await validateSessionUser();
      await validateSessionUser();

      expect(get).toHaveBeenCalledTimes(2);
    });
  });
});
