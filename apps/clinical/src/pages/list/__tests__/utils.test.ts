import { groupExtensionsByPoint } from '../utils';
import {
  mockOtherExtension,
  mockPrivilegedSearchExtension,
  mockSearchExtension,
} from './__mocks__/utilsMocks';

describe('groupExtensionsByPoint', () => {
  it('returns empty map for empty extensions', () => {
    expect(groupExtensionsByPoint([])).toEqual(new Map());
  });

  it('groups extensions under their extensionPointId', () => {
    const result = groupExtensionsByPoint([
      mockSearchExtension,
      mockOtherExtension,
    ]);
    expect(result.get('org.bahmni.clinical.v2.search')).toEqual([
      mockSearchExtension,
    ]);
    expect(result.get('org.bahmni.clinical.v2.other')).toEqual([
      mockOtherExtension,
    ]);
  });

  it('groups multiple extensions under the same extensionPointId', () => {
    const result = groupExtensionsByPoint([
      mockSearchExtension,
      mockPrivilegedSearchExtension,
    ]);
    expect(result.get('org.bahmni.clinical.v2.search')).toHaveLength(2);
  });
});
