import { renderHook, act } from '@testing-library/react';
import {
  useAddressFields,
  type AddressLevel,
  type AddressHierarchyConfig,
  type AddressHierarchyItem,
} from '../useAddressFields';

describe('useAddressFields', () => {
  const mockAddressLevels: AddressLevel[] = [
    { addressField: 'country', name: 'Country', required: true },
    { addressField: 'stateProvince', name: 'State', required: true },
    { addressField: 'countyDistrict', name: 'District', required: false },
    { addressField: 'cityVillage', name: 'Village', required: false },
  ];

  describe('Display Order', () => {
    it('should display fields in top-down order when showAddressFieldsTopDown is true', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      expect(result.current.displayLevels.map((l) => l.addressField)).toEqual([
        'country',
        'stateProvince',
        'countyDistrict',
        'cityVillage',
      ]);
    });

    it('should display fields in bottom-up order when showAddressFieldsTopDown is false', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: false,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      expect(result.current.displayLevels.map((l) => l.addressField)).toEqual([
        'cityVillage',
        'countyDistrict',
        'stateProvince',
        'country',
      ]);
    });
  });

  describe('Level Chunks', () => {
    it('should chunk levels into rows of 2', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      expect(result.current.levelChunks).toHaveLength(2);
      expect(result.current.levelChunks[0]).toHaveLength(2);
      expect(result.current.levelChunks[1]).toHaveLength(2);
    });

    it('should handle odd number of levels', () => {
      const oddLevels = mockAddressLevels.slice(0, 3);
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() => useAddressFields(oddLevels, config));

      expect(result.current.levelChunks).toHaveLength(2);
      expect(result.current.levelChunks[0]).toHaveLength(2);
      expect(result.current.levelChunks[1]).toHaveLength(1);
    });
  });

  describe('Strict Entry Configuration', () => {
    it('should mark fields as strict entry from specified level upwards to parents', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
        strictAutocompleteFromLevel: 'countyDistrict',
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      const levels = result.current.levelsWithStrictEntry;

      // Cascade algorithm: configured level and all parent levels are strict
      // country is parent of countyDistrict, should be strict
      expect(
        levels.find((l) => l.addressField === 'country')?.isStrictEntry,
      ).toBe(true);
      // stateProvince is parent of countyDistrict, should be strict
      expect(
        levels.find((l) => l.addressField === 'stateProvince')?.isStrictEntry,
      ).toBe(true);
      // countyDistrict is the configured level, should be strict
      expect(
        levels.find((l) => l.addressField === 'countyDistrict')?.isStrictEntry,
      ).toBe(true);
      // cityVillage is child of countyDistrict, should NOT be strict
      expect(
        levels.find((l) => l.addressField === 'cityVillage')?.isStrictEntry,
      ).toBe(false);
    });

    it('should not mark any fields as strict when strictAutocompleteFromLevel is not set', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      const levels = result.current.levelsWithStrictEntry;
      levels.forEach((level) => {
        expect(level.isStrictEntry).toBeFalsy();
      });
    });
  });

  describe('Field Selection', () => {
    it('should update address when field is selected', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      const selectedItem: AddressHierarchyItem = {
        name: 'Maharashtra',
        uuid: 'state-uuid-1',
      };

      act(() => {
        result.current.handleFieldSelect('stateProvince', selectedItem);
      });

      expect(result.current.address.stateProvince).toBe('Maharashtra');
      expect(result.current.selectedMetadata.stateProvince).toEqual({
        uuid: 'state-uuid-1',
        userGeneratedId: undefined,
        value: 'Maharashtra',
      });
    });

    it('should auto-populate parent fields when selecting child field', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      const selectedItem: AddressHierarchyItem = {
        name: 'Mumbai',
        uuid: 'city-uuid-1',
        parent: {
          name: 'Mumbai District',
          uuid: 'district-uuid-1',
          parent: {
            name: 'Maharashtra',
            uuid: 'state-uuid-1',
            parent: {
              name: 'India',
              uuid: 'country-uuid-1',
            },
          },
        },
      };

      act(() => {
        result.current.handleFieldSelect('cityVillage', selectedItem);
      });

      expect(result.current.address.cityVillage).toBe('Mumbai');
      expect(result.current.address.countyDistrict).toBe('Mumbai District');
      expect(result.current.address.stateProvince).toBe('Maharashtra');
      expect(result.current.address.country).toBe('India');
    });
  });

  describe('Field Change (Manual Input)', () => {
    it('should update address when field value changes', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      act(() => {
        result.current.handleFieldChange('stateProvince', 'Maharashtra');
      });

      expect(result.current.address.stateProvince).toBe('Maharashtra');
    });

    it('should not clear child fields when parent field value changes via handleFieldChange', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const initialAddress = {
        country: 'India',
        stateProvince: 'Maharashtra',
        countyDistrict: 'Mumbai District',
        cityVillage: 'Mumbai',
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config, initialAddress),
      );

      act(() => {
        result.current.handleFieldChange('stateProvince', 'Karnataka');
      });

      expect(result.current.address.stateProvince).toBe('Karnataka');
      // Child fields should NOT be cleared by handleFieldChange
      expect(result.current.address.countyDistrict).toBe('Mumbai District');
      expect(result.current.address.cityVillage).toBe('Mumbai');
      expect(result.current.address.country).toBe('India');
    });

    it('should clear child fields when clearChildFields is called directly', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const initialAddress = {
        country: 'India',
        stateProvince: 'Maharashtra',
        countyDistrict: 'Mumbai District',
        cityVillage: 'Mumbai',
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config, initialAddress),
      );

      act(() => {
        result.current.clearChildFields('stateProvince');
      });

      expect(result.current.address.stateProvince).toBe('Maharashtra');
      expect(result.current.address.countyDistrict).toBeNull();
      expect(result.current.address.cityVillage).toBeNull();
      expect(result.current.address.country).toBe('India');
    });

    it('should clear metadata when manually typing', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      // First select from dropdown
      act(() => {
        result.current.handleFieldSelect('stateProvince', {
          name: 'Maharashtra',
          uuid: 'state-uuid-1',
        });
      });

      expect(result.current.selectedMetadata.stateProvince?.uuid).toBe(
        'state-uuid-1',
      );

      // Then manually type
      act(() => {
        result.current.handleFieldChange('stateProvince', 'Karnataka');
      });

      expect(result.current.selectedMetadata.stateProvince?.value).toBeNull();
    });
  });

  describe('Read-Only Fields', () => {
    it('should mark strict entry fields as read-only when parent is empty in top-down mode', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
        strictAutocompleteFromLevel: 'stateProvince', // Start strict from state
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      const stateLevel = result.current.levelsWithStrictEntry.find(
        (l) => l.addressField === 'stateProvince',
      )!;
      const districtLevel = result.current.levelsWithStrictEntry.find(
        (l) => l.addressField === 'countyDistrict',
      )!;

      // State is strict and parent (country) is empty, so read-only
      expect(result.current.isFieldReadOnly(stateLevel)).toBe(true);
      // District is NOT strict (child of configured level), so not read-only
      expect(result.current.isFieldReadOnly(districtLevel)).toBe(false);
    });

    it('should not mark child field as read-only when parent has value', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
        strictAutocompleteFromLevel: 'stateProvince',
      };

      const initialAddress = {
        country: 'India',
        stateProvince: 'Maharashtra',
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config, initialAddress),
      );

      const districtLevel = result.current.levelsWithStrictEntry.find(
        (l) => l.addressField === 'countyDistrict',
      )!;

      expect(result.current.isFieldReadOnly(districtLevel)).toBe(false);
    });

    it('should not mark fields as read-only in bottom-up mode', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: false,
        strictAutocompleteFromLevel: 'stateProvince',
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      const districtLevel = result.current.levelsWithStrictEntry.find(
        (l) => l.addressField === 'countyDistrict',
      )!;

      expect(result.current.isFieldReadOnly(districtLevel)).toBe(false);
    });
  });

  describe('Parent UUID', () => {
    it('should return parent UUID in top-down mode', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      act(() => {
        result.current.handleFieldSelect('stateProvince', {
          name: 'Maharashtra',
          uuid: 'state-uuid-1',
        });
      });

      const parentUuid = result.current.getParentUuid('countyDistrict');
      expect(parentUuid).toBe('state-uuid-1');
    });

    it('should return undefined in bottom-up mode', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: false,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      act(() => {
        result.current.handleFieldSelect('stateProvince', {
          name: 'Maharashtra',
          uuid: 'state-uuid-1',
        });
      });

      const parentUuid = result.current.getParentUuid('countyDistrict');
      expect(parentUuid).toBeUndefined();
    });

    it('should return undefined when parent has no UUID', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      // Manually type (no UUID)
      act(() => {
        result.current.handleFieldChange('stateProvince', 'Maharashtra');
      });

      const parentUuid = result.current.getParentUuid('countyDistrict');
      expect(parentUuid).toBeUndefined();
    });
  });

  describe('Reset and Set Address', () => {
    it('should reset address to empty', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const initialAddress = {
        country: 'India',
        stateProvince: 'Maharashtra',
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config, initialAddress),
      );

      expect(result.current.address.country).toBe('India');

      act(() => {
        result.current.resetAddress();
      });

      expect(result.current.address).toEqual({});
      expect(result.current.selectedMetadata).toEqual({});
    });

    it('should set address programmatically', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      const newAddress = {
        country: 'India',
        stateProvince: 'Maharashtra',
        countyDistrict: 'Mumbai District',
        cityVillage: 'Mumbai',
      };

      act(() => {
        result.current.setAddressData(newAddress);
      });

      expect(result.current.address).toEqual(newAddress);
    });
  });

  describe('Initial Address', () => {
    it('should initialize with provided address data', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const initialAddress = {
        country: 'India',
        stateProvince: 'Maharashtra',
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config, initialAddress),
      );

      expect(result.current.address).toEqual(initialAddress);
    });

    it('should initialize with empty object when no initial address provided', () => {
      const config: AddressHierarchyConfig = {
        showAddressFieldsTopDown: true,
      };

      const { result } = renderHook(() =>
        useAddressFields(mockAddressLevels, config),
      );

      expect(result.current.address).toEqual({});
    });
  });
});
