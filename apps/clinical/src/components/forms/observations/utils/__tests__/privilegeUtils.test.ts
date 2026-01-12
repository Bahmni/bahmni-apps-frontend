import { ObservationForm, UserPrivilege } from '@bahmni/services';
import {
  canUserAccessForm,
  filterFormsByUserPrivileges,
} from '../privilegeUtils';

describe('privilegeUtils', () => {
  const mockUserPrivileges: UserPrivilege[] = [
    { uuid: 'privilege-uuid-1', name: 'app:clinical:observationForms' },
    { uuid: 'privilege-uuid-2', name: 'view:forms' },
  ];

  const mockFormWithPrivileges: ObservationForm = {
    id: 1,
    name: 'Test Form',
    uuid: 'test-uuid-1',
    privileges: [
      { privilegeName: 'app:clinical:observationForms', editable: true },
    ],
  };

  const mockFormWithoutPrivileges: ObservationForm = {
    id: 2,
    name: 'Public Form',
    uuid: 'test-uuid-2',
    privileges: [],
  };

  const mockFormWithUnauthorizedPrivileges: ObservationForm = {
    id: 3,
    name: 'Unauthorized Form',
    uuid: 'test-uuid-3',
    privileges: [{ privilegeName: 'admin:superuser', editable: true }],
  };

  const mockFormWithNonEditablePrivileges: ObservationForm = {
    id: 4,
    name: 'Non-Editable Form',
    uuid: 'test-uuid-4',
    privileges: [
      { privilegeName: 'app:clinical:observationForms', editable: false },
    ],
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
        id: 5,
        name: 'Multi Privilege Form',
        uuid: 'test-uuid-5',
        privileges: [
          { privilegeName: 'admin:superuser', editable: true },
          { privilegeName: 'view:forms', editable: true }, // User has this one
        ],
      };

      const result = canUserAccessForm(
        mockUserPrivileges,
        formWithMultiplePrivileges,
      );
      expect(result).toBe(true);
    });

    it('should return false when user has privilege but editable is false', () => {
      const result = canUserAccessForm(
        mockUserPrivileges,
        mockFormWithNonEditablePrivileges,
      );
      expect(result).toBe(false);
    });

    it('should return true when user has privilege and editable is true', () => {
      const result = canUserAccessForm(
        mockUserPrivileges,
        mockFormWithPrivileges,
      );
      expect(result).toBe(true);
    });

    it('should handle mixed editable privileges correctly', () => {
      const formWithMixedPrivileges: ObservationForm = {
        id: 6,
        name: 'Mixed Privilege Form',
        uuid: 'test-uuid-6',
        privileges: [
          { privilegeName: 'admin:superuser', editable: false }, // User doesn't have this
          { privilegeName: 'app:clinical:observationForms', editable: false }, // User has this but not editable
          { privilegeName: 'view:forms', editable: true }, // User has this and it's editable
        ],
      };

      const result = canUserAccessForm(
        mockUserPrivileges,
        formWithMixedPrivileges,
      );
      expect(result).toBe(true);
    });

    it('should return false when privilege name does not match and editable is false', () => {
      const formWithUnmatchedNonEditablePrivilege: ObservationForm = {
        id: 7,
        name: 'Unmatched Non-Editable Form',
        uuid: 'test-uuid-7',
        privileges: [{ privilegeName: 'admin:superuser', editable: false }], // User doesn't have this privilege AND it's not editable
      };

      const result = canUserAccessForm(
        mockUserPrivileges,
        formWithUnmatchedNonEditablePrivilege,
      );
      expect(result).toBe(false);
    });

    it('should return false when privilege name is matching but editable is false', () => {
      const formWithMatchingButNonEditablePrivilege: ObservationForm = {
        id: 8,
        name: 'Matching But Non-Editable Form',
        uuid: 'test-uuid-8',
        privileges: [{ privilegeName: 'view:forms', editable: false }], // User HAS this privilege but editable is false
      };

      const result = canUserAccessForm(
        mockUserPrivileges,
        formWithMatchingButNonEditablePrivilege,
      );
      expect(result).toBe(false);
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
});
