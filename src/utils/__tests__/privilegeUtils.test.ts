import { ObservationForm } from '../../types/observationForms';
import {
  canUserAccessForm,
  filterFormsByUserPrivileges,
  hasPrivilege,
  UserPrivilege,
} from '../privilegeUtils';

describe('privilegeUtils', () => {
  const mockUserPrivileges: UserPrivilege[] = [
    { name: 'app:clinical:observationForms' },
    { name: 'view:forms' },
  ];

  const mockFormWithPrivileges: ObservationForm = {
    id: 1,
    name: 'Test Form',
    version: '1.0',
    published: true,
    uuid: 'test-uuid-1',
    resources: {},
    nameTranslation: 'Test Form',
    privileges: [{ privilegeName: 'app:clinical:observationForms' }],
  };

  const mockFormWithoutPrivileges: ObservationForm = {
    id: 2,
    name: 'Public Form',
    version: '1.0',
    published: true,
    uuid: 'test-uuid-2',
    resources: {},
    nameTranslation: 'Public Form',
    privileges: [],
  };

  const mockFormWithUnauthorizedPrivileges: ObservationForm = {
    id: 3,
    name: 'Unauthorized Form',
    version: '1.0',
    published: true,
    uuid: 'test-uuid-3',
    resources: {},
    nameTranslation: 'Unauthorized Form',
    privileges: [{ privilegeName: 'admin:superuser' }],
  };

  describe('canUserAccessForm', () => {
    it('should return true when form has no privilege requirements', () => {
      const result = canUserAccessForm(
        mockUserPrivileges,
        mockFormWithoutPrivileges,
      );
      expect(result).toBe(true);
    });

    it('should return false when form has no privilege requirements', () => {
      const result = canUserAccessForm(
        mockUserPrivileges,
        mockFormWithUnauthorizedPrivileges,
      );
      expect(result).toBe(false);
    });

    it('should return false when user privileges is null', () => {
      const result = canUserAccessForm(null, mockFormWithPrivileges);
      expect(result).toBe(false);
    });

    it('should return false when user privileges is empty array', () => {
      const result = canUserAccessForm([], mockFormWithPrivileges);
      expect(result).toBe(false);
    });

    it('should handle multiple required privileges correctly', () => {
      const formWithMultiplePrivileges: ObservationForm = {
        id: 4,
        name: 'Multi Privilege Form',
        version: '1.0',
        published: true,
        uuid: 'test-uuid-4',
        resources: {},
        nameTranslation: 'Multi Privilege Form',
        privileges: [
          { privilegeName: 'admin:superuser' },
          { privilegeName: 'view:forms' }, // User has this one
        ],
      };

      const result = canUserAccessForm(
        mockUserPrivileges,
        formWithMultiplePrivileges,
      );
      expect(result).toBe(true);
    });
  });

  describe('filterFormsByUserPrivileges', () => {
    const mockForms: ObservationForm[] = [
      mockFormWithPrivileges,
      mockFormWithoutPrivileges,
    ];

    it('should filter forms based on user privileges', () => {
      const result = filterFormsByUserPrivileges(mockUserPrivileges, mockForms);

      expect(result).toHaveLength(2);
      expect(result).toContain(mockFormWithPrivileges);
      expect(result).toContain(mockFormWithoutPrivileges);
    });

    it('should return empty array when user privileges is null', () => {
      const result = filterFormsByUserPrivileges(null, mockForms);
      expect(result).toEqual([]);
    });

    it('should return empty array when user privileges is empty', () => {
      const result = filterFormsByUserPrivileges([], mockForms);
      expect(result).toEqual([]);
    });

    it('should maintain original form order in filtered results', () => {
      const orderedForms: ObservationForm[] = [
        mockFormWithoutPrivileges,
        mockFormWithPrivileges,
      ];

      const result = filterFormsByUserPrivileges(
        mockUserPrivileges,
        orderedForms,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(mockFormWithoutPrivileges);
      expect(result[1]).toBe(mockFormWithPrivileges);
    });
  });

  describe('hasPrivilege', () => {
    it('should return true when user has the specified privilege', () => {
      const result = hasPrivilege(
        mockUserPrivileges,
        'app:clinical:observationForms',
      );
      expect(result).toBe(true);
    });

    it('should return false when user does not have the specified privilege', () => {
      const result = hasPrivilege(mockUserPrivileges, 'admin:superuser');
      expect(result).toBe(false);
    });

    it('should return false when user privileges is null', () => {
      const result = hasPrivilege(null, 'app:clinical:observationForms');
      expect(result).toBe(false);
    });

    it('should return false when user privileges is empty array', () => {
      const result = hasPrivilege([], 'app:clinical:observationForms');
      expect(result).toBe(false);
    });

    it('should handle empty privilege name', () => {
      const result = hasPrivilege(mockUserPrivileges, '');
      expect(result).toBe(false);
    });

    it('should be case-sensitive', () => {
      const result = hasPrivilege(
        mockUserPrivileges,
        'APP:CLINICAL:OBSERVATIONFORMS',
      );
      expect(result).toBe(false);
    });
  });
});
