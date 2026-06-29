import { render, screen } from '@testing-library/react';
import CommonSearchWidget from '../CommonSearchWidget';

describe('CommonSearchWidget', () => {
  it('renders with correct test ID', () => {
    render(<CommonSearchWidget />);
    expect(
      screen.getByTestId('common-search-widget-test-id'),
    ).toBeInTheDocument();
  });

  it('renders translated label', () => {
    render(<CommonSearchWidget />);
    expect(screen.getByText('COMMON_SEARCH_LABEL')).toBeInTheDocument();
  });
});
