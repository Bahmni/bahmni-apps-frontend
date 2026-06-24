import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { PatientSuggestion } from '../../../../hooks/usePatientSearch';
import { PatientRelationships } from '../PatientRelationships';
import type { RelationshipData } from '../PatientRelationships';
import { RelationshipRow } from '../RelationshipRow';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Capture the (already filtered) suggestions handed to each row instead of
// driving the ComboBox menu, which is far more brittle.
jest.mock('../RelationshipRow', () => ({
  RelationshipRow: jest.fn(),
}));

// Inject controlled relationships + raw suggestions so the component's
// exclusion logic is exercised in isolation.
let mockHookReturn: ReturnType<
  typeof import('../usePatientRelationship').usePatientRelationship
>;
jest.mock('../usePatientRelationship', () => ({
  usePatientRelationship: () => mockHookReturn,
}));

const mockRelationshipRow = RelationshipRow as unknown as jest.Mock;

const ALL_SUGGESTIONS: PatientSuggestion[] = [
  { id: 'p1', identifier: 'PAT001', name: 'Alice', text: 'PAT001 - Alice' },
  { id: 'p2', identifier: 'PAT002', name: 'Bob', text: 'PAT002 - Bob' },
  { id: 'p3', identifier: 'PAT003', name: 'Carol', text: 'PAT003 - Carol' },
];

const buildHookReturn = (
  relationships: RelationshipData[],
): typeof mockHookReturn =>
  ({
    relationships,
    relationshipTypes: [],
    validationErrors: {},
    getPatientSuggestions: () => ALL_SUGGESTIONS,
    updateRelationship: jest.fn(),
    handlePatientSearch: jest.fn(),
    handlePatientSelect: jest.fn(),
    addRelationship: jest.fn(),
    removeRelationship: jest.fn(),
    getData: jest.fn(() => relationships),
    validate: jest.fn(() => true),
    clearData: jest.fn(),
    removeDeletedRelationships: jest.fn(),
  }) as unknown as typeof mockHookReturn;

const suggestionIdsFor = (rowId: string): string[] => {
  const call = mockRelationshipRow.mock.calls.find(
    ([props]) => props.relationship.id === rowId,
  );
  return (call?.[0].suggestions ?? []).map((s: PatientSuggestion) => s.id);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRelationshipRow.mockImplementation((props) => ({
    id: props.relationship.id,
    relationshipType: <span />,
    patientId: <span data-testid={`patient-${props.relationship.id}`} />,
    tillDate: <span />,
    actions: <span />,
  }));
});

describe('PatientRelationships suggestion filtering (BAH-4773)', () => {
  it('excludes a patient already selected in another row, while keeping it in its own row', () => {
    mockHookReturn = buildHookReturn([
      {
        id: 'rel-1',
        relationshipType: 'type1',
        patientId: 'PAT001',
        patientUuid: 'p1',
        tillDate: '',
      },
      {
        id: 'rel-2',
        relationshipType: 'type1',
        patientId: '',
        tillDate: '',
      },
    ]);

    render(<PatientRelationships />);

    // Row 1 keeps its own selection (p1) available.
    expect(suggestionIdsFor('rel-1')).toEqual(['p1', 'p2', 'p3']);
    // Row 2 no longer offers p1 because it is taken by row 1.
    expect(suggestionIdsFor('rel-2')).toEqual(['p2', 'p3']);
  });

  it('does not exclude patients from deleted rows', () => {
    mockHookReturn = buildHookReturn([
      {
        id: 'rel-1',
        relationshipType: 'type1',
        patientId: 'PAT001',
        patientUuid: 'p1',
        tillDate: '',
        isExisting: true,
        isDeleted: true,
      },
      {
        id: 'rel-2',
        relationshipType: 'type1',
        patientId: '',
        tillDate: '',
      },
    ]);

    render(<PatientRelationships />);

    // p1 belongs to a deleted row, so it is still selectable in row 2.
    expect(suggestionIdsFor('rel-2')).toEqual(['p1', 'p2', 'p3']);
  });

  it('excludes the patient being edited (self) from suggestions in edit mode', () => {
    mockHookReturn = buildHookReturn([
      {
        id: 'rel-1',
        relationshipType: 'type1',
        patientId: '',
        tillDate: '',
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/patient/p2/edit']}>
        <Routes>
          <Route
            path="/patient/:patientUuid/edit"
            element={<PatientRelationships />}
          />
        </Routes>
      </MemoryRouter>,
    );

    // The current patient (p2 from the route) cannot be their own relative.
    expect(suggestionIdsFor('rel-1')).toEqual(['p1', 'p3']);
  });

  it('keeps all suggestions in create mode when there is no current patient in the route', () => {
    mockHookReturn = buildHookReturn([
      {
        id: 'rel-1',
        relationshipType: 'type1',
        patientId: '',
        tillDate: '',
      },
    ]);

    render(<PatientRelationships />);

    expect(suggestionIdsFor('rel-1')).toEqual(['p1', 'p2', 'p3']);
  });
});
