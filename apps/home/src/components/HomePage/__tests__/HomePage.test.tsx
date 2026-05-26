import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { HomePage } from '../HomePage';

expect.extend(toHaveNoViolations);

jest.mock('../../HomePageGrid', () => ({
  HomePageGrid: () => <div data-testid="home-page-grid" />,
}));

jest.mock('../../HomePageHeader', () => ({
  HomePageHeader: () => <div data-testid="home-page-header" />,
}));

describe('HomePage', () => {
  it('renders the page header', () => {
    render(<HomePage />);
    expect(screen.getByTestId('home-page-header')).toBeInTheDocument();
  });

  it('renders the page grid', () => {
    render(<HomePage />);
    expect(screen.getByTestId('home-page-grid')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<HomePage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
