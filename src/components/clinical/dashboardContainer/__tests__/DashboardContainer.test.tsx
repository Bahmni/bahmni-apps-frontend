import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardContainer from '../DashboardContainer';
import { DashboardSectionConfig as DashboardSectionType } from '@/types/dashboardConfig';

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();

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
  return jest.fn(({ section, ref }) => (
    <div data-testid={`mocked-section-${section.name}`} ref={ref}>
      Mocked Section: {section.name}
    </div>
  ));
});

describe('DashboardContainer Component', () => {
  // Set up and reset mocks before each test
  beforeEach(() => {
    // Reset the scrollIntoView mock
    mockScrollIntoView.mockClear();

    // Set up the scrollIntoView mock on HTMLElement prototype
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: mockScrollIntoView,
    });
  });

  afterEach(() => {
    // Clean up the mock after each test
    if (HTMLElement.prototype.scrollIntoView === mockScrollIntoView) {
      // Use Reflect.deleteProperty to safely delete the property
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
    }
  });

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

  it('renders all sections', async () => {
    render(<DashboardContainer sections={mockSections} />);

    // Check if all sections are rendered
    expect(screen.getByTestId('mocked-section-Section 1')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-section-Section 2')).toBeInTheDocument();
  });

  it('renders a message when no sections are provided', async () => {
    render(<DashboardContainer sections={[]} />);

    // Check if the no sections message is rendered
    expect(
      screen.getByText('No dashboard sections configured'),
    ).toBeInTheDocument();
  });

  it('renders with Carbon layout components', async () => {
    render(<DashboardContainer sections={mockSections} />);

    // Check if Carbon components are rendered
    expect(screen.getByTestId('carbon-section')).toBeInTheDocument();
    expect(screen.getByTestId('carbon-grid')).toBeInTheDocument();
    expect(screen.getAllByTestId('carbon-column').length).toBe(2); // One column per section
  });

  it('scrolls to the active section when activeItemId matches section name', async () => {
    // Create a spy div element with scrollIntoView method
    const spyElement = document.createElement('div');
    const scrollSpy = jest.spyOn(spyElement, 'scrollIntoView');

    // Mock createRef to return our spy element
    jest.spyOn(React, 'createRef').mockImplementation(() => ({
      current: spyElement,
    }));

    // Render component with activeItemId matching a section name
    render(
      <DashboardContainer
        sections={mockSections}
        activeItemId="Section 1"
      />,
    );

    // Wait for all effects to execute
    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
    });

    // Restore the original implementation
    jest.restoreAllMocks();
  });

  it('does not scroll when activeItemId does not match any section', async () => {
    // Render component with a non-matching activeItemId
    render(
      <DashboardContainer
        sections={mockSections}
        activeItemId="NonExistentSection"
      />,
    );

    // Wait for any pending effects to complete
    await waitFor(() => {});

    // The scrollIntoView should not have been called
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('does not scroll when activeItemId is null', async () => {
    // Render with null activeItemId
    render(<DashboardContainer sections={mockSections} activeItemId={null} />);

    // Wait for any pending effects to complete
    await waitFor(() => {});

    // The scrollIntoView should not have been called
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('updates refs when sections change', async () => {
    // Create a spy div element with scrollIntoView method
    const spyElement = document.createElement('div');
    const scrollSpy = jest.spyOn(spyElement, 'scrollIntoView');

    // Mock createRef to return our spy element
    jest.spyOn(React, 'createRef').mockImplementation(() => ({
      current: spyElement,
    }));

    const { rerender } = render(<DashboardContainer sections={mockSections} />);

    // Add a new section
    const updatedSections: DashboardSectionType[] = [
      ...mockSections,
      {
        name: 'Section 3',
        icon: 'icon-3',
        controls: [],
      },
    ];

    // Re-render with new sections
    rerender(<DashboardContainer sections={updatedSections} />);

    // Check if the new section is rendered
    expect(screen.getByTestId('mocked-section-Section 3')).toBeInTheDocument();

    // Simulate activating the new section
    rerender(
      <DashboardContainer
        sections={updatedSections}
        activeItemId="Section 3"
      />,
    );

    // Wait for scrollIntoView to be called for the new section
    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
    });

    // Restore the original implementation
    jest.restoreAllMocks();
  });

  it('handles section removal correctly', async () => {
    const { rerender } = render(<DashboardContainer sections={mockSections} />);

    // Remove a section
    const reducedSections: DashboardSectionType[] = [mockSections[0]];

    // Re-render with fewer sections
    rerender(<DashboardContainer sections={reducedSections} />);

    // The second section should not be rendered anymore
    expect(
      screen.queryByTestId('mocked-section-Section 2'),
    ).not.toBeInTheDocument();

    // Activating the removed section should not scroll
    rerender(
      <DashboardContainer
        sections={reducedSections}
        activeItemId="Section 2"
      />,
    );

    // Wait for any pending effects to complete
    await waitFor(() => {});

    // No scrolling should happen as the section doesn't exist
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });
});
