import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import { CollapsibleRowGroup } from '../CollapsibleRowGroup';

expect.extend(toHaveNoViolations);

describe('CollapsibleRowGroup Component', () => {
  const mockRows = [
    { index: 0, header: 'Name', value: 'John Doe' },
    { index: 1, header: 'Age', value: '30' },
    { index: 2, header: 'Status', value: 'Active', info: 'Last updated today' },
  ];

  it('renders with title and rows', () => {
    render(
      <CollapsibleRowGroup
        title="Patient Information"
        rows={mockRows}
        id="test-group"
      />,
    );

    expect(screen.getByText('Patient Information')).toBeInTheDocument();
    expect(
      screen.getByTestId('test-group-test-id-row-0-header'),
    ).toHaveTextContent('Name');
    expect(
      screen.getByTestId('test-group-test-id-row-0-value'),
    ).toHaveTextContent('John Doe');
  });

  it('renders correct number of RowCells', () => {
    render(
      <CollapsibleRowGroup
        title="Test Group"
        rows={mockRows}
        id="test-group"
      />,
    );

    expect(screen.getByTestId('test-group-test-id-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('test-group-test-id-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('test-group-test-id-row-2')).toBeInTheDocument();
  });

  it('renders info when provided', () => {
    render(<CollapsibleRowGroup title="Test Group" rows={mockRows} />);

    expect(
      screen.getByTestId('collapsible-row-group-test-id-row-2-info'),
    ).toHaveTextContent('Last updated today');
  });

  it('passes axe accessibility tests', async () => {
    const { container } = render(
      <CollapsibleRowGroup
        title="Test Group"
        rows={mockRows}
        id="test-group"
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders with children instead of rows', () => {
    render(
      <CollapsibleRowGroup title="Custom Content" id="custom-group">
        <div data-testid="custom-child">Custom child content</div>
      </CollapsibleRowGroup>,
    );

    expect(screen.getByTestId('custom-child')).toHaveTextContent(
      'Custom child content',
    );
  });

  it('renders both rows and children together', () => {
    render(
      <CollapsibleRowGroup
        title="Mixed Content"
        rows={mockRows}
        id="mixed-group"
      >
        <div data-testid="additional-content">Additional content</div>
      </CollapsibleRowGroup>,
    );

    expect(screen.getByTestId('mixed-group-test-id-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('additional-content')).toBeInTheDocument();
  });
});
