import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardContainer from '../DashboardContainer';
import { DashboardSectionConfig as DashboardSectionType } from '@types/dashboardConfig';

// Mock the Carbon components
jest.mock('@carbon/react', () => ({
  Grid: jest.fn(({ children }) => (
    <div data-testid="carbon-grid">{children}</div>
  )),
  Column: jest.fn(({ children }) => (
    <div data-testid="carbon-column">{children}</div>
  )),
  Section: jest.fn(({ children }) => (
    <div data-testid="carbon-section">{children}</div>
  )),
}));

// Mock the DashboardSection component
jest.mock('../../dashboardSection/DashboardSection', () => {
  return jest.fn(({ section }) => (
    <div data-testid={`mocked-section-${section.name}`}>
      Mocked Section: {section.name}
    </div>
  ));
});

describe('DashboardContainer Component', () => {
  const mockSections: DashboardSectionType[] = [
    {
      name: 'Section 1',
      icon: 'icon-1',
      controls: [],
    },
    {
      name: 'Section 2',
      icon: 'icon-2',
      controls: [],
    },
  ];

  it('renders all sections', () => {
    render(<DashboardContainer sections={mockSections} />);

    // Check if all sections are rendered
    expect(screen.getByTestId('mocked-section-Section 1')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-section-Section 2')).toBeInTheDocument();
  });

  it('renders a message when no sections are provided', () => {
    render(<DashboardContainer sections={[]} />);

    // Check if the no sections message is rendered
    expect(
      screen.getByText('No dashboard sections configured'),
    ).toBeInTheDocument();
  });

  it('renders with Carbon layout components', () => {
    render(<DashboardContainer sections={mockSections} />);

    // Check if Carbon components are rendered
    expect(screen.getByTestId('carbon-section')).toBeInTheDocument();
    expect(screen.getByTestId('carbon-grid')).toBeInTheDocument();
    expect(screen.getAllByTestId('carbon-column').length).toBe(2); // One column per section
  });
});
