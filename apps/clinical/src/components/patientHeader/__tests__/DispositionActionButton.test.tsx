import { useTranslation, dispatchConsultationStart } from '@bahmni/services';
import { useHasPrivilege } from '@bahmni/widgets';
import { render, screen, fireEvent } from '@testing-library/react';
import { useClinicalConfig } from '../../../providers/clinicalConfig';
import DispositionActionButton from '../DispositionActionButton';
import '@testing-library/jest-dom';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  dispatchConsultationStart: jest.fn(),
}));
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useHasPrivilege: jest.fn(),
}));

jest.mock('../../../providers/clinicalConfig', () => ({
  useClinicalConfig: jest.fn(),
}));

const mockUseClinicalConfig = useClinicalConfig as jest.MockedFunction<
  typeof useClinicalConfig
>;

const configWith = (inputControls: unknown[]) =>
  ({
    clinicalConfig: { consultationPad: { inputControls } },
  }) as any;

const dispositionControl = {
  type: 'disposition',
  privileges: ['Custom Disposition Privilege'],
};

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
    mockUseClinicalConfig.mockReturnValue(configWith([dispositionControl]));
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
        action: {
          type: 'create',
          resources: [
            {
              resourceType: 'ServiceRequest',
              status: 'draft',
              intent: 'order',
              subject: {},
            },
          ],
        },
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

  it('hides button when no disposition input control is configured', () => {
    mockUseHasPrivilege.mockReturnValue(true);
    mockUseClinicalConfig.mockReturnValue(
      configWith([{ type: 'investigations' }]),
    );

    render(<DispositionActionButton {...defaultProps} />);

    expect(
      screen.queryByTestId('disposition-action-button'),
    ).not.toBeInTheDocument();
  });

  it('checks the privileges configured on the disposition control', () => {
    mockUseHasPrivilege.mockReturnValue(true);

    render(<DispositionActionButton {...defaultProps} />);

    expect(mockUseHasPrivilege).toHaveBeenCalledWith([
      'Custom Disposition Privilege',
    ]);
  });

  it('falls back to Add Encounters when the control declares no privileges', () => {
    mockUseHasPrivilege.mockReturnValue(true);
    mockUseClinicalConfig.mockReturnValue(
      configWith([{ type: 'disposition', privileges: [] }]),
    );

    render(<DispositionActionButton {...defaultProps} />);

    expect(mockUseHasPrivilege).toHaveBeenCalledWith(['Add Encounters']);
  });
});
