import { getFormattedError } from '@utils/common';

import { get } from '../api';
import { getCurrentUserPrivileges } from '../privilegeService';

jest.mock('../api');
jest.mock('@utils/common');

const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

describe('privilegeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUserPrivileges', () => {
    it('should return user privileges when API call succeeds with multiple privileges', async () => {
      // Arrange
      const mockPrivileges = [
        { name: 'app:clinical:observationForms' },
        { name: 'view:forms' },
        { name: 'edit:forms' },
        { name: 'delete:forms' },
      ];

      mockedGet.mockResolvedValue(mockPrivileges);

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toEqual(mockPrivileges);
      expect(result).toHaveLength(4);
      expect(mockedGet).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/bahmnicore/whoami',
      );
      expect(mockedGet).toHaveBeenCalledTimes(1);
    });

    it('should return single privilege when user has only one privilege', async () => {
      // Arrange
      const mockPrivileges = [{ name: 'app:clinical:observationForms' }];

      mockedGet.mockResolvedValue(mockPrivileges);

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toEqual(mockPrivileges);
      expect(result).toHaveLength(1);
      expect(result![0].name).toBe('app:clinical:observationForms');
      expect(mockedGet).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/bahmnicore/whoami',
      );
    });

    it('should return privileges with complex privilege names', async () => {
      // Arrange
      const mockPrivileges = [
        { name: 'app:clinical:observationForms:view' },
        { name: 'app:clinical:observationForms:edit' },
        { name: 'app:clinical:observationForms:delete' },
        { name: 'app:clinical:consultationPad:access' },
      ];

      mockedGet.mockResolvedValue(mockPrivileges);

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toEqual(mockPrivileges);
      expect(result).toHaveLength(4);
      expect(
        result!.every((privilege) => privilege.name.includes('app:clinical')),
      ).toBe(true);
      expect(mockedGet).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/bahmnicore/whoami',
      );
    });

    it('should return empty array when user has no privileges', async () => {
      // Arrange
      mockedGet.mockResolvedValue([]);

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockedGet).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/bahmnicore/whoami',
      );
    });

    it('should handle server errors (500)', async () => {
      // Arrange
      const serverError = new Error('Internal server error');
      const formattedError = {
        title: 'Server Error',
        message: 'Internal server error occurred',
      };

      mockedGet.mockRejectedValue(serverError);
      mockedGetFormattedError.mockReturnValue(formattedError);

      // Act & Assert
      await expect(getCurrentUserPrivileges()).rejects.toThrow(
        'Internal server error occurred',
      );

      expect(mockedGetFormattedError).toHaveBeenCalledWith(serverError);
    });

    it('should handle undefined response', async () => {
      // Arrange
      mockedGet.mockResolvedValue(undefined);

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toBeUndefined();
      expect(mockedGet).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/bahmnicore/whoami',
      );
    });

    it('should handle response with empty privilege names', async () => {
      // Arrange
      const mockPrivileges = [
        { name: '' },
        { name: 'valid:privilege' },
        { name: '   ' },
      ];

      mockedGet.mockResolvedValue(mockPrivileges);

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toEqual(mockPrivileges);
      expect(result).toHaveLength(3);
      expect(mockedGet).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/bahmnicore/whoami',
      );
    });

    it('should handle response with null privilege objects', async () => {
      // Arrange
      const mockPrivileges = [null, { name: 'valid:privilege' }, undefined];

      mockedGet.mockResolvedValue(mockPrivileges);

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toEqual(mockPrivileges);
      expect(result).toHaveLength(3);
      expect(mockedGet).toHaveBeenCalledWith(
        '/openmrs/ws/rest/v1/bahmnicore/whoami',
      );
    });
  });
});
