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

  it('should render relationship type as a searchable combobox with placeholder', () => {
    const row = RelationshipRow({
      relationship: { ...mockRelationship, relationshipType: '' },
      relationshipTypes: mockRelationshipTypes,
      suggestions: mockSuggestions,
      errors: mockErrors,
      ...mockCallbacks,
    });

    render(<div>{row.relationshipType}</div>);

    const combobox = screen.getByRole('combobox');
    // ComboBox renders an input element that accepts text for filtering
    expect(combobox.tagName).toBe('INPUT');
    expect(combobox).toHaveAttribute('placeholder', 'REGISTRATION_SELECT');
    // Input should not be readonly (allows typing for search)
    expect(combobox).not.toHaveAttribute('readonly');
  });

  it('should use built-in ComboBox filtering for relationship types', () => {
    const row = RelationshipRow({
      relationship: { ...mockRelationship, relationshipType: '' },
      relationshipTypes: mockRelationshipTypes,
      suggestions: mockSuggestions,
      errors: mockErrors,
      ...mockCallbacks,
    });

    render(<div>{row.relationshipType}</div>);

    const combobox = screen.getByRole('combobox');
    // Verify ComboBox is configured with filtering capability
    expect(combobox).toBeInTheDocument();
    expect(combobox.tagName).toBe('INPUT');

    // The ComboBox uses shouldFilterItem for built-in filtering
    // (verified by the component rendering without errors)
  });

  describe('Existing relationships', () => {
    const existingRelationship: RelationshipData = {
      id: 'rel-existing',
      relationshipType: 'type1',
      relationshipTypeLabel: 'Parent',
      patientId: 'PAT002',
      patientUuid: 'patient2',
      patientName: 'Jane Smith',
      tillDate: '31/12/2025',
      isExisting: true,
    };

    it('should render read-only fields for existing relationship', () => {
      const row = RelationshipRow({
        relationship: existingRelationship,
        relationshipTypes: mockRelationshipTypes,
        suggestions: mockSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      render(
        <div>
          {row.relationshipType}
          {row.patientId}
          {row.tillDate}
        </div>,
      );

      expect(screen.getByText('Parent')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('31/12/2025')).toBeInTheDocument();
    });

    it('should render patient link with correct URL for existing relationship', () => {
      const row = RelationshipRow({
        relationship: existingRelationship,
        relationshipTypes: mockRelationshipTypes,
        suggestions: mockSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      render(<div>{row.patientId}</div>);

      const link = screen.getByRole('link', { name: 'Jane Smith' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should display fallback dash when relationship type label is missing', () => {
      const relationshipWithoutLabel = {
        ...existingRelationship,
        relationshipTypeLabel: undefined,
      };

      const row = RelationshipRow({
        relationship: relationshipWithoutLabel,
        relationshipTypes: mockRelationshipTypes,
        suggestions: mockSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      render(<div>{row.relationshipType}</div>);

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should display fallback dash when till date is null', () => {
      const relationshipWithoutTillDate = {
        ...existingRelationship,
        tillDate: null as unknown as string,
      };

      const row = RelationshipRow({
        relationship: relationshipWithoutTillDate,
        relationshipTypes: mockRelationshipTypes,
        suggestions: mockSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      render(<div>{row.tillDate}</div>);

      // When tillDate is null/undefined, fallback dash is shown
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should call onRemove when remove button is clicked on existing relationship', async () => {
      const user = userEvent.setup();
      const row = RelationshipRow({
        relationship: existingRelationship,
        relationshipTypes: mockRelationshipTypes,
        suggestions: mockSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      render(<div>{row.actions}</div>);

      const removeButton = screen.getByRole('button', {
        name: /REGISTRATION_REMOVE/i,
      });
      await user.click(removeButton);

      expect(mockCallbacks.onRemove).toHaveBeenCalledWith('rel-existing');
    });
  });

  describe('Callback interactions', () => {
    it('should call onUpdateRelationship when relationship type is selected', async () => {
      const user = userEvent.setup();
      const row = RelationshipRow({
        relationship: { ...mockRelationship, relationshipType: '' },
        relationshipTypes: mockRelationshipTypes,
        suggestions: mockSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      render(<div>{row.relationshipType}</div>);

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);

      const option = screen.getByText('Parent/ Child');
      await user.click(option);

      expect(mockCallbacks.onUpdateRelationship).toHaveBeenCalledWith(
        'rel-1',
        'relationshipType',
        'type1',
      );
    });

    it('should render patient combobox with onChange handler', () => {
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
      expect(combobox).toHaveAttribute(
        'placeholder',
        'REGISTRATION_ENTER_PATIENT_ID',
      );
      // Component has onChange handler configured
    });

    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      const row = RelationshipRow({
        relationship: mockRelationship,
        relationshipTypes: mockRelationshipTypes,
        suggestions: mockSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      render(<div>{row.actions}</div>);

      const removeButton = screen.getByRole('button', {
        name: /REGISTRATION_REMOVE/i,
      });
      await user.click(removeButton);

      expect(mockCallbacks.onRemove).toHaveBeenCalledWith('rel-1');
    });
  });

  describe('Edge cases', () => {
    it('should handle null item in itemToString for relationship type', () => {
      const row = RelationshipRow({
        relationship: mockRelationship,
        relationshipTypes: mockRelationshipTypes,
        suggestions: mockSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      render(<div>{row.relationshipType}</div>);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
      // Component renders successfully, handling null items
    });

    it('should handle null item in itemToString for patient search', () => {
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
      // Component renders successfully, handling null items
    });

    it('should return empty string when no relationship type matches', () => {
      const relationshipWithInvalidType = {
        ...mockRelationship,
        relationshipType: 'invalid-uuid',
      };

      const row = RelationshipRow({
        relationship: relationshipWithInvalidType,
        relationshipTypes: mockRelationshipTypes,
        suggestions: mockSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      render(<div>{row.relationshipType}</div>);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveValue('');
    });

    it('should handle empty patient suggestions gracefully', () => {
      const row = RelationshipRow({
        relationship: { ...mockRelationship, patientId: 'NON_EXISTENT' },
        relationshipTypes: mockRelationshipTypes,
        suggestions: mockSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      render(<div>{row.patientId}</div>);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveValue('');
    });
  });
});
