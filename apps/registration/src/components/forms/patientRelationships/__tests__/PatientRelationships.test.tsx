import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PatientRelationships } from '../PatientRelationships';
import type {
  PatientRelationshipsRef,
  RelationshipData,
} from '../PatientRelationships';

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
  searchPatientByNameOrId: jest.fn(() =>
    Promise.resolve({
      pageOfResults: [],
      totalCount: 0,
    }),
  ),
}));

describe('PatientRelationships', () => {
  let queryClient: QueryClient;
  let ref: React.RefObject<PatientRelationshipsRef | null>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    ref = React.createRef<PatientRelationshipsRef | null>();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Component Rendering', () => {
    it('should render all relationship sections and headers', async () => {
      render(<PatientRelationships ref={ref} />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByText('CREATE_PATIENT_SECTION_RELATIONSHIPS_INFO'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('REGISTRATION_RELATIONSHIP_TYPE'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('REGISTRATION_PATIENT_NAME_OR_ID'),
        ).toBeInTheDocument();
        expect(screen.getByText('REGISTRATION_TILL_DATE')).toBeInTheDocument();
        expect(
          screen.getByText('REGISTRATION_ADD_RELATIONSHIP'),
        ).toBeInTheDocument();
      });
    });

    it('should render with initial data when provided', async () => {
      const initialData: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: 'rel-type-1',
          patientId: 'GAN123456',
          tillDate: '31/12/2024',
        },
      ];

      render(<PatientRelationships ref={ref} initialData={initialData} />, {
        wrapper,
      });

      await waitFor(() => {
        expect(ref.current?.getData()).toEqual(initialData);
      });
    });

    it('should sync state when initialData changes', async () => {
      const { rerender } = render(<PatientRelationships ref={ref} />, {
        wrapper,
      });

      const updatedData: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: 'rel-type-1',
          patientId: 'GAN123456',
          patientUuid: 'uuid-123',
          patientName: 'Jane Doe',
          tillDate: '31/12/2024',
          isExisting: true,
        },
      ];

      rerender(<PatientRelationships ref={ref} initialData={updatedData} />);

      await waitFor(() => {
        expect(ref.current?.getData()).toEqual(updatedData);
      });
    });
  });

  describe('Relationship Management', () => {
    it('should add and remove relationship rows', async () => {
      const user = userEvent.setup();
      render(<PatientRelationships ref={ref} />, { wrapper });

      await waitFor(() => {
        expect(
          screen.getByText('REGISTRATION_ADD_RELATIONSHIP'),
        ).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', {
        name: 'REGISTRATION_ADD_RELATIONSHIP',
      });
      await user.click(addButton);
      await user.click(addButton);

      await waitFor(() => {
        expect(
          screen.getAllByRole('button', { name: 'REGISTRATION_REMOVE' }),
        ).toHaveLength(3);
      });

      const removeButtons = screen.getAllByRole('button', {
        name: 'REGISTRATION_REMOVE',
      });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(
          screen.getAllByRole('button', { name: 'REGISTRATION_REMOVE' }),
        ).toHaveLength(2);
      });
    });
  });

  describe('Ref Methods', () => {
    it('should return relationship data with correct structure and handle modifications', async () => {
      const user = userEvent.setup();
      const initialData: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: 'rel-type-1',
          patientId: 'GAN123456',
          tillDate: '31/12/2024',
        },
      ];

      render(<PatientRelationships ref={ref} initialData={initialData} />, {
        wrapper,
      });

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      const initialFetchedData = ref.current?.getData();
      expect(Array.isArray(initialFetchedData)).toBe(true);
      expect(initialFetchedData).toEqual(initialData);
      expect(initialFetchedData?.[0]).toHaveProperty('id');
      expect(initialFetchedData?.[0]).toHaveProperty('relationshipType');
      expect(initialFetchedData?.[0]).toHaveProperty('patientId');
      expect(initialFetchedData?.[0]).toHaveProperty('tillDate');

      const addButton = screen.getByRole('button', {
        name: 'REGISTRATION_ADD_RELATIONSHIP',
      });
      await user.click(addButton);

      await waitFor(() => {
        expect(ref.current?.getData()).toHaveLength(2);
      });
    });

    it('should clear all relationships', async () => {
      const initialData: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: 'rel-type-1',
          patientId: 'GAN123456',
          tillDate: '31/12/2024',
        },
      ];

      render(<PatientRelationships ref={ref} initialData={initialData} />, {
        wrapper,
      });

      await waitFor(() => {
        expect(ref.current?.getData()).toHaveLength(1);
      });

      act(() => {
        ref.current?.clearData();
      });

      await waitFor(() => {
        expect(ref.current?.getData()).toEqual([]);
      });
    });

    it('should validate empty relationships correctly', async () => {
      render(<PatientRelationships ref={ref} />, { wrapper });

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      let isValid;
      act(() => {
        isValid = ref.current?.validate();
      });

      // Empty relationships are allowed (they are skipped during validation)
      expect(isValid).toBe(true);
    });

    it('should validate incomplete relationships correctly', async () => {
      const initialData: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: 'rel-type-1',
          patientId: 'GAN123456',
          tillDate: '31/12/2024',
        },
      ];

      render(<PatientRelationships ref={ref} initialData={initialData} />, {
        wrapper,
      });

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      let isValid;
      act(() => {
        isValid = ref.current?.validate();
      });

      // Should fail validation (has relationshipType but no patientUuid)
      expect(isValid).toBe(false);
    });

    it('should validate complete relationships with UUID correctly', async () => {
      const initialData: RelationshipData[] = [
        {
          id: 'rel-1',
          relationshipType: 'rel-type-1',
          patientId: 'GAN123456',
          patientUuid: 'uuid-123',
          tillDate: '31/12/2024',
        },
      ];

      render(<PatientRelationships ref={ref} initialData={initialData} />, {
        wrapper,
      });

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
      });

      let isValid;
      act(() => {
        isValid = ref.current?.validate();
      });

      // Should pass validation (has both relationshipType and patientUuid)
      expect(isValid).toBe(true);
    });
  });
});
