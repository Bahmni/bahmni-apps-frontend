import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteServiceModal from '../components/DeleteServiceModal';

describe('DeleteServiceModal', () => {
  const defaultProps = {
    serviceName: 'General Medicine OPD Consultation',
    isDeleting: false,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with the correct heading and body', () => {
    render(<DeleteServiceModal {...defaultProps} />);
    expect(screen.getByText('Delete Service')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to delete General Medicine OPD Consultation service?',
      ),
    ).toBeInTheDocument();
  });

  it.each([
    {
      scenario: 'onConfirm when the Delete button is clicked',
      expectedActionLabel: 'Delete',
      expectedEvent: defaultProps.onConfirm,
    },
    {
      scenario: 'onCancel when the Cancel button is clicked',
      expectedActionLabel: 'Cancel',
      expectedEvent: defaultProps.onCancel,
    },
  ])(
    'should call $scenario',
    async ({ expectedActionLabel, expectedEvent }) => {
      render(<DeleteServiceModal {...defaultProps} />);
      await userEvent.click(screen.getByText(expectedActionLabel));
      expect(expectedEvent).toHaveBeenCalledTimes(1);
    },
  );

  it('should disable the Delete button when isDeleting is true', () => {
    render(<DeleteServiceModal {...defaultProps} isDeleting />);
    expect(screen.getByText('Delete').closest('button')).toBeDisabled();
  });
});
