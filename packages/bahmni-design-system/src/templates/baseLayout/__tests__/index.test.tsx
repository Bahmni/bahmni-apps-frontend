import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import BaseLayout from '../index';

expect.extend(toHaveNoViolations);

describe('BaseLayout', () => {
  const MockHeader = () => <div data-testid="mock-header">Mock Header</div>;
  const MockMain = () => (
    <div data-testid="mock-main-display">Mock Main Display</div>
  );
  const MockFooter = () => <div data-testid="mock-footer">Mock Footer</div>;

  const defaultProps = {
    header: <MockHeader />,
    main: <MockMain />,
  };

  describe('Rendering And Structure', () => {
    it.each([
      {
        description: 'renders all sections when all props are provided',
        props: { header: <MockHeader />, main: <MockMain /> },
        testIds: ['mock-header', 'mock-main-display'],
      },
      {
        description: 'renders with empty content in sections',
        props: {
          header: <div data-testid="empty-header" />,
          main: <div data-testid="empty-main-display" />,
        },
        testIds: ['empty-header', 'empty-main-display'],
      },
    ])('$description', ({ props, testIds }) => {
      render(<BaseLayout {...props} />);
      testIds.forEach((id) =>
        expect(screen.getByTestId(id)).toBeInTheDocument(),
      );
    });

    test('renders footer when footer prop is provided', () => {
      render(<BaseLayout {...defaultProps} footer={<MockFooter />} />);
      expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
      expect(
        screen.getByTestId('footer-display-area-test-id'),
      ).toBeInTheDocument();
    });
    test('does not render footer when footer prop is not provided', () => {
      render(<BaseLayout {...defaultProps} />);
      expect(
        screen.queryByTestId('footer-display-area-test-id'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it.each([
      { description: 'without footer', props: defaultProps },
      {
        description: 'with footer',
        props: { ...defaultProps, footer: <MockFooter /> },
      },
    ])('has no accessibility violations $description', async ({ props }) => {
      const { container } = render(<BaseLayout {...props} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
