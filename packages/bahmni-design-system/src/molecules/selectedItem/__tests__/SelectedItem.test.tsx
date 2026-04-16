import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SelectedItem } from '../SelectedItem';

expect.extend(toHaveNoViolations);

describe('SelectedItem', () => {
  describe('Happy Paths', () => {
    it('should render children correctly', () => {
      const testContent = 'Test content';
      const mockOnClose = jest.fn();

      render(
        <SelectedItem onClose={mockOnClose}>
          <div>{testContent}</div>
        </SelectedItem>,
      );

      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      const testContent = 'Test content';

      render(
        <SelectedItem onClose={mockOnClose}>
          <div>{testContent}</div>
        </SelectedItem>,
      );

      const closeButton = screen.getByLabelText('Close Selected Item');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const mockOnClose = jest.fn();
      const testContent = 'Test content';

      const { container } = render(
        <SelectedItem onClose={mockOnClose}>
          <div>{testContent}</div>
        </SelectedItem>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('Snapshot', () => {
  it('should match snapshot', () => {
    const mockOnClose = jest.fn();
    const testContent = 'Test content';

    const { container } = render(
      <SelectedItem onClose={mockOnClose}>
        <div>{testContent}</div>
      </SelectedItem>,
    );

    expect(container).toMatchSnapshot();
  });
});
