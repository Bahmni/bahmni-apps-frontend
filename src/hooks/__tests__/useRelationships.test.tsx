import { renderHook, act, waitFor } from '@testing-library/react';
import { useRelationships } from '../useRelationships';
import { RegistrationService } from '../../services/registration/registrationService';
import { useNotification } from '../useNotification';
import type { Relationship, RelationshipType, CreateRelationshipRequest } from '../../types/registration/relationships';

// Mock dependencies
jest.mock('../../services/registration/registrationService');
jest.mock('../useNotification');

const mockRegistrationService = RegistrationService as jest.Mocked<typeof RegistrationService>;
const mockUseNotification = useNotification as jest.MockedFunction<typeof useNotification>;

describe('useRelationships', () => {
  const mockShowNotification = jest.fn();
  const mockPatientUuid = 'patient-123';

  const mockRelationshipTypes: RelationshipType[] = [
    {
      uuid: 'type-1',
      display: 'Parent/Child',
      description: 'Parent/Child relationship',
      aIsToB: 'Parent',
      bIsToA: 'Child',
      retired: false
    },
    {
      uuid: 'type-2',
      display: 'Spouse',
      description: 'Spouse relationship',
      aIsToB: 'Spouse',
      bIsToA: 'Spouse',
      retired: false
    }
  ];

  const mockRelationships: Relationship[] = [
    {
      uuid: 'rel-1',
      personA: {
        uuid: 'patient-123',
        display: 'John Doe',
        gender: 'M',
        age: 30,
        birthdate: '1993-01-01',
        birthdateEstimated: false,
        dead: false,
        names: [{
          uuid: 'name-1',
          display: 'John Doe',
          givenName: 'John',
          familyName: 'Doe',
          preferred: true,
          voided: false,
        }],
        addresses: [],
        attributes: [],
        voided: false,
        auditInfo: {
          creator: { uuid: 'user-1', display: 'Test User' },
          dateCreated: '2023-01-01T00:00:00.000Z',
        }
      },
      personB: {
        uuid: 'patient-456',
        display: 'Jane Doe',
        gender: 'F',
        age: 28,
        birthdate: '1995-01-01',
        birthdateEstimated: false,
        dead: false,
        names: [{
          uuid: 'name-2',
          display: 'Jane Doe',
          givenName: 'Jane',
          familyName: 'Doe',
          preferred: true,
          voided: false,
        }],
        addresses: [],
        attributes: [],
        voided: false,
        auditInfo: {
          creator: { uuid: 'user-1', display: 'Test User' },
          dateCreated: '2023-01-01T00:00:00.000Z',
        }
      },
      relationshipType: mockRelationshipTypes[0],
      startDate: '2020-01-01',
      endDate: null,
      auditInfo: {
        creator: { uuid: 'user-1', display: 'Test User' },
        dateCreated: '2023-01-01T00:00:00.000Z',
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotification.mockReturnValue({
      addNotification: mockShowNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      expect(result.current.relationships).toEqual([]);
      expect(result.current.relationshipTypes).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoadingTypes).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.typesError).toBeNull();
    });

    it('should auto-load data when patient UUID is provided', () => {
      const mockResponse = { results: mockRelationships, totalCount: 1, hasMore: false };
      mockRegistrationService.getPatientRelationships.mockResolvedValue(mockResponse);
      mockRegistrationService.getRelationshipTypes.mockResolvedValue(mockRelationshipTypes);

      renderHook(() => useRelationships(mockPatientUuid, { autoLoad: true }));

      expect(mockRegistrationService.getPatientRelationships).toHaveBeenCalledWith(mockPatientUuid);
      expect(mockRegistrationService.getRelationshipTypes).toHaveBeenCalled();
    });

    it('should not auto-load when autoLoad is false', () => {
      renderHook(() => useRelationships(mockPatientUuid, { autoLoad: false }));

      expect(mockRegistrationService.getPatientRelationships).not.toHaveBeenCalled();
      expect(mockRegistrationService.getRelationshipTypes).not.toHaveBeenCalled();
    });
  });

  describe('loadRelationships', () => {
    it('should load relationships successfully', async () => {
      mockRegistrationService.getPatientRelationships.mockResolvedValue(mockRelationships);

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      act(() => {
        result.current.loadRelationships();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.relationships).toEqual(mockRelationships);
      expect(result.current.error).toBeNull();
      expect(mockRegistrationService.getPatientRelationships).toHaveBeenCalledWith(mockPatientUuid);
    });

    it('should handle relationship loading errors', async () => {
      const errorMessage = 'Failed to load relationships';
      mockRegistrationService.getPatientRelationships.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      act(() => {
        result.current.loadRelationships();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.relationships).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to load patient relationships',
        description: errorMessage
      });
    });

    it('should handle network errors gracefully', async () => {
      mockRegistrationService.getPatientRelationships.mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      act(() => {
        result.current.loadRelationships();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network Error');
    });
  });

  describe('loadRelationshipTypes', () => {
    it('should load relationship types successfully', async () => {
      mockRegistrationService.getRelationshipTypes.mockResolvedValue(mockRelationshipTypes);

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      act(() => {
        result.current.loadRelationshipTypes();
      });

      expect(result.current.isLoadingTypes).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoadingTypes).toBe(false);
      });

      expect(result.current.relationshipTypes).toEqual(mockRelationshipTypes);
      expect(result.current.typesError).toBeNull();
      expect(mockRegistrationService.getRelationshipTypes).toHaveBeenCalled();
    });

    it('should handle relationship types loading errors', async () => {
      const errorMessage = 'Failed to load relationship types';
      mockRegistrationService.getRelationshipTypes.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      act(() => {
        result.current.loadRelationshipTypes();
      });

      await waitFor(() => {
        expect(result.current.isLoadingTypes).toBe(false);
      });

      expect(result.current.relationshipTypes).toEqual([]);
      expect(result.current.typesError).toBe(errorMessage);
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to load relationship types',
        description: errorMessage
      });
    });
  });

  describe('addRelationship', () => {
    const mockCreateRequest: CreateRelationshipRequest = {
      personA: mockPatientUuid,
      personB: 'patient-456',
      relationshipType: 'type-1',
      startDate: '2024-01-01'
    };

    it('should add relationship successfully', async () => {
      const newRelationship = mockRelationships[0];
      mockRegistrationService.createRelationship.mockResolvedValue(newRelationship);
      mockRegistrationService.getPatientRelationships.mockResolvedValue([newRelationship]);

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      let addResult: Relationship | null = null;
      await act(async () => {
        addResult = await result.current.addRelationship(mockCreateRequest);
      });

      expect(addResult).toEqual(newRelationship);
      expect(mockRegistrationService.createRelationship).toHaveBeenCalledWith(mockCreateRequest);
      expect(mockRegistrationService.getPatientRelationships).toHaveBeenCalledWith(mockPatientUuid);
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'success',
        message: 'Relationship added successfully'
      });
    });

    it('should handle add relationship errors', async () => {
      const errorMessage = 'Failed to create relationship';
      mockRegistrationService.createRelationship.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      let addResult: Relationship | null = null;
      await act(async () => {
        addResult = await result.current.addRelationship(mockCreateRequest);
      });

      expect(addResult).toBeNull();
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to add relationship',
        description: errorMessage
      });
    });

    it('should validate relationship data before creating', async () => {
      const invalidRequest = { ...mockCreateRequest, personB: '' };

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      let addResult: Relationship | null = null;
      await act(async () => {
        addResult = await result.current.addRelationship(invalidRequest);
      });

      expect(addResult).toBeNull();
      expect(mockRegistrationService.createRelationship).not.toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Invalid relationship data',
        description: 'Person B UUID is required'
      });
    });
  });

  describe('removeRelationship', () => {
    it('should remove relationship successfully', async () => {
      mockRegistrationService.deleteRelationship.mockResolvedValue();
      mockRegistrationService.getPatientRelationships.mockResolvedValue([]);

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      let removeResult = false;
      await act(async () => {
        removeResult = await result.current.removeRelationship('rel-1');
      });

      expect(removeResult).toBe(true);
      expect(mockRegistrationService.deleteRelationship).toHaveBeenCalledWith('rel-1');
      expect(mockRegistrationService.getPatientRelationships).toHaveBeenCalledWith(mockPatientUuid);
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'success',
        message: 'Relationship removed successfully'
      });
    });

    it('should handle remove relationship errors', async () => {
      const errorMessage = 'Failed to delete relationship';
      mockRegistrationService.deleteRelationship.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      let removeResult = false;
      await act(async () => {
        removeResult = await result.current.removeRelationship('rel-1');
      });

      expect(removeResult).toBe(false);
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to remove relationship',
        description: errorMessage
      });
    });

    it('should validate relationship UUID before removing', async () => {
      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      let removeResult = false;
      await act(async () => {
        removeResult = await result.current.removeRelationship('');
      });

      expect(removeResult).toBe(false);
      expect(mockRegistrationService.deleteRelationship).not.toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Invalid relationship UUID'
      });
    });
  });

  describe('Helper Methods', () => {
    it('should get relationship type by UUID', () => {
      mockRegistrationService.getRelationshipTypes.mockResolvedValue(mockRelationshipTypes);

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      act(() => {
        result.current.loadRelationshipTypes();
      });

      waitFor(() => {
        const relationshipType = result.current.getRelationshipTypeByUuid('type-1');
        expect(relationshipType).toEqual(mockRelationshipTypes[0]);
      });
    });

    it('should return undefined for invalid relationship type UUID', () => {
      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      const relationshipType = result.current.getRelationshipTypeByUuid('invalid-uuid');
      expect(relationshipType).toBeUndefined();
    });

    it('should filter active relationships', () => {
      const relationships = [
        { ...mockRelationships[0], endDate: null },
        { ...mockRelationships[0], uuid: 'rel-2', endDate: '2023-12-31' }
      ];

      mockRegistrationService.getPatientRelationships.mockResolvedValue(relationships);

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      act(() => {
        result.current.loadRelationships();
      });

      waitFor(() => {
        const activeRelationships = result.current.getActiveRelationships();
        expect(activeRelationships).toHaveLength(1);
        expect(activeRelationships[0].uuid).toBe('rel-1');
      });
    });

    it('should refresh all data', async () => {
      mockRegistrationService.getPatientRelationships.mockResolvedValue(mockRelationships);
      mockRegistrationService.getRelationshipTypes.mockResolvedValue(mockRelationshipTypes);

      const { result } = renderHook(() => useRelationships(mockPatientUuid));

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockRegistrationService.getPatientRelationships).toHaveBeenCalledWith(mockPatientUuid);
      expect(mockRegistrationService.getRelationshipTypes).toHaveBeenCalled();
    });
  });

  describe('Options and Configuration', () => {
    it('should respect includeInactive option', async () => {
      const { result } = renderHook(() =>
        useRelationships(mockPatientUuid, { includeInactive: true })
      );

      act(() => {
        result.current.loadRelationships();
      });

      expect(mockRegistrationService.getPatientRelationships).toHaveBeenCalledWith(
        mockPatientUuid,
        { includeInactive: true }
      );
    });

    it('should handle empty patient UUID gracefully', () => {
      const { result } = renderHook(() => useRelationships(''));

      expect(result.current.relationships).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });
});
