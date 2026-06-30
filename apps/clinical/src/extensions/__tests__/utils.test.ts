import { filterByPrivileges } from '../utils';
import {
  mockExtensionNoPrivileges,
  mockExtensionWithMultiplePrivileges,
  mockExtensionWithPrivilege,
  mockUserPrivileges,
} from './__mocks__/extensionsMocks';

describe('filterByPrivileges', () => {
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
    const result = filterByPrivileges(extensions, userPrivileges);
    expect(result.map((e) => e.id)).toEqual(expectedIds);
  });
});
