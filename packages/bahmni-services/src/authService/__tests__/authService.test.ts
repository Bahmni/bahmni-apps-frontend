import { del } from '../../api';
import { LOGIN_PATH } from '../../api/constants';
import {
  BAHMNI_USER_COOKIE_NAME,
  BAHMNI_USER_LOCATION_COOKIE,
  SESSION_URL,
} from '../../constants/app';
import { deleteCookie } from '../../utils';
import { logout } from '../authService';

jest.mock('../../api', () => ({
  del: jest.fn(),
}));

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  deleteCookie: jest.fn(),
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

      it('should invalidate the server-side session', async () => {
        await logout();
        expect(del).toHaveBeenCalledWith(SESSION_URL);
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
  });
});
