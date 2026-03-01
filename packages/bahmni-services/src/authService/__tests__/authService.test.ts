import { BAHMNI_HOME_PATH, BAHMNI_USER_COOKIE_NAME } from '../../constants/app';
import { BAHMNI_USER_LOCATION_COOKIE } from '../../userService/constants';
import { deleteCookie } from '../../utils';
import { logout } from '../authService';

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

    it('should redirect to Bahmni home page', () => {
      logout();
      expect(globalThis.location.href).toBe(BAHMNI_HOME_PATH);
    });

    it('should clear login cookie', () => {
      logout();
      expect(deleteCookie).toHaveBeenCalledWith(BAHMNI_USER_COOKIE_NAME);
      expect(deleteCookie).toHaveBeenCalledWith(BAHMNI_USER_LOCATION_COOKIE);
    });
  });
});
