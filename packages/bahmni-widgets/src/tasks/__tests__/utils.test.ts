import { extractFormNameFromTask, canUserEditForm } from '../utils';
import {
  mockTaskViewModelWithInput,
  mockTaskViewModelWithoutInput,
  mockTaskViewModelWithEmptyInput,
  mockTaskViewModelWithCaseInsensitiveForm,
  mockObservationForms,
  mockUserPrivileges,
  mockEmptyUserPrivileges,
} from './__mocks__/taskActionsMocks';

describe('extractFormNameFromTask', () => {
  it('should extract valueString from matching input', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithInput,
      'form-name-input-type',
    );
    expect(formName).toBe('Vitals');
  });

  it('should return null when input array is empty', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithEmptyInput,
      'form-name-input-type',
    );
    expect(formName).toBeNull();
  });

  it('should return null when no matching inputType found', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithInput,
      'non-existent-input-type',
    );
    expect(formName).toBeNull();
  });

  it('should return null when fhirTask.input is missing', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithoutInput,
      'form-name-input-type',
    );
    expect(formName).toBeNull();
  });

  it('should match inputType by code in type.coding[0]', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithInput,
      'other-input-type',
    );
    expect(formName).toBe('Some other value');
  });

  it('should handle case-insensitive form name extraction', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithCaseInsensitiveForm,
      'form-name-input-type',
    );
    expect(formName).toBe('VITALS');
  });
});

describe('canUserEditForm', () => {
  const vitalsForm = mockObservationForms[0];
  const labTestsForm = mockObservationForms[1];
  const generalForm = mockObservationForms[2];
  const restrictedForm = mockObservationForms[3];

  it('should return false when form is undefined', () => {
    const canEdit = canUserEditForm(mockUserPrivileges, undefined);
    expect(canEdit).toBe(false);
  });

  it('should return false when userPrivileges is null', () => {
    const canEdit = canUserEditForm(null, vitalsForm);
    expect(canEdit).toBe(false);
  });

  it('should return false when userPrivileges is empty array', () => {
    const canEdit = canUserEditForm(mockEmptyUserPrivileges, vitalsForm);
    expect(canEdit).toBe(false);
  });

  it('should return true when form has no privileges configured', () => {
    const canEdit = canUserEditForm(mockUserPrivileges, generalForm);
    expect(canEdit).toBe(true);
  });

  it('should return true when user has editable privilege', () => {
    const canEdit = canUserEditForm(mockUserPrivileges, vitalsForm);
    expect(canEdit).toBe(true);
  });

  it('should return false when user has non-editable privilege', () => {
    const viewOnlyPrivileges = [{ name: 'View Only Access', retired: false }];
    const canEdit = canUserEditForm(viewOnlyPrivileges, labTestsForm);
    expect(canEdit).toBe(false);
  });

  it('should return false when user lacks required privilege', () => {
    const canEdit = canUserEditForm(mockUserPrivileges, restrictedForm);
    expect(canEdit).toBe(false);
  });

  it('should return true when user has at least one editable privilege among multiple', () => {
    const canEdit = canUserEditForm(mockUserPrivileges, labTestsForm);
    expect(canEdit).toBe(true);
  });

  it.each([
    [null, vitalsForm, false],
    [mockEmptyUserPrivileges, vitalsForm, false],
    [mockUserPrivileges, undefined, false],
    [mockUserPrivileges, generalForm, true],
    [mockUserPrivileges, vitalsForm, true],
  ])(
    'should return correct value for userPrivileges=%p, form=%p',
    (privileges, form, expected) => {
      const canEdit = canUserEditForm(privileges, form);
      expect(canEdit).toBe(expected);
    },
  );
});
