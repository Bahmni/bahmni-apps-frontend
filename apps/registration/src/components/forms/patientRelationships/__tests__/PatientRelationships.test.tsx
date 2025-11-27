import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
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
          screen.getByText('CREATE_PATIENT_SECTION_RELATIONSHIPS'),
        ).toBeInTheDocument();
        expect(screen.getByText('RELATIONSHIP_TYPE')).toBeInTheDocument();
        expect(screen.getByText('PATIENT_ID')).toBeInTheDocument();
        expect(screen.getByText('TILL_DATE')).toBeInTheDocument();
        expect(screen.getByText('ADD_RELATIONSHIP')).toBeInTheDocument();
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
  });

  describe('Relationship Management', () => {
    it('should add and remove relationship rows', async () => {
      const user = userEvent.setup();
      render(<PatientRelationships ref={ref} />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('ADD_RELATIONSHIP')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', {
        name: 'ADD_RELATIONSHIP',
      });
      await user.click(addButton);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: 'REMOVE' })).toHaveLength(
          3,
        );
      });

      const removeButtons = screen.getAllByRole('button', { name: 'REMOVE' });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: 'REMOVE' })).toHaveLength(
          2,
        );
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
        name: 'ADD_RELATIONSHIP',
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

      ref.current?.clearData();

      await waitFor(() => {
        expect(ref.current?.getData()).toEqual([]);
      });
    });
  });
});
