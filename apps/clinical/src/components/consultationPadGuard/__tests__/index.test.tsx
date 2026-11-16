import { dispatchEocLocked } from '@bahmni/services';
import { act, render, screen } from '@testing-library/react';
import ConsultationPadContainer from '../../consultationPadContainer';
import ConsultationPadGuard from '../index';

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

jest.mock('../../consultationPadContainer', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="consultation-pad-container" />),
}));

const mockedContainer = ConsultationPadContainer as unknown as jest.Mock;

const props = {
  encounterSessionStartContext: {} as never,
  onClose: jest.fn(),
};

describe('ConsultationPadGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render consultation pad when the EoC is not in terminal state', () => {
    render(<ConsultationPadGuard {...props} />);

    expect(
      screen.getByTestId('consultation-pad-container'),
    ).toBeInTheDocument();
    expect(mockedContainer.mock.calls[0][0]).toEqual(
      expect.objectContaining({ onClose: props.onClose }),
    );
    expect(
      screen.queryByTestId('consultation-pad-guard-blocked'),
    ).not.toBeInTheDocument();
  });

  it('should show the locked EoC message when the EoC is in a terminal state', () => {
    render(<ConsultationPadGuard {...props} />);

    act(() => dispatchEocLocked());

    expect(screen.getByText('EOC_LOCKED_TITLE')).toBeInTheDocument();
    expect(screen.getByText('EOC_LOCKED_MESSAGE_1')).toBeInTheDocument();
    expect(screen.getByText('EOC_LOCKED_MESSAGE_2')).toBeInTheDocument();
    expect(
      screen.queryByTestId('consultation-pad-container'),
    ).not.toBeInTheDocument();
  });
});
