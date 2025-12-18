import { renderHook, act } from '@testing-library/react';
import * as usePatientSearchModule from '../../../../hooks/usePatientSearch';
import * as useRelationshipValidationModule from '../../../../hooks/useRelationshipValidation';
import { usePatientRelationship } from '../usePatientRelationship';

jest.mock('../../../../hooks/usePatientSearch');
jest.mock('../../../../hooks/useRelationshipValidation');

const mockUsePatientSearch =
  usePatientSearchModule.usePatientSearch as jest.MockedFunction<
    typeof usePatientSearchModule.usePatientSearch
  >;
const mockUseRelationshipValidation =
  useRelationshipValidationModule.useRelationshipValidation as jest.MockedFunction<
    typeof useRelationshipValidationModule.useRelationshipValidation
  >;

describe('usePatientRelationship', () => {
  const mockGetPatientSuggestions = jest.fn();
  const mockHandleSearch = jest.fn();
  const mockClearSearch = jest.fn();
  const mockClearAllSearches = jest.fn();
  const mockSetSearchTerms = jest.fn();
  const mockValidateRelationships = jest.fn();
  const mockClearFieldError = jest.fn();
  const mockClearAllErrors = jest.fn();

  const mockRelationshipTypes = [
    { uuid: 'type-1', aIsToB: 'Parent', bIsToA: 'Child' },
    { uuid: 'type-2', aIsToB: 'Sibling', bIsToA: 'Sibling' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePatientSearch.mockReturnValue({
      searchTerms: {},
      getPatientSuggestions: mockGetPatientSuggestions,
      handleSearch: mockHandleSearch,
      clearSearch: mockClearSearch,
      clearAllSearches: mockClearAllSearches,
      setSearchTerms: mockSetSearchTerms,
    });

    mockUseRelationshipValidation.mockReturnValue({
      relationshipTypes: mockRelationshipTypes,
      validationErrors: {},
      validateRelationships: mockValidateRelationships,
      clearFieldError: mockClearFieldError,
      clearAllErrors: mockClearAllErrors,
    });

    mockGetPatientSuggestions.mockReturnValue([]);
    mockValidateRelationships.mockReturnValue(true);
  });

  describe('Initialization', () => {
    it('should initialize with default empty relationship when no initialData provided', () => {
      const { result } = renderHook(() => usePatientRelationship({}));

      expect(result.current.relationships).toHaveLength(1);
      expect(result.current.relationships[0]).toMatchObject({
        relationshipType: '',
        patientId: '',
        tillDate: '',
      });
      expect(result.current.relationships[0].id).toMatch(/^rel-\d+$/);
    });

    it('should initialize with provided initial data', () => {
      const initialData = [
        {
          id: 'rel-1',
          relationshipType: 'type-1',
          patientId: 'PAT001',
          patientUuid: 'uuid-1',
          patientName: 'John Doe',
          tillDate: '2024-12-31',
          isExisting: true,
        },
      ];

      const { result } = renderHook(() =>
        usePatientRelationship({ initialData }),
      );

      expect(result.current.relationships).toEqual(initialData);
    });

    it('should update relationships when initialData changes', () => {
      const initialData = [
        {
          id: 'rel-1',
          relationshipType: 'type-1',
          patientId: 'PAT001',
          tillDate: '',
        },
      ];

      const { result, rerender } = renderHook(
        ({ data }) => usePatientRelationship({ initialData: data }),
        { initialProps: { data: initialData } },
      );

      expect(result.current.relationships).toEqual(initialData);

      const newData = [
        {
          id: 'rel-2',
          relationshipType: 'type-2',
          patientId: 'PAT002',
          tillDate: '',
        },
      ];

      rerender({ data: newData });

      expect(result.current.relationships).toEqual(newData);
    });
  });

  describe('Relationship Management', () => {
    it('should add new relationship', () => {
      const { result } = renderHook(() => usePatientRelationship({}));

      act(() => {
        result.current.addRelationship();
      });

      expect(result.current.relationships).toHaveLength(2);
      expect(result.current.relationships[1]).toMatchObject({
        relationshipType: '',
        patientId: '',
        tillDate: '',
      });
    });

    it('should mark existing relationship as deleted instead of removing', () => {
      const initialData = [
        {
          id: 'rel-1',
          relationshipType: 'type-1',
          patientId: 'PAT001',
          tillDate: '',
          isExisting: true,
        },
      ];

      const { result } = renderHook(() =>
        usePatientRelationship({ initialData }),
      );

      act(() => {
        result.current.removeRelationship('rel-1');
      });

      expect(result.current.relationships).toHaveLength(1);
      expect(result.current.relationships[0].isDeleted).toBe(true);
    });

    it('should remove all deleted relationships', () => {
      const initialData = [
        {
          id: 'rel-1',
          relationshipType: 'type-1',
          patientId: 'PAT001',
          tillDate: '',
          isExisting: true,
        },
      ];

      const { result } = renderHook(() =>
        usePatientRelationship({ initialData }),
      );

      act(() => {
        result.current.removeRelationship('rel-1');
      });

      expect(result.current.relationships[0].isDeleted).toBe(true);

      act(() => {
        result.current.removeDeletedRelationships();
      });

      expect(result.current.relationships).toHaveLength(0);
    });
  });

  describe('Update Operations', () => {
    it('should update relationship field', () => {
      const { result } = renderHook(() => usePatientRelationship({}));
      const relationshipId = result.current.relationships[0].id;

      act(() => {
        result.current.updateRelationship(
          relationshipId,
          'relationshipType',
          'type-1',
        );
      });

      expect(result.current.relationships[0].relationshipType).toBe('type-1');
      expect(mockClearFieldError).toHaveBeenCalledWith(
        relationshipId,
        'relationshipType',
      );
    });

    it('should clear patient data when relationship type changes', () => {
      const initialData = [
        {
          id: 'rel-1',
          relationshipType: 'type-1',
          patientId: 'PAT001',
          patientUuid: 'uuid-1',
          patientName: 'John Doe',
          tillDate: '',
        },
      ];

      const { result } = renderHook(() =>
        usePatientRelationship({ initialData }),
      );

      act(() => {
        result.current.updateRelationship(
          'rel-1',
          'relationshipType',
          'type-2',
        );
      });

      expect(result.current.relationships[0]).toMatchObject({
        relationshipType: 'type-2',
        patientId: '',
        patientUuid: '',
        patientName: '',
      });
      expect(mockClearSearch).toHaveBeenCalledWith('rel-1');
      expect(mockSetSearchTerms).toHaveBeenCalled();
    });

    it('should update till date without affecting other fields', () => {
      const { result } = renderHook(() => usePatientRelationship({}));
      const relationshipId = result.current.relationships[0].id;

      act(() => {
        result.current.updateRelationship(
          relationshipId,
          'tillDate',
          '2024-12-31',
        );
      });

      expect(result.current.relationships[0].tillDate).toBe('2024-12-31');
    });
  });

  describe('Patient Search and Selection', () => {
    it('should handle patient search', () => {
      const { result } = renderHook(() => usePatientRelationship({}));
      const relationshipId = result.current.relationships[0].id;

      act(() => {
        result.current.handlePatientSearch(relationshipId, 'John');
      });

      expect(mockHandleSearch).toHaveBeenCalledWith(relationshipId, 'John');
      expect(result.current.relationships[0].patientId).toBe('');
    });

    it('should handle patient selection and update relationship', () => {
      const { result } = renderHook(() => usePatientRelationship({}));
      const relationshipId = result.current.relationships[0].id;

      const selectedPatient = {
        id: 'patient-uuid-1',
        identifier: 'PAT001',
        name: 'John Doe',
        text: 'John Doe (PAT001)',
      };

      act(() => {
        result.current.handlePatientSelect(relationshipId, selectedPatient);
      });

      expect(result.current.relationships[0]).toMatchObject({
        patientId: 'PAT001',
        patientUuid: 'patient-uuid-1',
        patientName: 'John Doe',
      });
      expect(mockSetSearchTerms).toHaveBeenCalled();
    });

    it('should not update relationship when patient selection is null', () => {
      const { result } = renderHook(() => usePatientRelationship({}));
      const relationshipId = result.current.relationships[0].id;
      const initialRelationship = { ...result.current.relationships[0] };

      act(() => {
        result.current.handlePatientSelect(relationshipId, null);
      });

      expect(result.current.relationships[0]).toEqual(initialRelationship);
    });
  });

  describe('Data Access and Validation', () => {
    it('should return current relationships via getData', () => {
      const initialData = [
        {
          id: 'rel-1',
          relationshipType: 'type-1',
          patientId: 'PAT001',
          tillDate: '',
        },
      ];

      const { result } = renderHook(() =>
        usePatientRelationship({ initialData }),
      );

      const data = result.current.getData();
      expect(data).toEqual(initialData);
    });

    it('should validate relationships', () => {
      const { result } = renderHook(() => usePatientRelationship({}));

      act(() => {
        result.current.validate();
      });

      expect(mockValidateRelationships).toHaveBeenCalledWith(
        result.current.relationships,
      );
    });

    it('should clear all data', () => {
      const initialData = [
        {
          id: 'rel-1',
          relationshipType: 'type-1',
          patientId: 'PAT001',
          tillDate: '',
        },
      ];

      const { result } = renderHook(() =>
        usePatientRelationship({ initialData }),
      );

      act(() => {
        result.current.clearData();
      });

      expect(result.current.relationships).toEqual([]);
      expect(mockClearAllSearches).toHaveBeenCalled();
      expect(mockClearAllErrors).toHaveBeenCalled();
    });
  });

  describe('Hook Properties', () => {
    it('should expose all required properties', () => {
      const { result } = renderHook(() => usePatientRelationship({}));

      expect(result.current).toHaveProperty('relationships');
      expect(result.current).toHaveProperty('relationshipTypes');
      expect(result.current).toHaveProperty('validationErrors');
      expect(result.current).toHaveProperty('getPatientSuggestions');
      expect(result.current).toHaveProperty('updateRelationship');
      expect(result.current).toHaveProperty('handlePatientSearch');
      expect(result.current).toHaveProperty('handlePatientSelect');
      expect(result.current).toHaveProperty('addRelationship');
      expect(result.current).toHaveProperty('removeRelationship');
      expect(result.current).toHaveProperty('getData');
      expect(result.current).toHaveProperty('validate');
      expect(result.current).toHaveProperty('clearData');
      expect(result.current).toHaveProperty('removeDeletedRelationships');
    });

    it('should provide relationship types and validation errors from hooks', () => {
      const { result } = renderHook(() => usePatientRelationship({}));

      expect(result.current.relationshipTypes).toEqual(mockRelationshipTypes);
      expect(result.current.validationErrors).toEqual({});
    });
  });
});
