import { get, post, USER_PINNED_PREFERENCE_URL } from '@bahmni/services';
import { PINNED_FORMS_ERROR_MESSAGES } from '../../constants/errors';
import { loadPinnedForms, savePinnedForms } from '../pinnedFormsService';

// Mock the bahmni-services module
jest.mock('@bahmni/services', () => ({
  get: jest.fn(),
  post: jest.fn(),
  USER_PINNED_PREFERENCE_URL: jest.fn(),
  getFormattedError: jest.fn((error) => ({ message: error.message })),
}));

describe('pinnedFormsService', () => {
  const mockUserUuid = 'user-uuid-123';

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
      (get as jest.Mock).mockResolvedValue(mockUserData);

      const result = await loadPinnedForms(mockUserUuid);

      expect(USER_PINNED_PREFERENCE_URL).toHaveBeenCalledWith('user-uuid-123');
      expect(get).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/user/user-uuid-123',
      );
      expect(result).toEqual(['Form A', 'Form B', 'Form C']);
    });

    it('should throw error when no userUuid provided', async () => {
      await expect(loadPinnedForms('')).rejects.toThrow(
        PINNED_FORMS_ERROR_MESSAGES.USER_NOT_FOUND,
      );

      expect(get).not.toHaveBeenCalled();
    });

    it('should return empty array when userProperties is undefined', async () => {
      const userDataWithoutProperties = {
        uuid: 'user-uuid-123',
        username: 'testuser',
      };

      (get as jest.Mock).mockResolvedValue(userDataWithoutProperties);

      const result = await loadPinnedForms(mockUserUuid);

      expect(result).toEqual([]);
    });

    it('should return empty array when pinnedObsTemplates is empty string', async () => {
      const userDataWithEmptyString = {
        ...mockUserData,
        userProperties: {
          pinnedObsTemplates: '',
        },
      };

      (get as jest.Mock).mockResolvedValue(userDataWithEmptyString);

      const result = await loadPinnedForms(mockUserUuid);

      expect(result).toEqual([]);
    });

    it('should throw error message when request fails', async () => {
      const error = new Error('API request failed');

      (get as jest.Mock).mockRejectedValue(error);

      await expect(loadPinnedForms(mockUserUuid)).rejects.toThrow(
        'API request failed',
      );
    });
  });

  describe('savePinnedForms', () => {
    it('should save pinned forms successfully', async () => {
      const formNames = ['New Form A', 'New Form B'];

      (post as jest.Mock).mockResolvedValue({});

      await savePinnedForms(mockUserUuid, formNames);

      // Should NOT call get - directly POST the new values
      expect(get).not.toHaveBeenCalled();
      expect(post).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/user/user-uuid-123',
        {
          userProperties: {
            pinnedObsTemplates: 'New Form A###New Form B',
          },
        },
      );
    });

    it('should throw error when no userUuid provided', async () => {
      await expect(savePinnedForms('', ['Form A'])).rejects.toThrow(
        PINNED_FORMS_ERROR_MESSAGES.USER_NOT_FOUND,
      );

      expect(get).not.toHaveBeenCalled();
      expect(post).not.toHaveBeenCalled();
    });

    it('should throw error message when request fails', async () => {
      const error = new Error('Save request failed');

      (post as jest.Mock).mockRejectedValue(error);

      await expect(savePinnedForms(mockUserUuid, ['Form A'])).rejects.toThrow(
        'Save request failed',
      );
    });

    it('should throw error when invalid data provided', async () => {
      await expect(savePinnedForms(mockUserUuid, null as any)).rejects.toThrow(
        PINNED_FORMS_ERROR_MESSAGES.INVALID_DATA,
      );
    });
  });
});
