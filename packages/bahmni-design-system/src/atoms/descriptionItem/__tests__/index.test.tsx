import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import DescriptionItem from '..';

expect.extend(toHaveNoViolations);

describe('DescriptionItem', () => {
  it('should render with required props', () => {
    render(
      <DescriptionItem id="test-item" label="Test Label" value="Test Value" />,
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Test Value')).toBeInTheDocument();
  });

  it('should apply correct id attribute', () => {
    const { container } = render(
      <DescriptionItem
        id="destination-country"
        label="Country"
        value="United States"
      />,
    );

    const dlElement = container.querySelector('#destination-country');
    expect(
      screen.getByTestId('destination-country-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('destination-country-test-id')).toHaveAttribute(
      'aria-label',
      'destination-country-aria-label',
    );
    expect(dlElement).toBeInTheDocument();
    expect(dlElement?.tagName).toBe('DL');
  });

  it('should apply value test id when provided', () => {
    render(
      <DescriptionItem
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
        <DescriptionItem
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
        <DescriptionItem
          id="test-item"
          label="Test Label"
          value="Test Value"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
