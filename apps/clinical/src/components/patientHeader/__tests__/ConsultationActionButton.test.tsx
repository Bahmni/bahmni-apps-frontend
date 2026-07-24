import { useTranslation } from '@bahmni/services';
import { useHasPrivilege } from '@bahmni/widgets';
import { render, screen, fireEvent } from '@testing-library/react';
import { dispatchConsultationStart } from '../../../events/startConsultation';
import ConsultationActionButton from '../ConsultationActionButton';
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

describe('ConsultationActionButton', () => {
  const defaultProps = {
    isActionAreaVisible: false,
    editActiveEncounter: false,
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

    it('renders button with default "New Consultation" text', () => {
      render(<ConsultationActionButton {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /CONSULTATION_ACTION_NEW/i }),
      ).toBeInTheDocument();
    });

    it('shows "Continue Consultation" text when active encounter exists', () => {
      render(
        <ConsultationActionButton {...defaultProps} editActiveEncounter />,
      );

      expect(
        screen.getByRole('button', { name: /CONSULTATION_ACTION_CONTINUE/i }),
      ).toBeInTheDocument();
    });

    it('disables button when action area is visible', () => {
      const { rerender } = render(
        <ConsultationActionButton {...defaultProps} />,
      );

      expect(
        screen.getByRole('button', { name: /CONSULTATION_ACTION_NEW/i }),
      ).not.toBeDisabled();

      rerender(
        <ConsultationActionButton {...defaultProps} isActionAreaVisible />,
      );

      expect(
        screen.getByRole('button', {
          name: /CONSULTATION_ACTION_IN_PROGRESS/i,
        }),
      ).toBeDisabled();
    });

    it('dispatches consultationStart with empty payload for new consultation', () => {
      render(<ConsultationActionButton {...defaultProps} />);

      fireEvent.click(screen.getByTestId('consultation-action-button'));

      expect(mockDispatchConsultationStart).toHaveBeenCalledWith({});
    });

    it('dispatches consultationStart with editTitle when continuing an existing encounter', () => {
      render(
        <ConsultationActionButton {...defaultProps} editActiveEncounter />,
      );

      fireEvent.click(screen.getByTestId('consultation-action-button'));

      expect(mockDispatchConsultationStart).toHaveBeenCalledWith({
        editTitle: 'CONSULTATION_ACTION_CONTINUE',
      });
    });

    it('shows skeleton when loading', () => {
      render(<ConsultationActionButton {...defaultProps} isLoading />);

      expect(
        screen.getByTestId('consultation-action-button-skeleton'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('consultation-action-button'),
      ).not.toBeInTheDocument();
    });
  });

  it('hides button when user lacks Add Encounters privilege', () => {
    mockUseHasPrivilege.mockReturnValue(false);

    render(<ConsultationActionButton {...defaultProps} />);

    expect(
      screen.queryByRole('button', {
        name: /CONSULTATION_ACTION_(NEW|CONTINUE)/i,
      }),
    ).not.toBeInTheDocument();
  });
});
