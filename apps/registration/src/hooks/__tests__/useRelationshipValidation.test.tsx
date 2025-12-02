import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import type { RelationshipData } from '../../components/forms/patientRelationships/PatientRelationships';
import { useRelationshipValidation } from '../useRelationshipValidation';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  getRelationshipTypes: jest.fn(() =>
    Promise.resolve([
      { uuid: 'rel-type-1', aIsToB: 'Parent', bIsToA: 'Child' },
      { uuid: 'rel-type-2', aIsToB: 'Sibling', bIsToA: 'Sibling' },
    ]),
  ),
}));

describe('useRelationshipValidation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should initialize with empty validation errors', () => {
    const { result } = renderHook(() => useRelationshipValidation(), {
      wrapper,
    });

    expect(result.current.validationErrors).toEqual({});
  });

  describe('validateRelationships', () => {
    it('should validate required relationship type', () => {
      const { result } = renderHook(() => useRelationshipValidation(), {
        wrapper,
      });

      const relationships: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: '',
          patientId: 'P001',
          patientUuid: 'uuid-1',
          tillDate: '',
        },
      ];

      let isValid = false;
      act(() => {
        isValid = result.current.validateRelationships(relationships);
      });

      expect(isValid).toBe(false);
      expect(result.current.validationErrors['rel-1']).toEqual({
        relationshipType: 'REGISTRATION_RELATIONSHIP_TYPE_REQUIRED',
      });
    });

    it('should pass validation when relationship type is provided', () => {
      const { result } = renderHook(() => useRelationshipValidation(), {
        wrapper,
      });

      const relationships: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: 'parent-child-uuid',
          patientId: 'P001',
          patientUuid: 'uuid-1',
          tillDate: '',
        },
      ];

      let isValid = false;
      act(() => {
        isValid = result.current.validateRelationships(relationships);
      });

      expect(isValid).toBe(true);
      expect(result.current.validationErrors).toEqual({});
    });

    it('should detect duplicate relationships with same type and patientUuid', () => {
      const { result } = renderHook(() => useRelationshipValidation(), {
        wrapper,
      });

      const relationships: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: 'parent-child-uuid',
          patientId: 'P001',
          patientUuid: 'uuid-1',
          tillDate: '',
        },
        {
          id: 'rel-2',
          relationshipType: 'parent-child-uuid',
          patientId: 'P001',
          patientUuid: 'uuid-1',
          tillDate: '',
        },
      ];

      let isValid = false;
      act(() => {
        isValid = result.current.validateRelationships(relationships);
      });

      expect(isValid).toBe(false);
      expect(result.current.validationErrors['rel-2']).toEqual({
        patientId: 'REGISTRATION_RELATIONSHIP_ALREADY_EXISTS',
      });
    });

    it('should not flag duplicates if relationship types are different', () => {
      const { result } = renderHook(() => useRelationshipValidation(), {
        wrapper,
      });

      const relationships: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: 'parent-child-uuid',
          patientId: 'P001',
          patientUuid: 'uuid-1',
          tillDate: '',
        },
        {
          id: 'rel-2',
          relationshipType: 'sibling-uuid',
          patientId: 'P001',
          patientUuid: 'uuid-1',
          tillDate: '',
        },
      ];

      let isValid = false;
      act(() => {
        isValid = result.current.validateRelationships(relationships);
      });

      expect(isValid).toBe(true);
      expect(result.current.validationErrors).toEqual({});
    });

    it('should handle multiple validation errors', () => {
      const { result } = renderHook(() => useRelationshipValidation(), {
        wrapper,
      });

      const relationships: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: '',
          patientId: 'P001',
          tillDate: '',
        },
        {
          id: 'rel-2',
          relationshipType: 'parent-child-uuid',
          patientId: 'P001',
          patientUuid: 'uuid-1',
          tillDate: '',
        },
        {
          id: 'rel-3',
          relationshipType: 'parent-child-uuid',
          patientId: 'P001',
          patientUuid: 'uuid-1',
          tillDate: '',
        },
      ];

      let isValid = false;
      act(() => {
        isValid = result.current.validateRelationships(relationships);
      });

      expect(isValid).toBe(false);
      expect(result.current.validationErrors['rel-1']).toEqual({
        relationshipType: 'REGISTRATION_RELATIONSHIP_TYPE_REQUIRED',
      });
      expect(result.current.validationErrors['rel-3']).toEqual({
        patientId: 'REGISTRATION_RELATIONSHIP_ALREADY_EXISTS',
      });
    });
  });

  describe('clearFieldError', () => {
    it('should clear specific field error', () => {
      const { result } = renderHook(() => useRelationshipValidation(), {
        wrapper,
      });

      const relationships: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: '',
          patientId: 'P001',
          tillDate: '',
        },
      ];

      act(() => {
        result.current.validateRelationships(relationships);
      });

      expect(result.current.validationErrors['rel-1']).toBeDefined();

      act(() => {
        result.current.clearFieldError('rel-1', 'relationshipType');
      });

      expect(
        result.current.validationErrors['rel-1']?.relationshipType,
      ).toBeUndefined();
    });
  });

  describe('clearAllErrors', () => {
    it('should clear all validation errors', () => {
      const { result } = renderHook(() => useRelationshipValidation(), {
        wrapper,
      });

      const relationships: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: '',
          patientId: 'P001',
          tillDate: '',
        },
        {
          id: 'rel-2',
          relationshipType: '',
          patientId: 'P002',
          tillDate: '',
        },
      ];

      act(() => {
        result.current.validateRelationships(relationships);
      });

      expect(
        Object.keys(result.current.validationErrors).length,
      ).toBeGreaterThan(0);

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.validationErrors).toEqual({});
    });
  });
});
