import React from 'react';
import { mockViewFormView } from '../../__tests__/__mocks__/configMocks';
import { mockTaskViewModelWithInput } from '../../__tests__/__mocks__/taskActionsMocks';
import { TaskViewType } from '../../constants';
import type { TaskView } from '../../models';
import { handleTaskView } from '../viewHandlers';

jest.mock('../ViewFormData', () => ({
  __esModule: true,
  default: jest.fn(({ open, task, view, patientUuid, onClose }) => (
    <div data-testid="view-form-data">
      <span data-testid="open">{String(open)}</span>
      <span data-testid="task-id">{task.id}</span>
      <span data-testid="view-type">{view.type}</span>
      <span data-testid="patient-uuid">{patientUuid}</span>
      <button onClick={onClose}>Close</button>
    </div>
  )),
}));

describe('handleTaskView', () => {
  const mockOnClose = jest.fn();
  const patientUuid = 'patient-uuid-123';

  it('should return ViewFormData component for VIEW_FORM type', () => {
    const result = handleTaskView(
      mockViewFormView,
      mockTaskViewModelWithInput,
      patientUuid,
      mockOnClose,
    );

    expect(result).not.toBeNull();
    expect(React.isValidElement(result)).toBe(true);
    expect((result as React.ReactElement).type).toBeDefined();
  });

  it('should return null for unknown view type', () => {
    const unknownView: TaskView = {
      ...mockViewFormView,
      type: 'unknownType' as TaskViewType,
    };

    const result = handleTaskView(
      unknownView,
      mockTaskViewModelWithInput,
      patientUuid,
      mockOnClose,
    );

    expect(result).toBeNull();
  });

  it('should pass correct props to ViewFormData', () => {
    const result = handleTaskView(
      mockViewFormView,
      mockTaskViewModelWithInput,
      patientUuid,
      mockOnClose,
    );

    expect(result).not.toBeNull();

    const element = result as React.ReactElement;
    expect(element.props).toMatchObject({
      open: true,
      task: mockTaskViewModelWithInput,
      view: mockViewFormView,
      patientUuid,
      onClose: mockOnClose,
    });
  });
});
