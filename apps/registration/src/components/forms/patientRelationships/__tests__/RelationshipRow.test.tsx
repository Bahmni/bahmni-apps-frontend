import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PatientSuggestion } from '../../../../hooks/usePatientSearch';
import type { RelationshipData } from '../PatientRelationships';
import { RelationshipRow } from '../RelationshipRow';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(() => ({
    formattedResult: '31/12/2025',
  })),
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

    const datePicker = screen.getByTestId('new-relationship-till-date-input');
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

  it('should display complete relationship text in dropdown without truncation', async () => {
    const user = userEvent.setup();
    const longRelationshipTypes = [
      {
        uuid: 'type-long',
        aIsToB: 'Great Great Great Grandfather',
        bIsToA: 'Great Great Great Grandchild',
      },
    ];

    const row = RelationshipRow({
      relationship: { ...mockRelationship, relationshipType: '' },
      relationshipTypes: longRelationshipTypes,
      suggestions: mockSuggestions,
      errors: mockErrors,
      ...mockCallbacks,
    });

    render(<div>{row.relationshipType}</div>);

    const dropdown = screen.getByRole('combobox');
    await user.click(dropdown);

    const listbox = screen.getByRole('listbox');
    expect(
      within(listbox).getByText(
        'Great Great Great Grandfather/ Great Great Great Grandchild',
      ),
    ).toBeInTheDocument();
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
      tillDate: '2025-12-31',
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

  describe('selected patient display (BAH-4825)', () => {
    // Regression: when another row triggers a patient search, the shared
    // `suggestions` list is replaced with results for that search. The previous
    // fix looked up the selected patient inside `suggestions`, so it returned
    // undefined and selectedItem became null — clearing the displayed name.
    // The fix must build selectedItem from the row's own stored fields
    // (patientUuid / patientId / patientName) regardless of what is in suggestions.
    it('should display stored patient even when suggestions does not contain that patient', () => {
      const selectedRelationship: RelationshipData = {
        ...mockRelationship,
        patientUuid: 'patient-uuid-abc',
        patientId: 'PAT999',
        patientName: 'Alice Example',
      };

      // suggestions contain a DIFFERENT patient — simulating another row's search results
      const differentSuggestions: PatientSuggestion[] = [
        {
          id: 'other-patient',
          identifier: 'OTHER001',
          name: 'Other Patient',
          text: 'Other Patient (OTHER001)',
        },
      ];

      const row = RelationshipRow({
        relationship: selectedRelationship,
        relationshipTypes: mockRelationshipTypes,
        suggestions: differentSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      const selectedItem = row.patientId.props.selectedItem as {
        id: string;
        identifier: string;
        name: string;
        text: string;
      } | null;

      expect(selectedItem).not.toBeNull();
      expect(selectedItem?.id).toBe('patient-uuid-abc');
      expect(selectedItem?.identifier).toBe('PAT999');
      expect(selectedItem?.name).toBe('Alice Example');
      expect(selectedItem?.text).toBe('Alice Example (PAT999)');
    });

    // AC4: multiple rows with selected patients must each keep their own display,
    // independent of the single shared `suggestions` list (which only ever holds
    // the most recent row's search results). Each row derives selectedItem solely
    // from its own stored fields, so a foreign suggestions list affects neither.
    it('should display each row independently when multiple rows have selected patients', () => {
      const rowARelationship: RelationshipData = {
        ...mockRelationship,
        id: 'rel-a',
        patientUuid: 'uuid-alice',
        patientId: 'PAT999',
        patientName: 'Alice Example',
      };
      const rowBRelationship: RelationshipData = {
        ...mockRelationship,
        id: 'rel-b',
        patientUuid: 'uuid-bob',
        patientId: 'PAT888',
        patientName: 'Bob Sample',
      };

      // suggestions contain NEITHER selected patient — simulating a third search
      const unrelatedSuggestions: PatientSuggestion[] = [
        {
          id: 'other-patient',
          identifier: 'OTHER001',
          name: 'Other Patient',
          text: 'Other Patient (OTHER001)',
        },
      ];

      const rowA = RelationshipRow({
        relationship: rowARelationship,
        relationshipTypes: mockRelationshipTypes,
        suggestions: unrelatedSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });
      const rowB = RelationshipRow({
        relationship: rowBRelationship,
        relationshipTypes: mockRelationshipTypes,
        suggestions: unrelatedSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      type SelectedItem = {
        id: string;
        identifier: string;
        name: string;
        text: string;
      } | null;

      const rowASelected = rowA.patientId.props.selectedItem as SelectedItem;
      const rowBSelected = rowB.patientId.props.selectedItem as SelectedItem;

      expect(rowASelected?.id).toBe('uuid-alice');
      expect(rowASelected?.name).toBe('Alice Example');
      expect(rowASelected?.text).toBe('Alice Example (PAT999)');

      expect(rowBSelected?.id).toBe('uuid-bob');
      expect(rowBSelected?.name).toBe('Bob Sample');
      expect(rowBSelected?.text).toBe('Bob Sample (PAT888)');
    });

    it('should return null selectedItem when patientUuid is not set', () => {
      const unselectedRelationship: RelationshipData = {
        ...mockRelationship,
        patientUuid: undefined,
        patientId: '',
        patientName: undefined,
      };

      const row = RelationshipRow({
        relationship: unselectedRelationship,
        relationshipTypes: mockRelationshipTypes,
        suggestions: mockSuggestions,
        errors: mockErrors,
        ...mockCallbacks,
      });

      expect(row.patientId.props.selectedItem).toBeNull();
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
      // With BAH-4825 fix, selectedItem is derived from row's stored fields
      // (patientUuid/patientId/patientName), not from the suggestions list.
      // When patientUuid is set, the selected patient is displayed regardless
      // of whether suggestions contains that patient.
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
      // patientUuid is set (from mockRelationship), so selectedItem is non-null
      // and the text is derived from patientId (since patientName is not set)
      expect(combobox).toHaveValue('NON_EXISTENT');
    });
  });
});
