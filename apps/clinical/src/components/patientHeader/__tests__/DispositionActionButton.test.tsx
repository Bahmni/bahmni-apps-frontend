import { useTranslation } from '@bahmni/services';
import { useHasPrivilege } from '@bahmni/widgets';
import { render, screen, fireEvent } from '@testing-library/react';
import { dispatchConsultationStart } from '../../../events/startConsultation';
import DispositionActionButton from '../DispositionActionButton';
import '@testing-library/jest-dom';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
}));

jest.mock('../../../events/startConsultation', () => ({
  dispatchConsultationStart: jest.fn(),
}));
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useHasPrivilege: jest.fn(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockUseHasPrivilege = useHasPrivilege as jest.MockedFunction<
  typeof useHasPrivilege
>;

const mockDispatchConsultationStart =
  dispatchConsultationStart as jest.MockedFunction<
    typeof dispatchConsultationStart
  >;

describe('DispositionActionButton', () => {
  const defaultProps = {
    isActionAreaVisible: false,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslation.mockReturnValue({ t: (key: string) => key } as any);
  });

  describe('when user has Add Encounters privilege', () => {
    beforeEach(() => {
      mockUseHasPrivilege.mockReturnValue(true);
    });

    it('renders the Disposition button', () => {
      render(<DispositionActionButton {...defaultProps} />);

      expect(
        screen.getByTestId('disposition-action-button'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /DISPOSITION_ACTION_LABEL/i }),
      ).toBeInTheDocument();
    });

    it('disables button when action area is visible', () => {
      render(<DispositionActionButton {...defaultProps} isActionAreaVisible />);

      expect(screen.getByTestId('disposition-action-button')).toBeDisabled();
    });

    it('dispatches consultationStart scoped to the disposition control on click', () => {
      render(<DispositionActionButton {...defaultProps} />);

      fireEvent.click(screen.getByTestId('disposition-action-button'));

      expect(mockDispatchConsultationStart).toHaveBeenCalledWith({
        editOnly: 'disposition',
        editTitle: 'DISPOSITION_FORM_TITLE',
      });
    });

    it('shows skeleton when loading', () => {
      render(<DispositionActionButton {...defaultProps} isLoading />);

      expect(
        screen.getByTestId('disposition-action-button-skeleton'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('disposition-action-button'),
      ).not.toBeInTheDocument();
    });
  });

  it('hides button when user lacks Add Encounters privilege', () => {
    mockUseHasPrivilege.mockReturnValue(false);

    render(<DispositionActionButton {...defaultProps} />);

    expect(
      screen.queryByTestId('disposition-action-button'),
    ).not.toBeInTheDocument();
  });
});
