import React from 'react';
import { render, screen } from '@testing-library/react';
import { DataField } from '../DataField';

describe('DataField', () => {
  it('renders label and value correctly', () => {
    render(
      <DataField
        label="Test Label"
        value="Test Value"
      />
    );

    expect(screen.getByText('Test Label:')).toBeInTheDocument();
    expect(screen.getByText('Test Value')).toBeInTheDocument();
  });

  it('renders required indicator when required is true', () => {
    render(
      <DataField
        label="Required Field"
        value="Test Value"
        required
      />
    );

    expect(screen.getByLabelText('required')).toBeInTheDocument();
  });

  it('does not render required indicator when required is false', () => {
    render(
      <DataField
        label="Optional Field"
        value="Test Value"
        required={false}
      />
    );

    expect(screen.queryByLabelText('required')).not.toBeInTheDocument();
  });

  it('renders React node as value', () => {
    const reactValue = <span data-testid="react-value">React Value</span>;

    render(
      <DataField
        label="React Field"
        value={reactValue}
      />
    );

    expect(screen.getByTestId('react-value')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <DataField
        label="Test Label"
        value="Test Value"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses semantic HTML elements', () => {
    render(
      <DataField
        label="Test Label"
        value="Test Value"
      />
    );

    expect(screen.getByRole('term')).toBeInTheDocument();
    expect(screen.getByRole('definition')).toBeInTheDocument();
  });
});
