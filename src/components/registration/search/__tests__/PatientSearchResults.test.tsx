import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientSearchResults } from '../PatientSearchResults';
import { PatientSearchResult } from '../../../../types/registration';

// Mock the child components
jest.mock('../PatientCard', () => ({
  PatientCard: ({ patient, onSelect, isSelected }: any) => (
    <div data-testid={`patient-card-${patient.uuid}`}>
      <button onClick={() => onSelect(patient)}>
        {patient.display} {isSelected ? '(selected)' : ''}
      </button>
    </div>
  ),
}));

jest.mock('../../common/Pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
        Previous
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
        Next
      </button>
    </div>
  ),
}));

// Mock patient data
const mockPatients: PatientSearchResult[] = [
  {
    uuid: 'patient-1',
    display: 'John Doe',
    identifiers: [
      {
        uuid: 'id-1',
        identifier: 'BAH001',
        identifierType: { uuid: 'type-1', name: 'Bahmni ID', display: 'Bahmni ID' },
        preferred: true,
      },
    ],
    person: {
      uuid: 'person-1',
      display: 'John Doe',
      gender: 'M',
      age: 35,
      birthdate: '1988-05-15',
      birthdateEstimated: false,
      names: [
        {
          uuid: 'name-1',
          display: 'John Doe',
          givenName: 'John',
          familyName: 'Doe',
          preferred: true,
        },
      ],
      addresses: [],
    },
    voided: false,
    links: [],
  },
  {
    uuid: 'patient-2',
    display: 'Jane Smith',
    identifiers: [
      {
        uuid: 'id-2',
        identifier: 'BAH002',
        identifierType: { uuid: 'type-1', name: 'Bahmni ID', display: 'Bahmni ID' },
        preferred: true,
      },
    ],
    person: {
      uuid: 'person-2',
      display: 'Jane Smith',
      gender: 'F',
      age: 28,
      birthdate: '1995-03-22',
      birthdateEstimated: false,
      names: [
        {
          uuid: 'name-2',
          display: 'Jane Smith',
          givenName: 'Jane',
          familyName: 'Smith',
          preferred: true,
        },
      ],
      addresses: [],
    },
    voided: false,
    links: [],
  },
  {
    uuid: 'patient-3',
    display: 'Bob Johnson',
    identifiers: [
      {
        uuid: 'id-3',
        identifier: 'BAH003',
        identifierType: { uuid: 'type-1', name: 'Bahmni ID', display: 'Bahmni ID' },
        preferred: true,
      },
    ],
    person: {
      uuid: 'person-3',
      display: 'Bob Johnson',
      gender: 'M',
      age: 42,
      birthdate: '1981-12-10',
      birthdateEstimated: false,
      names: [
        {
          uuid: 'name-3',
          display: 'Bob Johnson',
          givenName: 'Bob',
          familyName: 'Johnson',
          preferred: true,
        },
      ],
      addresses: [],
    },
    voided: false,
    links: [],
  },
];

describe('PatientSearchResults', () => {
  const defaultProps = {
    patients: mockPatients,
    totalResults: 150,
    currentPage: 1,
    pageSize: 10,
    totalPages: 15,
    onPatientSelect: jest.fn(),
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render search results with patient cards', () => {
      render(<PatientSearchResults {...defaultProps} />);

      expect(screen.getByTestId('patient-card-patient-1')).toBeInTheDocument();
      expect(screen.getByTestId('patient-card-patient-2')).toBeInTheDocument();
      expect(screen.getByTestId('patient-card-patient-3')).toBeInTheDocument();
    });

    it('should render results count', () => {
      render(<PatientSearchResults {...defaultProps} />);
      expect(screen.getByText(/150 patients found/i)).toBeInTheDocument();
    });

    it('should render pagination', () => {
      render(<PatientSearchResults {...defaultProps} />);
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('should render view toggle buttons', () => {
      render(<PatientSearchResults {...defaultProps} />);
      expect(screen.getByRole('button', { name: /grid view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /list view/i })).toBeInTheDocument();
    });

    it('should render sort dropdown', () => {
      render(<PatientSearchResults {...defaultProps} />);
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    });
  });

  describe('View Toggle', () => {
    it('should start with grid view by default', () => {
      render(<PatientSearchResults {...defaultProps} />);
      const gridButton = screen.getByRole('button', { name: /grid view/i });
      expect(gridButton).toHaveClass('active');
    });

    it('should toggle between grid and list view', async () => {
      const user = userEvent.setup();
      render(<PatientSearchResults {...defaultProps} />);

      const listButton = screen.getByRole('button', { name: /list view/i });
      await user.click(listButton);

      expect(listButton).toHaveClass('active');
      expect(screen.getByTestId('results-container')).toHaveClass('listView');
    });

    it('should maintain view preference', async () => {
      const user = userEvent.setup();
      render(<PatientSearchResults {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /list view/i }));
      expect(screen.getByTestId('results-container')).toHaveClass('listView');

      await user.click(screen.getByRole('button', { name: /grid view/i }));
      expect(screen.getByTestId('results-container')).toHaveClass('gridView');
    });
  });

  describe('Sorting', () => {
    it('should render sort options', () => {
      render(<PatientSearchResults {...defaultProps} />);
      const sortSelect = screen.getByLabelText(/sort by/i);

      fireEvent.click(sortSelect);
      expect(screen.getByText('Name (A-Z)')).toBeInTheDocument();
      expect(screen.getByText('Name (Z-A)')).toBeInTheDocument();
      expect(screen.getByText('Age (Youngest)')).toBeInTheDocument();
      expect(screen.getByText('Age (Oldest)')).toBeInTheDocument();
    });

    it('should call onSort when sort option is selected', async () => {
      const onSort = jest.fn();
      const user = userEvent.setup();

      render(<PatientSearchResults {...defaultProps} onSort={onSort} />);

      const sortSelect = screen.getByLabelText(/sort by/i);
      await user.selectOptions(sortSelect, 'age-asc');

      expect(onSort).toHaveBeenCalledWith('age-asc');
    });

    it('should show current sort selection', () => {
      render(<PatientSearchResults {...defaultProps} sortBy="name-desc" />);
      const sortSelect = screen.getByLabelText(/sort by/i);
      expect(sortSelect).toHaveValue('name-desc');
    });
  });

  describe('Filtering', () => {
    it('should render filter panel toggle', () => {
      render(<PatientSearchResults {...defaultProps} />);
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    it('should toggle filter panel', async () => {
      const user = userEvent.setup();
      render(<PatientSearchResults {...defaultProps} />);

      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);

      expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
    });

    it('should render gender filter', async () => {
      const user = userEvent.setup();
      render(<PatientSearchResults {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /filters/i }));
      expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
    });

    it('should render age range filter', async () => {
      const user = userEvent.setup();
      render(<PatientSearchResults {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /filters/i }));
      expect(screen.getByLabelText(/min age/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max age/i)).toBeInTheDocument();
    });

    it('should call onFilter when filters are applied', async () => {
      const onFilter = jest.fn();
      const user = userEvent.setup();

      render(<PatientSearchResults {...defaultProps} onFilter={onFilter} />);

      await user.click(screen.getByRole('button', { name: /filters/i }));
      const genderSelect = screen.getByLabelText(/gender/i);
      await user.selectOptions(genderSelect, 'M');

      expect(onFilter).toHaveBeenCalledWith({ gender: 'M' });
    });
  });

  describe('Patient Selection', () => {
    it('should call onPatientSelect when patient card is clicked', async () => {
      const user = userEvent.setup();
      render(<PatientSearchResults {...defaultProps} />);

      await user.click(screen.getByText('John Doe'));
      expect(defaultProps.onPatientSelect).toHaveBeenCalledWith(mockPatients[0]);
    });

    it('should show selected patient', () => {
      render(<PatientSearchResults {...defaultProps} selectedPatientUuid="patient-2" />);
      expect(screen.getByText('Jane Smith (selected)')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PatientSearchResults {...defaultProps} />);

      const firstCard = screen.getByTestId('patient-card-patient-1');
      firstCard.focus();
      await user.keyboard('{Enter}');

      expect(defaultProps.onPatientSelect).toHaveBeenCalledWith(mockPatients[0]);
    });
  });

  describe('Pagination', () => {
    it('should call onPageChange when pagination is used', async () => {
      const user = userEvent.setup();
      render(<PatientSearchResults {...defaultProps} />);

      await user.click(screen.getByText('Next'));
      expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
    });

    it('should show correct page information', () => {
      render(<PatientSearchResults {...defaultProps} currentPage={3} />);
      expect(screen.getByText('Page 3 of 15')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      render(<PatientSearchResults {...defaultProps} isLoading={true} />);
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should disable pagination when loading', () => {
      render(<PatientSearchResults {...defaultProps} isLoading={true} />);
      expect(screen.getByText('Previous')).toBeDisabled();
      expect(screen.getByText('Next')).toBeDisabled();
    });

    it('should show loading count', () => {
      render(<PatientSearchResults {...defaultProps} isLoading={true} />);
      expect(screen.getByText(/searching.../i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when error occurs', () => {
      render(<PatientSearchResults {...defaultProps} error="Search failed" />);
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      render(<PatientSearchResults {...defaultProps} error="Search failed" onRetry={jest.fn()} />);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = jest.fn();
      const user = userEvent.setup();

      render(<PatientSearchResults {...defaultProps} error="Search failed" onRetry={onRetry} />);

      await user.click(screen.getByRole('button', { name: /retry/i }));
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no patients found', () => {
      render(<PatientSearchResults {...defaultProps} patients={[]} totalResults={0} />);
      expect(screen.getByText(/no patients found/i)).toBeInTheDocument();
    });

    it('should show search suggestions in empty state', () => {
      render(<PatientSearchResults {...defaultProps} patients={[]} totalResults={0} />);
      expect(screen.getByText(/try different search terms/i)).toBeInTheDocument();
    });

    it('should show create new patient button in empty state', () => {
      render(<PatientSearchResults {...defaultProps} patients={[]} totalResults={0} onCreateNew={jest.fn()} />);
      expect(screen.getByRole('button', { name: /create new patient/i })).toBeInTheDocument();
    });

    it('should call onCreateNew when create button is clicked', async () => {
      const onCreateNew = jest.fn();
      const user = userEvent.setup();

      render(<PatientSearchResults {...defaultProps} patients={[]} totalResults={0} onCreateNew={onCreateNew} />);

      await user.click(screen.getByRole('button', { name: /create new patient/i }));
      expect(onCreateNew).toHaveBeenCalled();
    });
  });

  describe('Bulk Operations', () => {
    it('should show bulk selection checkbox when enabled', () => {
      render(<PatientSearchResults {...defaultProps} enableBulkSelection={true} />);
      expect(screen.getByLabelText(/select all/i)).toBeInTheDocument();
    });

    it('should show bulk actions when patients are selected', async () => {
      const user = userEvent.setup();
      render(<PatientSearchResults {...defaultProps} enableBulkSelection={true} />);

      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      await user.click(selectAllCheckbox);

      expect(screen.getByText(/3 patients selected/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export selected/i })).toBeInTheDocument();
    });

    it('should call onBulkAction when bulk action is performed', async () => {
      const onBulkAction = jest.fn();
      const user = userEvent.setup();

      render(<PatientSearchResults {...defaultProps} enableBulkSelection={true} onBulkAction={onBulkAction} />);

      await user.click(screen.getByLabelText(/select all/i));
      await user.click(screen.getByRole('button', { name: /export selected/i }));

      expect(onBulkAction).toHaveBeenCalledWith('export', mockPatients.map(p => p.uuid));
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PatientSearchResults {...defaultProps} />);
      expect(screen.getByRole('region', { name: /search results/i })).toBeInTheDocument();
    });

    it('should announce search results count to screen readers', () => {
      render(<PatientSearchResults {...defaultProps} />);
      expect(screen.getByRole('status')).toHaveTextContent('150 patients found');
    });

    it('should support keyboard navigation through results', async () => {
      const user = userEvent.setup();
      render(<PatientSearchResults {...defaultProps} />);

      await user.tab();
      expect(screen.getByTestId('patient-card-patient-1')).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile view', () => {
      render(<PatientSearchResults {...defaultProps} isMobile={true} />);
      expect(screen.getByTestId('results-container')).toHaveClass('mobileView');
    });

    it('should hide some controls on mobile', () => {
      render(<PatientSearchResults {...defaultProps} isMobile={true} />);
      expect(screen.queryByRole('button', { name: /grid view/i })).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should virtualize large result sets', () => {
      const manyPatients = Array.from({ length: 100 }, (_, i) => ({
        ...mockPatients[0],
        uuid: `patient-${i}`,
        display: `Patient ${i}`,
      }));

      render(<PatientSearchResults {...defaultProps} patients={manyPatients} enableVirtualization={true} />);

      // Should only render visible items
      const renderedCards = screen.getAllByTestId(/patient-card/);
      expect(renderedCards.length).toBeLessThan(manyPatients.length);
    });
  });
});
