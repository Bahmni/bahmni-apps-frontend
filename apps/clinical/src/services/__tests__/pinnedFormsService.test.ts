import {
  get,
  post,
  getCurrentUser,
  USER_PINNED_PREFERENCE_URL,
} from '@bahmni-frontend/bahmni-services';
import { PINNED_FORMS_ERROR_MESSAGES } from '../../constants/errors';
import { loadPinnedForms, savePinnedForms } from '../pinnedFormsService';

// Mock the bahmni-services module
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  get: jest.fn(),
  post: jest.fn(),
  getCurrentUser: jest.fn(),
  USER_PINNED_PREFERENCE_URL: jest.fn(),
  getFormattedError: jest.fn((error) => ({ message: error.message })),
}));

describe('pinnedFormsService', () => {
  const mockUser = {
    uuid: 'user-uuid-123',
    username: 'testuser',
  };

  const mockUserData = {
    uuid: 'user-uuid-123',
    username: 'testuser',
    userProperties: {
      pinnedObsTemplates: 'Form A###Form B###Form C',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (USER_PINNED_PREFERENCE_URL as jest.Mock).mockReturnValue(
      '/openmrs/ws/rest/v1/user/user-uuid-123',
    );
  });

  describe('loadPinnedForms', () => {
    it('should load and parse pinned forms successfully', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (get as jest.Mock).mockResolvedValue(mockUserData);

      const result = await loadPinnedForms();

      expect(getCurrentUser).toHaveBeenCalled();
      expect(USER_PINNED_PREFERENCE_URL).toHaveBeenCalledWith('user-uuid-123');
      expect(get).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/user/user-uuid-123',
      );
      expect(result).toEqual(['Form A', 'Form B', 'Form C']);
    });

    it('should throw error when no user found', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      await expect(loadPinnedForms()).rejects.toThrow(
        PINNED_FORMS_ERROR_MESSAGES.USER_NOT_FOUND,
      );

      expect(getCurrentUser).toHaveBeenCalled();
      expect(get).not.toHaveBeenCalled();
    });

    it('should return empty array when userProperties is undefined', async () => {
      const userDataWithoutProperties = {
        uuid: 'user-uuid-123',
        username: 'testuser',
      };

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (get as jest.Mock).mockResolvedValue(userDataWithoutProperties);

      const result = await loadPinnedForms();

      expect(result).toEqual([]);
    });

    it('should return empty array when pinnedObsTemplates is empty string', async () => {
      const userDataWithEmptyString = {
        ...mockUserData,
        userProperties: {
          pinnedObsTemplates: '',
        },
      };

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (get as jest.Mock).mockResolvedValue(userDataWithEmptyString);

      const result = await loadPinnedForms();

      expect(result).toEqual([]);
    });

    it('should throw error message when request fails', async () => {
      const error = new Error('API request failed');

      (getCurrentUser as jest.Mock).mockRejectedValue(error);

      await expect(loadPinnedForms()).rejects.toThrow('API request failed');
    });
  });

  describe('savePinnedForms', () => {
    it('should save pinned forms successfully', async () => {
      const formNames = ['New Form A', 'New Form B'];

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (get as jest.Mock).mockResolvedValue(mockUserData);
      (post as jest.Mock).mockResolvedValue({});

      await savePinnedForms(formNames);

      expect(getCurrentUser).toHaveBeenCalled();
      expect(get).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/user/user-uuid-123',
      );
      expect(post).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/user/user-uuid-123',
        {
          userProperties: {
            ...mockUserData.userProperties,
            pinnedObsTemplates: 'New Form A###New Form B',
          },
        },
      );
    });

    it('should throw error when no user found', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      await expect(savePinnedForms(['Form A'])).rejects.toThrow(
        PINNED_FORMS_ERROR_MESSAGES.USER_NOT_FOUND,
      );

      expect(getCurrentUser).toHaveBeenCalled();
      expect(get).not.toHaveBeenCalled();
      expect(post).not.toHaveBeenCalled();
    });

    it('should throw error message when request fails', async () => {
      const error = new Error('Save request failed');

      (getCurrentUser as jest.Mock).mockRejectedValue(error);

      await expect(savePinnedForms(['Form A'])).rejects.toThrow(
        'Save request failed',
      );
    });

    it('should throw error when invalid data provided', async () => {
      await expect(savePinnedForms(null as any)).rejects.toThrow(
        PINNED_FORMS_ERROR_MESSAGES.INVALID_DATA,
      );
    });
  });
});
