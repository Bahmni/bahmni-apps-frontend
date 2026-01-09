import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PatientSuggestion } from '../../../../hooks/usePatientSearch';
import type { RelationshipData } from '../PatientRelationships';
import { RelationshipRow } from '../RelationshipRow';

// Mock translations
jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('RelationshipRow', () => {
  const mockRelationshipTypes = [
    { uuid: 'type1', aIsToB: 'Parent', bIsToA: 'Child' },
    { uuid: 'type2', aIsToB: 'Sibling', bIsToA: 'Sibling' },
  ];

  const mockSuggestions: PatientSuggestion[] = [
    {
      id: 'patient1',
      identifier: 'PAT001',
      name: 'John Doe',
      text: 'PAT001 - John Doe',
    },
  ];

  const mockRelationship: RelationshipData = {
    id: 'rel-1',
    relationshipType: 'type1',
    patientId: 'PAT001',
    patientUuid: 'patient1',
    tillDate: '01/01/2025',
  };

  const mockErrors = {
    relationshipType: undefined,
    patientId: undefined,
  };

  const mockCallbacks = {
    onUpdateRelationship: jest.fn(),
    onPatientSearch: jest.fn(),
    onPatientSelect: jest.fn(),
    onRemove: jest.fn(),
    t: (key: string) => key,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return row object with all required fields', () => {
    const row = RelationshipRow({
      relationship: mockRelationship,
      relationshipTypes: mockRelationshipTypes,
      suggestions: mockSuggestions,
      errors: mockErrors,
      ...mockCallbacks,
    });

    expect(row).toHaveProperty('id');
    expect(row).toHaveProperty('relationshipType');
    expect(row).toHaveProperty('patientId');
    expect(row).toHaveProperty('tillDate');
    expect(row).toHaveProperty('actions');
    expect(row.id).toBe('rel-1');
  });

  it('should render relationship type dropdown', () => {
    const row = RelationshipRow({
      relationship: mockRelationship,
      relationshipTypes: mockRelationshipTypes,
      suggestions: mockSuggestions,
      errors: mockErrors,
      ...mockCallbacks,
    });

    render(<div>{row.relationshipType}</div>);

    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toBeInTheDocument();
  });

  it('should render patient search combobox', () => {
    const row = RelationshipRow({
      relationship: mockRelationship,
      relationshipTypes: mockRelationshipTypes,
      suggestions: mockSuggestions,
      errors: mockErrors,
      ...mockCallbacks,
    });

    render(<div>{row.patientId}</div>);

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
  });

  it('should render date picker', () => {
    const row = RelationshipRow({
      relationship: mockRelationship,
      relationshipTypes: mockRelationshipTypes,
      suggestions: mockSuggestions,
      errors: mockErrors,
      ...mockCallbacks,
    });

    render(<div>{row.tillDate}</div>);

    const datePicker = screen.getByPlaceholderText('REGISTRATION_SELECT_DATE');
    expect(datePicker).toBeInTheDocument();
    expect(datePicker).toHaveAttribute('id', 'till-date-rel-1');
  });

  it('should render remove button', () => {
    const row = RelationshipRow({
      relationship: mockRelationship,
      relationshipTypes: mockRelationshipTypes,
      suggestions: mockSuggestions,
      errors: mockErrors,
      ...mockCallbacks,
    });

    render(<div>{row.actions}</div>);

    const button = screen.getByRole('button', {
      name: /REGISTRATION_REMOVE/i,
    });
    expect(button).toBeInTheDocument();
  });

  it('should display validation errors when provided', () => {
    const errorsWithMessages = {
      relationshipType: 'Relationship type is required',
      patientId: 'Patient ID is required',
    };

    const row = RelationshipRow({
      relationship: mockRelationship,
      relationshipTypes: mockRelationshipTypes,
      suggestions: mockSuggestions,
      errors: errorsWithMessages,
      ...mockCallbacks,
    });

    render(
      <div>
        {row.relationshipType}
        {row.patientId}
      </div>,
    );

    expect(
      screen.getByText('Relationship type is required'),
    ).toBeInTheDocument();
    expect(screen.getByText('Patient ID is required')).toBeInTheDocument();
  });

  it('should handle empty relationship type', () => {
    const emptyRelationship: RelationshipData = {
      ...mockRelationship,
      relationshipType: '',
    };

    const row = RelationshipRow({
      relationship: emptyRelationship,
      relationshipTypes: mockRelationshipTypes,
      suggestions: mockSuggestions,
      errors: mockErrors,
      ...mockCallbacks,
    });

    render(<div>{row.relationshipType}</div>);

    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toBeInTheDocument();
  });

  it('should handle empty suggestions array', () => {
    const row = RelationshipRow({
      relationship: mockRelationship,
      relationshipTypes: mockRelationshipTypes,
      suggestions: [],
      errors: mockErrors,
      ...mockCallbacks,
    });

    render(<div>{row.patientId}</div>);

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
  });

  it('should use relationship type in combobox key for proper remounting', () => {
    const row = RelationshipRow({
      relationship: mockRelationship,
      relationshipTypes: mockRelationshipTypes,
      suggestions: mockSuggestions,
      errors: mockErrors,
      ...mockCallbacks,
    });

    expect(row.patientId).toBeDefined();
    expect(row.patientId.key).toContain('patient-search-rel-1');
    expect(row.patientId.key).toContain('type1');
  });

  it('should display both sides of relationship type in dropdown options', async () => {
    const user = userEvent.setup();
    const row = RelationshipRow({
      relationship: { ...mockRelationship, relationshipType: '' },
      relationshipTypes: mockRelationshipTypes,
      suggestions: mockSuggestions,
      errors: mockErrors,
      ...mockCallbacks,
    });

    render(<div>{row.relationshipType}</div>);

    const dropdown = screen.getByRole('combobox');
    await user.click(dropdown);

    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Parent/ Child')).toBeInTheDocument();
    expect(within(listbox).getByText('Sibling/ Sibling')).toBeInTheDocument();
  });
});
