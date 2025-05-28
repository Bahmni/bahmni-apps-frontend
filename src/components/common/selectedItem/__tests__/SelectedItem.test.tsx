import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectedItem from '../SelectedItem';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('SelectedItem', () => {
  describe('Happy Paths', () => {
    it('should render children correctly', () => {
      // Arrange
      const testContent = 'Test content';
      const mockOnClose = jest.fn();

      // Act
      render(
        <SelectedItem onClose={mockOnClose}>
          <div>{testContent}</div>
        </SelectedItem>,
      );

      // Assert
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      // Arrange
      const mockOnClose = jest.fn();
      const testContent = 'Test content';

      // Act
      render(
        <SelectedItem onClose={mockOnClose}>
          <div>{testContent}</div>
        </SelectedItem>,
      );

      const closeButton = screen.getByLabelText('Close Selected Item');
      fireEvent.click(closeButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      // Arrange      // Arrange
      const mockOnClose = jest.fn();
      const testContent = 'Test content';

      const { container } = render(
        <SelectedItem onClose={mockOnClose}>
          <div>{testContent}</div>
        </SelectedItem>,
      );

      // Act & Assert
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('Snapshot', () => {
  it('should match snapshot', () => {
    // Arrange
    const mockOnClose = jest.fn();
    const testContent = 'Test content';

    // Act
    const { container } = render(
      <SelectedItem onClose={mockOnClose}>
        <div>{testContent}</div>
      </SelectedItem>,
    );

    // Assert
    expect(container).toMatchSnapshot();
  });
});
