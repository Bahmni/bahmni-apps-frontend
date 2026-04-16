import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BoxWHeader } from '../BoxWHeader';

expect.extend(toHaveNoViolations);

describe('BoxWHeader', () => {
  describe('Happy Paths', () => {
    it('should render correctly with required props', () => {
      const title = 'Test Title';
      const childText = 'Test Children';

      render(
        <BoxWHeader title={title}>
          <div>{childText}</div>
        </BoxWHeader>,
      );

      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(childText)).toBeInTheDocument();
      expect(screen.getByTestId('box-w-title')).toBeInTheDocument();
    });

    it('should render with custom data-testid when provided', () => {
      const customTestId = 'custom-test-id';

      render(
        <BoxWHeader title="Title" dataTestId={customTestId}>
          <div>Content</div>
        </BoxWHeader>,
      );

      expect(screen.getByTestId(customTestId)).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const customClass = 'custom-class';

      const { container } = render(
        <BoxWHeader title="Title" className={customClass}>
          <div>Content</div>
        </BoxWHeader>,
      );

      const gridElement = container.firstChild;
      expect(gridElement).toHaveClass('box');
      expect(gridElement).toHaveClass(customClass);
    });

    it('should match snapshot', () => {
      const { container } = render(
        <BoxWHeader title="Snapshot Test">
          <div>Snapshot Content</div>
        </BoxWHeader>,
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <BoxWHeader title="Accessibility Test">
          <div>Test content for accessibility</div>
        </BoxWHeader>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
