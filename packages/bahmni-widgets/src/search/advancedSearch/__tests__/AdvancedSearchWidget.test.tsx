import { render, screen } from '@testing-library/react';
import AdvancedSearchWidget from '../AdvancedSearchWidget';

describe('AdvancedSearchWidget', () => {
  it('renders with correct test ID', () => {
    render(<AdvancedSearchWidget />);
    expect(
      screen.getByTestId('advanced-search-widget-test-id'),
    ).toBeInTheDocument();
  });
});
