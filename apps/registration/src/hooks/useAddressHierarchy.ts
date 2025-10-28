import {
  getAddressHierarchyEntries,
  type AddressHierarchyEntry,
} from '@bahmni-frontend/bahmni-services';
import { useState, useCallback } from 'react';
import {
  INITIAL_ADDRESS_ERRORS,
  INITIAL_ADDRESS_SELECTED,
  type AddressErrors,
  type AddressSelectedFromDropdown,
} from '../models/address';
import { type PatientFormData } from '../models/patientForm';
import {
  ADDRESS_SEARCH_DEBOUNCE_MS,
  MIN_SEARCH_LENGTH,
} from '../utils/constants';

type AddressFieldType = 'district' | 'state' | 'pincode';

export const useAddressHierarchy = (
  updateForm: (field: keyof PatientFormData, value: string) => void,
) => {
  const [suggestions, setSuggestions] = useState<
    Record<AddressFieldType, AddressHierarchyEntry[]>
  >({
    district: [],
    state: [],
    pincode: [],
  });

  const [showSuggestions, setShowSuggestions] = useState<
    Record<AddressFieldType, boolean>
  >({
    district: false,
    state: false,
    pincode: false,
  });

  const [addressSelectedFromDropdown, setAddressSelectedFromDropdown] =
    useState<AddressSelectedFromDropdown>(INITIAL_ADDRESS_SELECTED);

  const [addressErrors, setAddressErrors] = useState<AddressErrors>(
    INITIAL_ADDRESS_ERRORS,
  );

  const debouncedSearchAddress = useCallback(
    (field: AddressFieldType, searchText: string, addressField: string) => {
      const timeoutId = setTimeout(async () => {
        if (!searchText || searchText.length < MIN_SEARCH_LENGTH) {
          setSuggestions((prev) => ({ ...prev, [field]: [] }));
          setShowSuggestions((prev) => ({ ...prev, [field]: false }));
          return;
        }

        try {
          const results = await getAddressHierarchyEntries(
            addressField,
            searchText,
          );
          setSuggestions((prev) => ({ ...prev, [field]: results }));
          setShowSuggestions((prev) => ({
            ...prev,
            [field]: results.length > 0,
          }));
        } catch {
          setSuggestions((prev) => ({ ...prev, [field]: [] }));
          setShowSuggestions((prev) => ({ ...prev, [field]: false }));
        }
      }, ADDRESS_SEARCH_DEBOUNCE_MS);

      return () => clearTimeout(timeoutId);
    },
    [],
  );

  const handleAddressInputChange = useCallback(
    (field: AddressFieldType, value: string, addressField: string) => {
      updateForm(field, value);
      debouncedSearchAddress(field, value, addressField);

      // Mark field as not selected from dropdown when manually typed
      setAddressSelectedFromDropdown((prev) => ({
        ...prev,
        [field]: false,
      }));

      // Clear error when field is empty
      if (!value) {
        setAddressErrors((prev) => ({
          ...prev,
          [field]: '',
        }));
      }
    },
    [updateForm, debouncedSearchAddress],
  );

  const handleSuggestionSelect = useCallback(
    (field: AddressFieldType, entry: AddressHierarchyEntry) => {
      updateForm(field, entry.name);
      const parents: AddressHierarchyEntry[] = [];
      let currentParent = entry.parent;
      while (currentParent) {
        parents.push(currentParent);
        currentParent = currentParent.parent;
      }

      // Mark field as selected from dropdown
      setAddressSelectedFromDropdown((prev) => ({
        ...prev,
        [field]: true,
      }));
      setAddressErrors((prev) => ({
        ...prev,
        [field]: '',
      }));

      // Auto-populate parent fields based on the selected field and hierarchy
      if (parents.length > 0) {
        if (field === 'pincode') {
          // When pincode is selected, first parent is district
          if (parents[0]) {
            updateForm('district', parents[0].name);
            setAddressSelectedFromDropdown((prev) => ({
              ...prev,
              district: true,
            }));
            setAddressErrors((prev) => ({
              ...prev,
              district: '',
            }));
          }
          // Second parent is state
          if (parents.length > 1 && parents[1]) {
            updateForm('state', parents[1].name);
            setAddressSelectedFromDropdown((prev) => ({
              ...prev,
              state: true,
            }));
            setAddressErrors((prev) => ({
              ...prev,
              state: '',
            }));
          }
        } else if (field === 'district') {
          // When district is selected, first parent is state
          if (parents[0]) {
            updateForm('state', parents[0].name);
            setAddressSelectedFromDropdown((prev) => ({
              ...prev,
              state: true,
            }));
            setAddressErrors((prev) => ({
              ...prev,
              state: '',
            }));
          }
        }
      }

      setShowSuggestions((prev) => ({ ...prev, [field]: false }));
      setSuggestions((prev) => ({ ...prev, [field]: [] }));
    },
    [updateForm],
  );

  const handleSuggestionBlur = useCallback((field: AddressFieldType) => {
    setTimeout(() => {
      setShowSuggestions((prev) => ({
        ...prev,
        [field]: false,
      }));
    }, 200);
  }, []);

  const handleSuggestionFocus = useCallback(
    (field: AddressFieldType) => {
      if (suggestions[field].length > 0) {
        setShowSuggestions((prev) => ({
          ...prev,
          [field]: true,
        }));
      }
    },
    [suggestions],
  );

  return {
    suggestions,
    showSuggestions,
    addressSelectedFromDropdown,
    addressErrors,
    setAddressErrors,
    handleAddressInputChange,
    handleSuggestionSelect,
    handleSuggestionBlur,
    handleSuggestionFocus,
  };
};
