import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientSearchForm } from '../PatientSearchForm';
import { PatientSearchCriteria } from '../../../../types/registration';

// Mock the usePatientSearch hook
const mockSearchPatients = jest.fn();
const mockClearSearch = jest.fn();
jest.mock('../../../../hooks/usePatientSearch', () => ({
  usePatientSearch: () => ({
    searchPatients: mockSearchPatients,
    clearSearch: mockClearSearch,
    isLoading: false,
    error: null,
  }),
}));

describe('PatientSearchForm', () => {
  const defaultProps = {
    onSearch: jest.fn(),
    onClear: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render search input field', () => {
      render(<PatientSearchForm {...defaultProps} />);
      expect(screen.getByLabelText(/search patients/i)).toBeInTheDocument();
    });

    it('should render search button', () => {
      render(<PatientSearchForm {...defaultProps} />);
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('should render clear button', () => {
      render(<PatientSearchForm {...defaultProps} />);
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should render advanced search toggle', () => {
      render(<PatientSearchForm {...defaultProps} />);
      expect(screen.getByRole('button', { name: /advanced search/i })).toBeInTheDocument();
    });
  });

  describe('Basic Search', () => {
    it('should update search input value', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const searchInput = screen.getByLabelText(/search patients/i);
      await user.type(searchInput, 'John Doe');

      expect(searchInput).toHaveValue('John Doe');
    });

    it('should call onSearch when search button is clicked', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const searchInput = screen.getByLabelText(/search patients/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(searchInput, 'John Doe');
      await user.click(searchButton);

      expect(defaultProps.onSearch).toHaveBeenCalledWith({
        name: 'John Doe',
      });
    });

    it('should call onSearch when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const searchInput = screen.getByLabelText(/search patients/i);
      await user.type(searchInput, 'John Doe');
      await user.keyboard('{Enter}');

      expect(defaultProps.onSearch).toHaveBeenCalledWith({
        name: 'John Doe',
      });
    });

    it('should not search with empty input', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      expect(defaultProps.onSearch).not.toHaveBeenCalled();
    });

    it('should trim whitespace from search input', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const searchInput = screen.getByLabelText(/search patients/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(searchInput, '  John Doe  ');
      await user.click(searchButton);

      expect(defaultProps.onSearch).toHaveBeenCalledWith({
        name: 'John Doe',
      });
    });
  });

  describe('Advanced Search', () => {
    it('should toggle advanced search form', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /advanced search/i });
      await user.click(toggleButton);

      expect(screen.getByLabelText(/given name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/family name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
    });

    it('should hide advanced search when toggled off', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /advanced search/i });
      await user.click(toggleButton);
      await user.click(toggleButton);

      expect(screen.queryByLabelText(/given name/i)).not.toBeInTheDocument();
    });

    it('should render all advanced search fields', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /advanced search/i });
      await user.click(toggleButton);

      expect(screen.getByLabelText(/given name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/middle name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/family name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/identifier/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/birth date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    });

    it('should search with advanced criteria', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /advanced search/i });
      await user.click(toggleButton);

      const givenNameInput = screen.getByLabelText(/given name/i);
      const familyNameInput = screen.getByLabelText(/family name/i);
      const genderSelect = screen.getByLabelText(/gender/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      await user.type(givenNameInput, 'John');
      await user.type(familyNameInput, 'Doe');
      await user.selectOptions(genderSelect, 'M');
      await user.click(searchButton);

      expect(defaultProps.onSearch).toHaveBeenCalledWith({
        givenName: 'John',
        familyName: 'Doe',
        gender: 'M',
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid birth date', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /advanced search/i });
      await user.click(toggleButton);

      const birthDateInput = screen.getByLabelText(/birth date/i);
      await user.type(birthDateInput, 'invalid-date');

      await waitFor(() => {
        expect(screen.getByText(/invalid date format/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid age', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /advanced search/i });
      await user.click(toggleButton);

      const ageInput = screen.getByLabelText(/age/i);
      await user.type(ageInput, '200');

      await waitFor(() => {
        expect(screen.getByText(/age must be between 0 and 150/i)).toBeInTheDocument();
      });
    });

    it('should not allow both age and birth date', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /advanced search/i });
      await user.click(toggleButton);

      const ageInput = screen.getByLabelText(/age/i);
      const birthDateInput = screen.getByLabelText(/birth date/i);

      await user.type(ageInput, '30');
      await user.type(birthDateInput, '1993-01-01');

      await waitFor(() => {
        expect(screen.getByText(/enter either age or birth date/i)).toBeInTheDocument();
      });
    });
  });

  describe('Clear Functionality', () => {
    it('should clear basic search input', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const searchInput = screen.getByLabelText(/search patients/i);
      const clearButton = screen.getByRole('button', { name: /clear/i });

      await user.type(searchInput, 'John Doe');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(defaultProps.onClear).toHaveBeenCalled();
    });

    it('should clear advanced search fields', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /advanced search/i });
      await user.click(toggleButton);

      const givenNameInput = screen.getByLabelText(/given name/i);
      const familyNameInput = screen.getByLabelText(/family name/i);
      const clearButton = screen.getByRole('button', { name: /clear/i });

      await user.type(givenNameInput, 'John');
      await user.type(familyNameInput, 'Doe');
      await user.click(clearButton);

      expect(givenNameInput).toHaveValue('');
      expect(familyNameInput).toHaveValue('');
    });
  });

  describe('Loading State', () => {
    it('should disable form when loading', () => {
      render(<PatientSearchForm {...defaultProps} isLoading={true} />);

      const searchInput = screen.getByLabelText(/search patients/i);
      const searchButton = screen.getByRole('button', { name: /search/i });

      expect(searchInput).toBeDisabled();
      expect(searchButton).toBeDisabled();
    });

    it('should show loading indicator', () => {
      render(<PatientSearchForm {...defaultProps} isLoading={true} />);
      expect(screen.getByTestId('search-loading')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display search errors', () => {
      render(<PatientSearchForm {...defaultProps} error="Search failed" />);
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });

    it('should clear error when new search is performed', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<PatientSearchForm {...defaultProps} error="Search failed" />);

      expect(screen.getByText('Search failed')).toBeInTheDocument();

      rerender(<PatientSearchForm {...defaultProps} error={null} />);
      const searchInput = screen.getByLabelText(/search patients/i);
      await user.type(searchInput, 'John');

      expect(screen.queryByText('Search failed')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PatientSearchForm {...defaultProps} />);

      expect(screen.getByLabelText(/search patients/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      render(<PatientSearchForm {...defaultProps} />);
      expect(screen.getByRole('search')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} />);

      const searchInput = screen.getByLabelText(/search patients/i);
      await user.tab();

      expect(searchInput).toHaveFocus();
    });
  });

  describe('Debounced Search', () => {
    it('should support auto-search with debouncing', async () => {
      const user = userEvent.setup();
      render(<PatientSearchForm {...defaultProps} enableAutoSearch={true} />);

      const searchInput = screen.getByLabelText(/search patients/i);
      await user.type(searchInput, 'John');

      // Should debounce and call search after delay
      await waitFor(
        () => {
          expect(defaultProps.onSearch).toHaveBeenCalledWith({ name: 'John' });
        },
        { timeout: 500 }
      );
    });
  });

  describe('Recent Searches', () => {
    it('should show recent searches dropdown', async () => {
      const user = userEvent.setup();
      const recentSearches = ['John Doe', 'Jane Smith'];
      render(<PatientSearchForm {...defaultProps} recentSearches={recentSearches} />);

      const searchInput = screen.getByLabelText(/search patients/i);
      await user.click(searchInput);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should select recent search', async () => {
      const user = userEvent.setup();
      const recentSearches = ['John Doe'];
      render(<PatientSearchForm {...defaultProps} recentSearches={recentSearches} />);

      const searchInput = screen.getByLabelText(/search patients/i);
      await user.click(searchInput);
      await user.click(screen.getByText('John Doe'));

      expect(searchInput).toHaveValue('John Doe');
    });
  });
});
