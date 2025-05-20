import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DiagnosesForm from '../DiagnosesForm';
import i18n from '@/setupTests.i18n';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('DiagnosesForm', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    // Reset i18n to English
    i18n.changeLanguage('en');
    jest.clearAllMocks();
  });

  describe('Happy Paths', () => {
    it('should render with the correct title', () => {
      render(<DiagnosesForm onChange={mockOnChange} />);
      expect(screen.getByText('Diagnoses')).toBeInTheDocument();
    });

    it('should render a search component', () => {
      render(<DiagnosesForm onChange={mockOnChange} />);
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toHaveAttribute(
        'id',
        'diagnoses-search',
      );
    });

    it('should apply the translated placeholder text', () => {
      render(<DiagnosesForm onChange={mockOnChange} />);
      expect(
        screen.getByPlaceholderText('Search to add new diagnosis'),
      ).toBeInTheDocument();
    });

    it('should call onChange when input changes', () => {
      render(<DiagnosesForm onChange={mockOnChange} />);

      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'test' },
      });
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should not render a loading indicator when isLoading is false', () => {
      render(<DiagnosesForm onChange={mockOnChange} isLoading={false} />);
      expect(screen.queryByTitle('Loading')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', async () => {
      const { container } = render(<DiagnosesForm onChange={mockOnChange} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
