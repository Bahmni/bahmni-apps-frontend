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

  it('renders with optional info containing primary and secondary', () => {
    render(
      <RowCell
        header="Status"
        value="Active"
        info={{ primary: 'Last updated', secondary: '2 days ago' }}
        testId="test-row"
      />,
    );

    expect(screen.getByTestId('test-row-info-primary')).toHaveTextContent(
      'Last updated',
    );
    expect(screen.getByTestId('test-row-info-secondary')).toHaveTextContent(
      '2 days ago',
    );
  });

  it('renders only primary info when secondary is not provided', () => {
    render(
      <RowCell
        header="Status"
        value="Active"
        info={{ primary: 'Last updated' }}
        testId="test-row"
      />,
    );

    expect(screen.getByTestId('test-row-info-primary')).toHaveTextContent(
      'Last updated',
    );
    expect(
      screen.queryByTestId('test-row-info-secondary'),
    ).not.toBeInTheDocument();
  });

  it('renders only secondary info when primary is not provided', () => {
    render(
      <RowCell
        header="Status"
        value="Active"
        info={{ secondary: '2 days ago' }}
        testId="test-row"
      />,
    );

    expect(
      screen.queryByTestId('test-row-info-primary'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('test-row-info-secondary')).toHaveTextContent(
      '2 days ago',
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
        info={{ primary: 'Additional info', secondary: 'More details' }}
        testId="test-row"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
