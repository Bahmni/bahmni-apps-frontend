import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import BaseLayout from '../index';

expect.extend(toHaveNoViolations);

describe('BaseLayout', () => {
  const MockHeader = () => <div data-testid="mock-header">Mock Header</div>;
  const MockMain = () => (
    <div data-testid="mock-main-display">Mock Main Display</div>
  );

  const defaultProps = {
    header: <MockHeader />,
    main: <MockMain />,
  };

  describe('Rendering And Structure', () => {
    test('renders all sections when all props are provided', () => {
      render(<BaseLayout {...defaultProps} />);
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
      expect(screen.getByTestId('mock-main-display')).toBeInTheDocument();
    });
    test('renders with empty content in sections', () => {
      const emptyProps = {
        header: <div data-testid="empty-header" />,
        main: <div data-testid="empty-main-display" />,
      };

      render(<BaseLayout {...emptyProps} />);
      expect(screen.getByTestId('empty-header')).toBeInTheDocument();
      expect(screen.getByTestId('empty-main-display')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(<BaseLayout {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
