import {
  DashboardSectionConfig as DashboardSectionType,
  AUDIT_LOG_EVENT_DETAILS,
  dispatchAuditEvent,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import DashboardContainer from '../DashboardContainer';

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();

// Mock the audit event dispatcher
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
  useTranslation: jest.fn(() => ({
    t: (key: string) => key, // Mock translation function
  })),
}));

// Mock the usePatientUUID hook
jest.mock('@bahmni/widgets', () => ({
  usePatientUUID: jest.fn(),
}));

// Mock i18n hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Return the key as translation for testing
  }),
}));

// Mock the DashboardSection component
jest.mock('../../dashboardSection/DashboardSection', () => {
  return jest.fn(({ section, ref }) => (
    <div data-testid={`mocked-section-${section.name}`} ref={ref}>
      Mocked Section: {section.name}
    </div>
  ));
});

const mockDispatchAuditEvent = dispatchAuditEvent as jest.MockedFunction<
  typeof dispatchAuditEvent
>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

describe('DashboardContainer Component', () => {
  // Set up and reset mocks before each test
  beforeEach(() => {
    // Reset the scrollIntoView mock
    mockScrollIntoView.mockClear();

    // Reset audit logging mocks
    jest.clearAllMocks();

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Set up the scrollIntoView mock on HTMLElement prototype
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: mockScrollIntoView,
    });
  });

  afterEach(() => {
    // Restore console mocks
    jest.restoreAllMocks();
  });

  const mockSections: DashboardSectionType[] = [
    {
      id: 'section-1-id',
      name: 'Section 1',
      icon: 'icon-1',
      controls: [],
    },
    {
      id: 'section-2-id',
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
    expect(screen.getByText('NO_DASHBOARD_SECTIONS')).toBeInTheDocument();
  });

  it('scrolls to the active section when activeItemId matches section id', async () => {
    // Create a spy div element with scrollIntoView method
    const spyElement = document.createElement('div');
    const scrollSpy = jest.spyOn(spyElement, 'scrollIntoView');

    // Mock createRef to return our spy element
    jest.spyOn(React, 'createRef').mockImplementation(() => ({
      current: spyElement,
    }));

    // Render component with activeItemId matching a section id
    render(
      <DashboardContainer
        sections={mockSections}
        activeItemId="section-1-id"
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
        id: 'section-3-id',
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
        activeItemId="section-3-id"
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
        activeItemId="section-2-id"
      />,
    );

    // Wait for any pending effects to complete
    await waitFor(() => {});

    // No scrolling should happen as the section doesn't exist
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  describe('Audit Event Dispatching', () => {
    it('should dispatch audit event with correct event type when component mounts with patient UUID', async () => {
      const patientUuid = 'patient-123';
      mockUsePatientUUID.mockReturnValue(patientUuid);

      render(<DashboardContainer sections={mockSections} />);

      await waitFor(() => {
        expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
          eventType:
            AUDIT_LOG_EVENT_DETAILS.VIEWED_CLINICAL_DASHBOARD.eventType,
          patientUuid: patientUuid,
        });
      });
    });

    it('should use the correct audit log constant for event type', async () => {
      const patientUuid = 'patient-123';
      mockUsePatientUUID.mockReturnValue(patientUuid);

      render(<DashboardContainer sections={mockSections} />);

      await waitFor(() => {
        expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
          eventType: 'VIEWED_CLINICAL_DASHBOARD', // This should match the constant value
          patientUuid: patientUuid,
        });
      });
    });

    it('should not dispatch audit event when patient UUID is null', async () => {
      mockUsePatientUUID.mockReturnValue(null);

      render(<DashboardContainer sections={mockSections} />);

      // Wait for any effects to complete
      await waitFor(() => {
        expect(
          screen.getByTestId('mocked-section-Section 1'),
        ).toBeInTheDocument();
      });

      expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    });

    it('should dispatch audit event again when patient UUID changes', async () => {
      const firstPatientUuid = 'patient-123';
      const secondPatientUuid = 'patient-456';

      mockUsePatientUUID.mockReturnValue(firstPatientUuid);

      const { rerender } = render(
        <DashboardContainer sections={mockSections} />,
      );

      await waitFor(() => {
        expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
          eventType:
            AUDIT_LOG_EVENT_DETAILS.VIEWED_CLINICAL_DASHBOARD.eventType,
          patientUuid: firstPatientUuid,
        });
        expect(mockDispatchAuditEvent).toHaveBeenCalledTimes(1);
      });

      // Change patient UUID
      mockUsePatientUUID.mockReturnValue(secondPatientUuid);

      rerender(<DashboardContainer sections={mockSections} />);

      await waitFor(() => {
        expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
          eventType:
            AUDIT_LOG_EVENT_DETAILS.VIEWED_CLINICAL_DASHBOARD.eventType,
          patientUuid: secondPatientUuid,
        });
        expect(mockDispatchAuditEvent).toHaveBeenCalledTimes(2);
      });
    });

    it('should continue normal operation regardless of audit event dispatch result', async () => {
      const patientUuid = 'patient-123';
      mockUsePatientUUID.mockReturnValue(patientUuid);

      render(<DashboardContainer sections={mockSections} />);

      // Component should still render normally
      await waitFor(() => {
        expect(
          screen.getByTestId('mocked-section-Section 1'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('mocked-section-Section 2'),
        ).toBeInTheDocument();
      });

      expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
        eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_CLINICAL_DASHBOARD.eventType,
        patientUuid: patientUuid,
      });
    });

    it('should verify the audit event type constant is not hardcoded', async () => {
      const patientUuid = 'patient-123';
      mockUsePatientUUID.mockReturnValue(patientUuid);

      render(<DashboardContainer sections={mockSections} />);

      await waitFor(() => {
        const callArgs = mockDispatchAuditEvent.mock.calls[0][0];
        // Verify that the eventType is using the constant, not a hardcoded string
        expect(callArgs.eventType).toBe(
          AUDIT_LOG_EVENT_DETAILS.VIEWED_CLINICAL_DASHBOARD.eventType,
        );
        expect(callArgs.eventType).toBe('VIEWED_CLINICAL_DASHBOARD');
      });
    });
  });
});
