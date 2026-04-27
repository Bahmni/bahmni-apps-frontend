import { SortableDataTable } from '@bahmni/design-system';
import { render, screen } from '@testing-library/react';
import AppointmentTabContent from '../AppointmentTabContent';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@bahmni/design-system', () => ({
  SortableDataTable: jest.fn(() => <div data-testid="sortable-table" />),
}));

const mockSortableDataTable = SortableDataTable as jest.Mock;

const baseProps = {
  appointments: [],
  isLoading: false,
  emptyMessageKey: 'NO_APPOINTMENTS',
  headers: [],
  sortable: [],
  renderCell: jest.fn(),
};

describe('AppointmentTabContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty message when not loading and appointments are empty', () => {
    render(<AppointmentTabContent {...baseProps} />);

    expect(screen.getByText('NO_APPOINTMENTS')).toBeInTheDocument();
    expect(screen.queryByTestId('sortable-table')).not.toBeInTheDocument();
  });

  it('renders SortableDataTable (not empty message) while loading with empty appointments', () => {
    render(<AppointmentTabContent {...baseProps} isLoading />);

    expect(screen.getByTestId('sortable-table')).toBeInTheDocument();
    expect(screen.queryByText('NO_APPOINTMENTS')).not.toBeInTheDocument();
  });

  it('passes pagination props to SortableDataTable', () => {
    const onPageChange = jest.fn();
    render(
      <AppointmentTabContent
        {...baseProps}
        appointments={[{ id: '1' } as any]}
        pageSize={10}
        page={2}
        totalItems={50}
        onPageChange={onPageChange}
      />,
    );

    expect(mockSortableDataTable).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 10,
        page: 2,
        totalItems: 50,
        onPageChange,
      }),
      undefined,
    );
  });
});
