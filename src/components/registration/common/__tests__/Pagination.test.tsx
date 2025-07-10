import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    pageSize: 10,
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render pagination with correct page information', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();
      expect(screen.getByText('100 items total')).toBeInTheDocument();
    });

    it('should render previous and next buttons', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should render page size selector', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByLabelText(/items per page/i)).toBeInTheDocument();
    });

    it('should render page number input', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByLabelText(/go to page/i)).toBeInTheDocument();
    });
  });

  describe('Previous/Next Navigation', () => {
    it('should disable previous button on first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      render(<Pagination {...defaultProps} currentPage={10} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should call onPageChange when previous button is clicked', async () => {
      const user = userEvent.setup();
      render(<Pagination {...defaultProps} currentPage={3} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      await user.click(prevButton);

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange when next button is clicked', async () => {
      const user = userEvent.setup();
      render(<Pagination {...defaultProps} currentPage={3} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(4);
    });
  });

  describe('Page Size Selection', () => {
    it('should render page size options', () => {
      render(<Pagination {...defaultProps} />);

      const select = screen.getByLabelText(/items per page/i);
      expect(select).toHaveDisplayValue('10');

      fireEvent.click(select);
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should call onPageSizeChange when page size is changed', async () => {
      const user = userEvent.setup();
      render(<Pagination {...defaultProps} />);

      const select = screen.getByLabelText(/items per page/i);
      await user.selectOptions(select, '25');

      expect(defaultProps.onPageSizeChange).toHaveBeenCalledWith(25);
    });
  });

  describe('Jump to Page', () => {
    it('should accept valid page number input', async () => {
      const user = userEvent.setup();
      render(<Pagination {...defaultProps} />);

      const input = screen.getByLabelText(/go to page/i);
      await user.clear(input);
      await user.type(input, '5');
      await user.keyboard('{Enter}');

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(5);
    });

    it('should reject invalid page numbers', async () => {
      const user = userEvent.setup();
      render(<Pagination {...defaultProps} />);

      const input = screen.getByLabelText(/go to page/i);
      await user.clear(input);
      await user.type(input, '15');
      await user.keyboard('{Enter}');

      expect(defaultProps.onPageChange).not.toHaveBeenCalled();
    });

    it('should reject non-numeric input', async () => {
      const user = userEvent.setup();
      render(<Pagination {...defaultProps} />);

      const input = screen.getByLabelText(/go to page/i);
      await user.clear(input);
      await user.type(input, 'abc');
      await user.keyboard('{Enter}');

      expect(defaultProps.onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/items per page/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/go to page/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Pagination {...defaultProps} currentPage={3} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      prevButton.focus();
      await user.keyboard('{Enter}');

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single page scenario', () => {
      render(<Pagination {...defaultProps} totalPages={1} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('should handle zero items', () => {
      render(<Pagination {...defaultProps} totalItems={0} totalPages={0} />);

      expect(screen.getByText('0 items total')).toBeInTheDocument();
    });

    it('should handle large page numbers', () => {
      render(<Pagination {...defaultProps} currentPage={999} totalPages={1000} />);

      expect(screen.getByText('Page 999 of 1000')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable all controls when loading', () => {
      render(<Pagination {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
      expect(screen.getByLabelText(/items per page/i)).toBeDisabled();
      expect(screen.getByLabelText(/go to page/i)).toBeDisabled();
    });
  });
});
