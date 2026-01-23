import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import { RowCell } from '../index';

expect.extend(toHaveNoViolations);

describe('RowCell Component', () => {
  it('renders with header and value', () => {
    render(<RowCell header="Name" value="John Doe" testId="test-row" />);

    expect(screen.getByTestId('test-row-header')).toHaveTextContent('Name');
    expect(screen.getByTestId('test-row-value')).toHaveTextContent('John Doe');
  });

  it('renders with optional info', () => {
    render(
      <RowCell
        header="Status"
        value="Active"
        info="Last updated"
        testId="test-row"
      />,
    );

    expect(screen.getByTestId('test-row-info')).toHaveTextContent(
      'Last updated',
    );
  });

  it('does not render info when not provided', () => {
    render(<RowCell header="Name" value="John Doe" testId="test-row" />);

    expect(screen.queryByTestId('test-row-info')).not.toBeInTheDocument();
  });

  it('applies custom id, testId, and ariaLabel props', () => {
    render(
      <RowCell
        header="Name"
        value="John"
        id="custom-id"
        testId="test-row"
        ariaLabel="patient-name"
      />,
    );

    const container = screen.getByTestId('test-row');
    expect(container).toHaveAttribute('id', 'custom-id');
    expect(container).toHaveAttribute('aria-label', 'patient-name');
    expect(screen.getByTestId('test-row-header')).toHaveAttribute(
      'id',
      'custom-id-header',
    );
    expect(screen.getByTestId('test-row-value')).toHaveAttribute(
      'id',
      'custom-id-value',
    );
  });

  it('uses default values when id, testId, and ariaLabel are not provided', () => {
    render(<RowCell header="Name" value="John" />);

    const container = screen.getByTestId('row-cell-test-id');
    expect(container).toHaveAttribute('id', 'row-cell');
    expect(container).toHaveAttribute('aria-label', 'row-cell-aria-label');
  });

  it('applies custom className', () => {
    render(
      <RowCell
        header="Name"
        value="John"
        className="custom-class"
        testId="test-row"
      />,
    );

    expect(screen.getByTestId('test-row')).toHaveClass('custom-class');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <RowCell
        header="Name"
        value="John Doe"
        info="Additional info"
        testId="test-row"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
