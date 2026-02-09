import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LabelValue } from '..';

expect.extend(toHaveNoViolations);

describe('LabelValue', () => {
  it('should render label and value', () => {
    render(<LabelValue id="test-item" label="Test Label" value="Test Value" />);

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Test Value')).toBeInTheDocument();
  });

  it('should apply correct id attribute', () => {
    const { container } = render(
      <LabelValue id="patient-id" label="Patient ID" value="ABC123" />,
    );

    const dlElement = container.querySelector('#patient-id');
    expect(screen.getByTestId('patient-id-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('patient-id-test-id')).toHaveAttribute(
      'aria-label',
      'patient-id-aria-label',
    );
    expect(dlElement).toBeInTheDocument();
    expect(dlElement?.tagName).toBe('DL');
  });

  it('should apply custom valueId when provided', () => {
    render(
      <LabelValue
        id="test-item"
        label="Label"
        value="Value"
        valueId="custom-value"
      />,
    );

    expect(screen.getByTestId('custom-value-test-id')).toHaveTextContent(
      'Value',
    );
  });

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const { container } = render(
        <LabelValue
          id="test-item"
          label="Test Label"
          value="Test Value"
          labelId="label-id"
          valueId="value-id"
        />,
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <LabelValue id="test-item" label="Test Label" value="Test Value" />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
