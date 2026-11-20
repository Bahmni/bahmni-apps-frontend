import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsultationPadLock from '../ConsultationPadLock';

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  ActionArea: ({
    title,
    content,
    primaryButtonText,
    primaryButtonKind,
    onPrimaryButtonClick,
  }: any) => (
    <div data-testid="action-area">
      <span>{title}</span>
      <div>{content}</div>
      <button
        data-testid="primary-button"
        data-kind={primaryButtonKind}
        onClick={onPrimaryButtonClick}
      >
        {primaryButtonText}
      </button>
    </div>
  ),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../../hooks/useActionAreaExpandProps', () => ({
  useActionAreaExpandProps: () => ({}),
}));

describe('ConsultationPadLock', () => {
  it('should show the unavailable title and message', () => {
    render(<ConsultationPadLock onClose={jest.fn()} />);

    expect(screen.getByText('EOC_LOCKED_TITLE')).toBeInTheDocument();
    expect(screen.getByText('EOC_LOCKED_MESSAGE')).toBeInTheDocument();
  });

  it('should render Cancel in the secondary style and close the pad when clicked', async () => {
    const onClose = jest.fn();
    render(<ConsultationPadLock onClose={onClose} />);

    const cancel = screen.getByTestId('primary-button');
    expect(cancel).toHaveAttribute('data-kind', 'secondary');

    await userEvent.click(cancel);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
