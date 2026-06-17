import { render, screen } from '@testing-library/react';
import { FormFillingTaskHandler } from '../handlers/FormFillingTaskHandler';
import {
  mockTaskViewModels,
  emptyTaskList,
  mockError,
} from './__mocks__/formFillingTaskHandlerMocks';

describe('FormFillingTaskHandler', () => {
  it('should render DataTable with correct props', () => {
    render(<FormFillingTaskHandler tasks={mockTaskViewModels} />);

    const table = screen.getByTestId('form-filling-tasks-table');
    expect(table).toBeInTheDocument();
  });

  it('should render all column headers', () => {
    render(<FormFillingTaskHandler tasks={mockTaskViewModels} />);

    expect(screen.getByText('TASK_NAME')).toBeInTheDocument();
    expect(screen.getByText('STATUS')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED_BY')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED_ON')).toBeInTheDocument();
  });

  it('should render all tasks with correct data', () => {
    render(<FormFillingTaskHandler tasks={mockTaskViewModels} />);

    expect(screen.getByText('Vitals Form')).toBeInTheDocument();
    expect(screen.getByText('Physical Exam')).toBeInTheDocument();
    expect(screen.getByText('Lab Review')).toBeInTheDocument();
  });

  it('should display status badges with correct test ids', () => {
    render(<FormFillingTaskHandler tasks={mockTaskViewModels} />);

    expect(screen.getByTestId('task-status-task-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-status-task-2')).toBeInTheDocument();
    expect(screen.getByTestId('task-status-task-3')).toBeInTheDocument();
  });

  it('should display completed by information and dash for missing values', () => {
    render(<FormFillingTaskHandler tasks={mockTaskViewModels} />);

    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('should format completed on date correctly', () => {
    render(<FormFillingTaskHandler tasks={mockTaskViewModels} />);

    const formattedDate = new Date('2025-03-25T11:00:00Z').toLocaleString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it('should render DataTable with empty tasks', () => {
    render(<FormFillingTaskHandler tasks={emptyTaskList} />);

    const table = screen.getByTestId('form-filling-tasks-table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveTextContent('NO_TASKS_FOUND');
  });

  it('should render skeleton when loading', () => {
    render(<FormFillingTaskHandler tasks={[]} isLoading />);

    const skeleton = screen.getByTestId('form-filling-tasks-table-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render error message when error exists', () => {
    render(<FormFillingTaskHandler tasks={[]} error={mockError} />);

    const errorElement = screen.getByTestId('form-filling-tasks-table-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent('ERROR_LOADING_TASKS');
  });
});
