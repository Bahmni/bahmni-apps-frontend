import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardSection from '../DashboardSection';
import { DashboardSection as DashboardSectionType } from '@types/dashboardConfig';

// Mock the Carbon Tile component
jest.mock('@carbon/react', () => ({
  Tile: jest.fn(({ children }) => (
    <div className="cds--tile" data-testid="carbon-tile">
      {children}
    </div>
  )),
}));

describe('DashboardSection Component', () => {
  const mockSection: DashboardSectionType = {
    name: 'Test Section',
    icon: 'test-icon',
    controls: [],
  };

  it('renders with the correct section name', () => {
    render(<DashboardSection section={mockSection} />);

    // Check if the section name is rendered
    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  it('has the correct id attribute', () => {
    const { container } = render(<DashboardSection section={mockSection} />);

    // Check if the div has the correct id
    const sectionDiv = container.querySelector(
      `div[id="section-${mockSection.name}"]`,
    );
    expect(sectionDiv).not.toBeNull();
  });

  it('renders a Tile component', () => {
    render(<DashboardSection section={mockSection} />);

    // Check if a Tile component is rendered
    expect(screen.getByTestId('carbon-tile')).toBeInTheDocument();
  });
});
