import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import ObsDisplay, { ObsGroup } from '../ObsDisplay';

expect.extend(toHaveNoViolations);

// Mock the CSS modules
jest.mock('../styles/ObsDisplay.module.scss', () => ({
  obsDisplayContainer: 'obsDisplayContainer',
  dateHeader: 'dateHeader',
  formGroup: 'formGroup',
  formHeader: 'formHeader',
  obsGroupContainer: 'obsGroupContainer',
  nestedAccordionItem: 'nestedAccordionItem',
  childrenContainer: 'childrenContainer',
  childRow: 'childRow',
  childLabel: 'childLabel',
  obsHeader: 'obsHeader',
  obsConceptName: 'obsConceptName',
  obsValue: 'obsValue',
  obsUnit: 'obsUnit',
  recordedByText: 'recordedByText',
  mediaPreview: 'mediaPreview',
  mediaContainer: 'mediaContainer',
  clickableMedia: 'clickableMedia',
}));

const mockSingleObs: ObsGroup = {
  id: 'obs-1',
  conceptName: 'Temperature',
  value: '98.6',
  unit: '°F',
  date: '01 Jan 2024, 10:00 AM',
  isParent: false,
  recordedBy: 'Dr. Smith',
  formName: 'Vitals',
  children: [],
};

const mockObsGroup: ObsGroup = {
  id: 'obs-group-1',
  conceptName: 'Blood Pressure',
  value: '',
  date: '01 Jan 2024, 10:00 AM',
  isParent: true,
  recordedBy: 'Dr. Smith',
  formName: 'Vitals',
  children: [
    {
      id: 'child-1',
      conceptName: 'Systolic',
      value: '120',
      unit: 'mmHg',
      date: '01 Jan 2024, 10:00 AM',
      isParent: false,
      children: [],
    },
    {
      id: 'child-2',
      conceptName: 'Diastolic',
      value: '80',
      unit: 'mmHg',
      date: '01 Jan 2024, 10:00 AM',
      isParent: false,
      children: [],
    },
  ],
};

const mockImageObs: ObsGroup = {
  id: 'obs-image-1',
  conceptName: 'X-Ray Image',
  value: '123/456-xray-image.jpg',
  date: '01 Jan 2024, 10:00 AM',
  isParent: false,
  formName: 'Radiology',
  children: [],
};

const mockVideoObs: ObsGroup = {
  id: 'obs-video-1',
  conceptName: 'Procedure Video',
  value: '123/456-procedure-video.mp4',
  date: '01 Jan 2024, 10:00 AM',
  isParent: false,
  formName: 'Procedures',
  children: [],
};

const mockDateObs: ObsGroup = {
  id: 'obs-date-1',
  conceptName: 'Treatment start date',
  value: '1/14/2026',
  date: '14 Jan 2026, 03:40 PM',
  isParent: false,
  formName: 'Malaria',
  children: [],
};

describe('ObsDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all observation types correctly', () => {
    const allObsTypes = [mockSingleObs, mockObsGroup, mockImageObs];
    const { container } = render(
      <ObsDisplay observations={allObsTypes} date="01 Jan 2024" isOpen />,
    );

    // Single observation
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(container.textContent).toContain('98.6');
    expect(container.textContent).toContain('°F');

    // Observation group with children (nested accordion is open by default)
    expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
    expect(screen.getByText('Systolic')).toBeInTheDocument();
    expect(container.textContent).toContain('120');
    expect(screen.getByText('Diastolic')).toBeInTheDocument();
    expect(container.textContent).toContain('80');

    // Image observation
    const image = screen.getByRole('img', { name: 'X-Ray Image' });
    expect(image).toBeInTheDocument();

    // Recorded by information
    expect(container.textContent).toContain('Recorded by');
    expect(container.textContent).toContain('Dr. Smith');

    // Form grouping
    expect(screen.getByText('Vitals')).toBeInTheDocument();
    expect(screen.getByText('Radiology')).toBeInTheDocument();
  });

  test('opens modal when media is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ObsDisplay observations={[mockImageObs]} date="01 Jan 2024" isOpen />,
    );

    const image = screen.getByRole('img', { name: 'X-Ray Image' });
    await user.click(image);

    const modal = document.querySelector('[role="dialog"]');
    expect(modal).toBeInTheDocument();
  });

  test('handles empty observations', () => {
    render(<ObsDisplay observations={[]} date="01 Jan 2024" />);
    expect(screen.queryByText('Temperature')).not.toBeInTheDocument();
  });

  test('renders date-type observation correctly', () => {
    const { container } = render(
      <ObsDisplay observations={[mockDateObs]} date="14 Jan 2026" isOpen />,
    );

    // Assert on the date field (concept name)
    expect(screen.getByText('Treatment start date')).toBeInTheDocument();

    // Assert on the date value
    expect(container.textContent).toContain('1/14/2026');

    // Assert on the form name
    expect(screen.getByText('Malaria')).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(
        <ObsDisplay
          observations={[mockSingleObs, mockObsGroup]}
          date="01 Jan 2024"
          isOpen
        />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Snapshot', () => {
    test('matches snapshot with single observation', () => {
      const { container } = render(
        <ObsDisplay observations={[mockSingleObs]} date="01 Jan 2024" />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot with observation group', () => {
      const { container } = render(
        <ObsDisplay observations={[mockObsGroup]} date="01 Jan 2024" />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot with image observation', () => {
      const { container } = render(
        <ObsDisplay observations={[mockImageObs]} date="01 Jan 2024" />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot with video observation', () => {
      const { container } = render(
        <ObsDisplay observations={[mockVideoObs]} date="01 Jan 2024" />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot with date observation', () => {
      const { container } = render(
        <ObsDisplay observations={[mockDateObs]} date="14 Jan 2026" />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot with multiple observations', () => {
      const multipleObs = [mockSingleObs, mockObsGroup, mockImageObs];
      const { container } = render(
        <ObsDisplay observations={multipleObs} date="01 Jan 2024" />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
