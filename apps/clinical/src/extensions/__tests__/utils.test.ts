import { filterExtensionsByPrivileges, groupExtensionsByPoint } from '../utils';
import {
  mockExtensionNoPrivileges,
  mockExtensionWithDifferentPoint,
  mockExtensionWithMultiplePrivileges,
  mockExtensionWithPrivilege,
  mockUserPrivileges,
} from './__mocks__/extensionsMocks';

describe('groupExtensionsByPoint', () => {
  it('returns empty map for empty extensions', () => {
    expect(groupExtensionsByPoint([])).toEqual(new Map());
  });

  it('groups extensions under their extensionPointId', () => {
    const result = groupExtensionsByPoint([
      mockExtensionNoPrivileges,
      mockExtensionWithDifferentPoint,
    ]);
    expect(result.get('org.bahmni.clinical.v2.search')).toEqual([
      mockExtensionNoPrivileges,
    ]);
    expect(result.get('org.bahmni.clinical.v2.other')).toEqual([
      mockExtensionWithDifferentPoint,
    ]);
  });

  it('groups multiple extensions under the same extensionPointId', () => {
    const result = groupExtensionsByPoint([
      mockExtensionWithPrivilege,
      mockExtensionNoPrivileges,
    ]);
    expect(result.get('org.bahmni.clinical.v2.search')).toEqual([
      mockExtensionWithPrivilege,
      mockExtensionNoPrivileges,
    ]);
  });
});

describe('filterExtensionsByPrivileges', () => {
  it.each([
    {
      description: 'shows extension with no requiredPrivileges',
      extensions: [mockExtensionNoPrivileges],
      userPrivileges: null,
      expectedIds: ['ext-3'],
    },
    {
      description:
        'hides extension when user has none of the required privileges',
      extensions: [mockExtensionWithPrivilege],
      userPrivileges: [{ uuid: 'priv-2', name: 'app:other' }],
      expectedIds: [],
    },
    {
      description:
        'shows extension when user has any one of multiple required privileges',
      extensions: [mockExtensionWithMultiplePrivileges],
      userPrivileges: mockUserPrivileges,
      expectedIds: ['ext-2'],
    },
    {
      description:
        'hides extensions with requiredPrivileges when userPrivileges is null',
      extensions: [
        mockExtensionWithPrivilege,
        mockExtensionWithMultiplePrivileges,
      ],
      userPrivileges: null,
      expectedIds: [],
    },
    {
      description:
        'shows public and privileged extensions together when user has privileges',
      extensions: [mockExtensionWithPrivilege, mockExtensionNoPrivileges],
      userPrivileges: mockUserPrivileges,
      expectedIds: ['ext-1', 'ext-3'],
    },
  ])('$description', ({ extensions, userPrivileges, expectedIds }) => {
    const result = filterExtensionsByPrivileges(extensions, userPrivileges);
    expect(result.map((e) => e.id)).toEqual(expectedIds);
  });
});
