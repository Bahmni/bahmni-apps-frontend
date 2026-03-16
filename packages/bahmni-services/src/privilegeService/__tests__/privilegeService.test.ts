import { get } from '../../api';
import { getFormattedError } from '../../errorHandling';

import { UserPrivilege } from '../models';
import {
  getCurrentUserPrivileges,
  hasPrivilege,
  hasRequiredPrivileges,
} from '../privilegeService';

jest.mock('../../api');
jest.mock('../../errorHandling');

const mockedGet = get as jest.MockedFunction<typeof get>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

describe('privilegeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUserPrivileges', () => {
    it('should return user privileges from session API', async () => {
      // Arrange
      const mockPrivileges = [
        { name: 'Add Encounters' },
        { name: 'Add Allergies' },
        { name: 'Add Orders' },
        { name: 'Add Medications' },
      ];

      mockedGet.mockResolvedValue({ user: { privileges: mockPrivileges } });

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toEqual(mockPrivileges);
      expect(result).toHaveLength(4);
      expect(mockedGet).toHaveBeenCalledWith('/openmrs/ws/rest/v1/session');
      expect(mockedGet).toHaveBeenCalledTimes(1);
    });

    it('should return single privilege when user has only one privilege', async () => {
      // Arrange
      const mockPrivileges = [{ name: 'Add Encounters' }];

      mockedGet.mockResolvedValue({ user: { privileges: mockPrivileges } });

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toEqual(mockPrivileges);
      expect(result).toHaveLength(1);
      expect(result![0].name).toBe('Add Encounters');
      expect(mockedGet).toHaveBeenCalledWith('/openmrs/ws/rest/v1/session');
    });

    it('should return privileges with complex privilege names', async () => {
      // Arrange
      const mockPrivileges = [
        { name: 'app:clinical:observationForms:view' },
        { name: 'app:clinical:observationForms:edit' },
        { name: 'app:clinical:observationForms:delete' },
        { name: 'app:clinical:consultationPad:access' },
      ];

      mockedGet.mockResolvedValue({ user: { privileges: mockPrivileges } });

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toEqual(mockPrivileges);
      expect(result).toHaveLength(4);
      expect(
        result!.every((privilege) => privilege.name.includes('app:clinical')),
      ).toBe(true);
      expect(mockedGet).toHaveBeenCalledWith('/openmrs/ws/rest/v1/session');
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

    it('should handle response with no privileges array', async () => {
      // Arrange
      mockedGet.mockResolvedValue({ user: { privileges: [] } });

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toEqual([]);
      expect(mockedGet).toHaveBeenCalledWith('/openmrs/ws/rest/v1/session');
    });

    it('should handle response with null privileges', async () => {
      // Arrange
      mockedGet.mockResolvedValue({ user: { privileges: null } });

      // Act
      const result = await getCurrentUserPrivileges();

      // Assert
      expect(result).toBeNull();
      expect(mockedGet).toHaveBeenCalledWith('/openmrs/ws/rest/v1/session');
    });
  });

  describe('hasPrivilege', () => {
    const mockUserPrivileges: UserPrivilege[] = [
      { uuid: '1', name: 'app:clinical:observationForms' },
      { uuid: '2', name: 'view:forms' },
      { uuid: '3', name: 'edit:forms' },
      { uuid: '4', name: 'delete:forms' },
    ];

    it('should return true when user has the specified privilege', () => {
      // Act
      const result = hasPrivilege(
        mockUserPrivileges,
        'app:clinical:observationForms',
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when user has privilege with exact match', () => {
      // Act
      const result = hasPrivilege(mockUserPrivileges, 'view:forms');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not have the specified privilege', () => {
      // Act
      const result = hasPrivilege(mockUserPrivileges, 'nonexistent:privilege');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when user privileges is null or empty', () => {
      expect(hasPrivilege(null, 'app:clinical:observationForms')).toBe(false);
      expect(hasPrivilege([], 'app:clinical:observationForms')).toBe(false);
    });

    it('should return true when privilege is passed as array and any matches', () => {
      const result = hasPrivilege(mockUserPrivileges, [
        'nonexistent:privilege',
        'view:forms',
      ]);

      expect(result).toBe(true);
    });

    it('should return false when privilege is passed as array and none match', () => {
      const result = hasPrivilege(mockUserPrivileges, [
        'nonexistent:privilege',
        'another:missing',
      ]);

      expect(result).toBe(false);
    });

    it('should return false when privilege name is empty string', () => {
      // Act
      const result = hasPrivilege(mockUserPrivileges, '');

      // Assert
      expect(result).toBe(false);
    });
    it('should handle privileges with special characters', () => {
      // Arrange
      const specialPrivileges: UserPrivilege[] = [
        { uuid: '1', name: 'app:clinical-forms_view.restricted' },
        { uuid: '2', name: 'app:clinical@forms#edit' },
      ];

      // Act
      const result1 = hasPrivilege(
        specialPrivileges,
        'app:clinical-forms_view.restricted',
      );
      const result2 = hasPrivilege(
        specialPrivileges,
        'app:clinical@forms#edit',
      );

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('hasRequiredPrivileges', () => {
    const mockUserPrivileges: UserPrivilege[] = [
      { uuid: '1', name: 'Add Allergies' },
      { uuid: '2', name: 'Add Orders' },
      { uuid: '3', name: 'Edit Encounters' },
    ];

    it('should return true when user has all required privileges', () => {
      const result = hasRequiredPrivileges(mockUserPrivileges, [
        'Add Allergies',
        'Add Orders',
      ]);

      expect(result).toBe(true);
    });

    it('should return true when user has a single required privilege', () => {
      const result = hasRequiredPrivileges(mockUserPrivileges, [
        'Add Allergies',
      ]);

      expect(result).toBe(true);
    });

    it('should return false when user lacks one of the required privileges', () => {
      const result = hasRequiredPrivileges(mockUserPrivileges, [
        'Add Allergies',
        'Delete Encounters',
      ]);

      expect(result).toBe(false);
    });

    it('should return false when user lacks all required privileges', () => {
      const result = hasRequiredPrivileges(mockUserPrivileges, [
        'Delete Forms',
        'View Reports',
      ]);

      expect(result).toBe(false);
    });

    it('should return true when no required privileges are specified', () => {
      expect(hasRequiredPrivileges(mockUserPrivileges, undefined)).toBe(true);
      expect(hasRequiredPrivileges(mockUserPrivileges, [])).toBe(true);
    });

    it('should return false when user privileges is null', () => {
      const result = hasRequiredPrivileges(null, ['Add Allergies']);

      expect(result).toBe(false);
    });

    it('should return false when user privileges is undefined', () => {
      const result = hasRequiredPrivileges(undefined, ['Add Allergies']);

      expect(result).toBe(false);
    });

    it('should return true when both user privileges and required privileges are empty', () => {
      const result = hasRequiredPrivileges([], undefined);

      expect(result).toBe(true);
    });

    it('should handle privileges with special characters', () => {
      const specialPrivileges: UserPrivilege[] = [
        { uuid: '1', name: 'app:clinical-forms_view.restricted' },
        { uuid: '2', name: 'app:clinical@forms#edit' },
      ];

      const result = hasRequiredPrivileges(specialPrivileges, [
        'app:clinical-forms_view.restricted',
        'app:clinical@forms#edit',
      ]);

      expect(result).toBe(true);
    });

    it('should distinguish between hasPrivilege (ANY) and hasRequiredPrivileges (ALL)', () => {
      const userPrivileges: UserPrivilege[] = [
        { uuid: '1', name: 'Edit Forms' },
      ];

      // hasPrivilege uses some() - returns true if ANY match
      const anyResult = hasPrivilege(userPrivileges, [
        'Edit Forms',
        'Delete Forms',
      ]);
      expect(anyResult).toBe(true);

      // hasRequiredPrivileges uses every() - returns true only if ALL match
      const allResult = hasRequiredPrivileges(userPrivileges, [
        'Edit Forms',
        'Delete Forms',
      ]);
      expect(allResult).toBe(false);
    });
  });
});
