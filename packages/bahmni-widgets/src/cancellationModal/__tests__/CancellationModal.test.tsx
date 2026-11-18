import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CancellationModal, {
  CancellationModalProps,
} from '../CancellationModal';

const reasons = [
  { uuid: 'declined-uuid', display: 'Patient declines' },
  { uuid: 'other-uuid', display: 'Other', isNoteRequired: true },
];

const onSubmit = jest.fn();
const onClose = jest.fn();

type User = ReturnType<typeof userEvent.setup>;

const renderModal = (props: Partial<CancellationModalProps> = {}) =>
  render(
    <CancellationModal
      heading="Cancel episode of care"
      warning={{ title: 'Cancel active orders', message: 'All orders cancel' }}
      reasons={reasons}
      onSubmit={onSubmit}
      onClose={onClose}
      {...props}
    />,
  );

const chooseReason = async (user: User, name: string) => {
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByText(name));
};

const clickSubmit = (user: User) =>
  user.click(screen.getByText('CANCELLATION_MODAL_SUBMIT'));

describe('CancellationModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the heading, warning and the reasons', async () => {
    const user = userEvent.setup();
    renderModal();

    expect(screen.getByText('Cancel episode of care')).toBeInTheDocument();
    expect(screen.getByText('Cancel active orders')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByText('Patient declines')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('should highlight the reason and not submit when no reason is selected', async () => {
    const user = userEvent.setup();
    renderModal();

    await clickSubmit(user);

    expect(
      await screen.findByText('CANCELLATION_MODAL_REASON_REQUIRED'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should clear the reason error once a reason is chosen', async () => {
    const user = userEvent.setup();
    renderModal();
    await clickSubmit(user);
    expect(
      await screen.findByText('CANCELLATION_MODAL_REASON_REQUIRED'),
    ).toBeInTheDocument();

    await chooseReason(user, 'Patient declines');

    expect(
      screen.queryByText('CANCELLATION_MODAL_REASON_REQUIRED'),
    ).not.toBeInTheDocument();
  });

  it('should be able to submit without a reason when the reason is not required', async () => {
    const user = userEvent.setup();
    renderModal({ isReasonRequired: false });

    await clickSubmit(user);

    expect(onSubmit).toHaveBeenCalledWith({ reason: null, note: '' });
  });

  it('should highlight the note and not submit when the reason needs a note', async () => {
    const user = userEvent.setup();
    renderModal();
    await chooseReason(user, 'Other');

    await clickSubmit(user);

    expect(
      await screen.findByText('CANCELLATION_MODAL_NOTE_REQUIRED'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should not accept a whitespace-only note for a reason that needs one', async () => {
    const user = userEvent.setup();
    renderModal();
    await chooseReason(user, 'Other');
    await user.type(screen.getByRole('textbox'), '   ');

    await clickSubmit(user);

    expect(
      await screen.findByText('CANCELLATION_MODAL_NOTE_REQUIRED'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should submit with an empty note when the note is optional', async () => {
    const user = userEvent.setup();
    renderModal();
    await chooseReason(user, 'Patient declines');

    await clickSubmit(user);

    expect(onSubmit).toHaveBeenCalledWith({
      reason: reasons[0],
      note: '',
    });
  });

  it('should submit the trimmed note', async () => {
    const user = userEvent.setup();
    renderModal();
    await chooseReason(user, 'Other');
    await user.type(
      screen.getByRole('textbox'),
      '  Entered twice by mistake  ',
    );

    await clickSubmit(user);

    expect(onSubmit).toHaveBeenCalledWith({
      reason: reasons[1],
      note: 'Entered twice by mistake',
    });
  });

  it('should limit the note to the max length and show the counter', async () => {
    const user = userEvent.setup();
    renderModal({ noteMaxLength: 10 });

    await user.type(screen.getByRole('textbox'), 'a'.repeat(15));

    expect(screen.getByRole('textbox')).toHaveValue('a'.repeat(10));
    expect(
      screen.getByTestId('cancellation-note-counter-test-id'),
    ).toHaveTextContent('10/10');
  });

  it('should show a loader instead of the fields while submitting', () => {
    renderModal({ isSubmitting: true });

    expect(
      screen.getByTestId('cancellation-loading-test-id'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
