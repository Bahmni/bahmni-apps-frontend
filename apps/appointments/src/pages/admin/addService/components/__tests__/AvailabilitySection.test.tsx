import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DAYS_OF_WEEK } from '../../constants';
import { useAddServiceStore } from '../../stores';
import AvailabilitySection from '../AvailabilitySection';
import { defaultRow } from './__mocks__/AvailabilitySectionMocks';

jest.mock('../../stores', () => ({
  useAddServiceStore: jest.fn(),
}));

const ROW_ID = 'row-1';

const mockUpdateAvailabilityRow = jest.fn();
const mockToggleDayOfWeek = jest.fn();
const mockAddAvailabilityRow = jest.fn();
const mockRemoveAvailabilityRow = jest.fn();

const defaultStoreState = {
  availabilityRows: [defaultRow],
  updateAvailabilityRow: mockUpdateAvailabilityRow,
  toggleDayOfWeek: mockToggleDayOfWeek,
  addAvailabilityRow: mockAddAvailabilityRow,
  removeAvailabilityRow: mockRemoveAvailabilityRow,
};

describe('ServiceAvailabilitySection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAddServiceStore).mockReturnValue(defaultStoreState);
  });

  it('should render section title and availability table', () => {
    render(<AvailabilitySection />);

    expect(
      screen.getByTestId('add-appointment-availability-section-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('Service Availability')).toBeInTheDocument();
    expect(
      screen.getByTestId('service-availability-table-test-id'),
    ).toBeInTheDocument();
  });

  it('should render all table column headers', () => {
    render(<AvailabilitySection />);

    expect(screen.getByText('Start Time')).toBeInTheDocument();
    expect(screen.getByText('End Time')).toBeInTheDocument();
    expect(screen.getByText('Max Load')).toBeInTheDocument();
    expect(screen.getByText('Days Of The Week')).toBeInTheDocument();
  });

  it('should render Add Row button', () => {
    render(<AvailabilitySection />);

    expect(
      screen.getByTestId('add-availability-row-btn-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('should render start time, end time, days of week, and remove button for each row', () => {
    render(<AvailabilitySection />);

    expect(
      screen.getByTestId(`start-time-${ROW_ID}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`end-time-${ROW_ID}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`days-of-week-${ROW_ID}-test-id`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `remove-availability-service-row-${ROW_ID}-btn-test-id`,
      ),
    ).toBeInTheDocument();
  });

  it('should render a button for each day of the week', () => {
    render(<AvailabilitySection />);

    DAYS_OF_WEEK.forEach((day) => {
      expect(
        screen.getByTestId(`days-of-week-${ROW_ID}-${day}-btn-test-id`),
      ).toBeInTheDocument();
    });
  });

  it.each([
    {
      scenario: 'updateAvailabilityRow when start time changes',
      testId: `start-time-${ROW_ID}-test-id`,
      inputValue: '09:00',
      expectedArgs: [ROW_ID, 'startTime', '09:00'],
    },
    {
      scenario: 'updateAvailabilityRow when end time changes',
      testId: `end-time-${ROW_ID}-test-id`,
      inputValue: '10:00',
      expectedArgs: [ROW_ID, 'endTime', '10:00'],
    },
  ])('should call $scenario', ({ testId, inputValue, expectedArgs }) => {
    render(<AvailabilitySection />);

    fireEvent.change(screen.getByTestId(testId), {
      target: { value: inputValue },
    });

    expect(mockUpdateAvailabilityRow).toHaveBeenCalledWith(...expectedArgs);
  });

  it('should call updateAvailabilityRow with a Number when max load changes', () => {
    render(<AvailabilitySection />);

    fireEvent.change(screen.getByTestId(`max-load-${ROW_ID}-btn-test-id`), {
      target: { value: '5' },
    });

    expect(mockUpdateAvailabilityRow).toHaveBeenCalledWith(
      ROW_ID,
      'maxLoad',
      5,
    );
  });

  it('should call toggleDayOfWeek when a day button is clicked', async () => {
    render(<AvailabilitySection />);

    await userEvent.click(
      screen.getByTestId(`days-of-week-${ROW_ID}-MONDAY-btn-test-id`),
    );

    expect(mockToggleDayOfWeek).toHaveBeenCalledWith(ROW_ID, 'MONDAY');
  });

  it('should call removeAvailabilityRow when the remove button is clicked', async () => {
    render(<AvailabilitySection />);

    await userEvent.click(
      screen.getByTestId(
        `remove-availability-service-row-${ROW_ID}-btn-test-id`,
      ),
    );

    expect(mockRemoveAvailabilityRow).toHaveBeenCalledWith(ROW_ID);
  });

  it('should call addAvailabilityRow when the Add Row button is clicked', async () => {
    render(<AvailabilitySection />);

    await userEvent.click(
      screen.getByTestId('add-availability-row-btn-test-id'),
    );

    expect(mockAddAvailabilityRow).toHaveBeenCalled();
  });

  it.each([
    {
      scenario: 'startTime error is set',
      rowOverride: {
        errors: {
          startTime: 'ADMIN_ADD_SERVICE_VALIDATION_START_TIME_REQUIRED',
        },
      },
      expectedText: 'Start time is required',
    },
    {
      scenario: 'endTime required error is set',
      rowOverride: {
        errors: { endTime: 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_REQUIRED' },
      },
      expectedText: 'End time is required',
    },
    {
      scenario: 'endTime after start error is set',
      rowOverride: {
        errors: {
          endTime: 'ADMIN_ADD_SERVICE_VALIDATION_END_TIME_AFTER_START',
        },
      },
      expectedText: 'End time must be after start time',
    },
    {
      scenario: 'daysOfWeek error is set',
      rowOverride: {
        errors: {
          daysOfWeek: 'ADMIN_ADD_SERVICE_VALIDATION_DAYS_OF_WEEK_REQUIRED',
        },
      },
      expectedText: 'At least one day must be selected',
    },
    {
      scenario: 'overlap error is set',
      rowOverride: {
        errors: { overlap: 'ADMIN_ADD_SERVICE_VALIDATION_OVERLAP' },
      },
      expectedText: 'This availability overlaps with another row',
    },
  ])(
    'should display validation error text when $scenario',
    ({ rowOverride, expectedText }) => {
      jest.mocked(useAddServiceStore).mockReturnValue({
        ...defaultStoreState,
        availabilityRows: [{ ...defaultRow, ...rowOverride }],
      });

      render(<AvailabilitySection />);

      expect(screen.getByText(expectedText)).toBeInTheDocument();
    },
  );

  it('should not render overlap error when overlap error is not set', () => {
    render(<AvailabilitySection />);

    expect(
      screen.queryByTestId(`overlap-${ROW_ID}-error-test-id`),
    ).not.toBeInTheDocument();
  });
});
