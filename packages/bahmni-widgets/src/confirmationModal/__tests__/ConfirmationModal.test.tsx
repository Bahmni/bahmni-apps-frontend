import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ConfirmationModal from '../ConfirmationModal';

// Mock Carbon Modal — render only when open so we can test visibility,
// and expose all the relevant props as data attributes / child content.
jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  Modal: ({
    open,
    modalHeading,
    children,
    primaryButtonText,
    secondaryButtonText,
    primaryButtonDisabled,
    onRequestSubmit,
    onRequestClose,
    testId,
  }: {
    open: boolean;
    modalHeading: string;
    children: React.ReactNode;
    primaryButtonText: string;
    secondaryButtonText: string;
    primaryButtonDisabled?: boolean;
    onRequestSubmit: () => void;
    onRequestClose: () => void;
    testId?: string;
  }) => {
    if (!open) return null;
    return (
      <div data-testid={testId ?? 'confirmation-modal'}>
        <h2>{modalHeading}</h2>
        <p>{children}</p>
        <button
          data-testid="modal-primary-button"
          onClick={onRequestSubmit}
          disabled={primaryButtonDisabled}
        >
          {primaryButtonText}
        </button>
        <button data-testid="modal-secondary-button" onClick={onRequestClose}>
          {secondaryButtonText}
        </button>
      </div>
    );
  },
}));

const defaultProps = {
  open: true,
  heading: 'Are you sure?',
  body: 'This action cannot be undone.',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ConfirmationModal', () => {
  it('renders modal content when open=true', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
  });

  it('does not render modal content when open=false', () => {
    render(<ConfirmationModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
  });

  it('shows heading text', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('shows body text', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(
      screen.getByText('This action cannot be undone.'),
    ).toBeInTheDocument();
  });

  it('shows confirmLabel on the primary button', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByTestId('modal-primary-button')).toHaveTextContent(
      'Confirm',
    );
  });

  it('shows cancelLabel on the secondary button', () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByTestId('modal-secondary-button')).toHaveTextContent(
      'Cancel',
    );
  });

  it('calls onConfirm when primary button is clicked', async () => {
    const onConfirm = jest.fn();
    render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByTestId('modal-primary-button'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when secondary button is clicked', async () => {
    const onCancel = jest.fn();
    render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByTestId('modal-secondary-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('primary button is disabled when isSubmitting=true', () => {
    render(<ConfirmationModal {...defaultProps} isSubmitting />);
    expect(screen.getByTestId('modal-primary-button')).toBeDisabled();
  });

  it('primary button is enabled when isSubmitting=false', () => {
    render(<ConfirmationModal {...defaultProps} isSubmitting={false} />);
    expect(screen.getByTestId('modal-primary-button')).not.toBeDisabled();
  });

  it('applies testId to the modal element', () => {
    render(
      <ConfirmationModal {...defaultProps} testId="delete-confirm-modal" />,
    );
    expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
  });
});
