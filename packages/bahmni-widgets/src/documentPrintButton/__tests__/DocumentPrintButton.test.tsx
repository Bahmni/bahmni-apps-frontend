import { notificationService, renderAsHtml } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Encounter } from 'fhir/r4';
import React from 'react';
import { useActivePractitioner } from '../../activePractitioner';
import { DocumentPrintButton } from '../DocumentPrintButton';
import { printViaIframe } from '../printViaIframe';

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  ComboButton: ({
    label,
    onClick,
    children,
    disabled,
    'data-testid': dataTestId,
  }: {
    label: string;
    onClick?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    'data-testid'?: string;
  }) => (
    <div data-testid={dataTestId}>
      <button onClick={onClick} disabled={disabled}>
        {label}
      </button>
      {children}
    </div>
  ),
  MenuItem: ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button onClick={onClick}>{label}</button>
  ),
}));

jest.mock('@bahmni/services', () => ({
  renderAsHtml: jest.fn(),
  getUserPreferredLocale: jest.fn().mockReturnValue('en'),
  notificationService: { showError: jest.fn() },
  useTranslation: () => ({ t: (key: string) => key }),
  getFormattedError: jest
    .fn()
    .mockReturnValue({ title: 'Print Error', message: 'Failed to print' }),
  getUserLoginLocation: jest.fn(() => {
    throw new Error('no login location cookie');
  }),
  getPatientEncounters: jest.fn(),
  formatDateTime: jest.fn().mockReturnValue({ formattedResult: '01-Jan-2024' }),
}));

jest.mock('../../activePractitioner', () => ({
  useActivePractitioner: jest.fn(() => ({ practitioner: null })),
}));

jest.mock('../printViaIframe', () => ({
  printViaIframe: jest.fn().mockResolvedValue(undefined),
}));

const mockRenderAsHtml = renderAsHtml as jest.Mock;
const mockPrintViaIframe = printViaIframe as jest.Mock;
const mockUseActivePractitioner = useActivePractitioner as jest.Mock;
const mockGetUserLoginLocation =
  jest.requireMock('@bahmni/services').getUserLoginLocation;
const mockGetPatientEncounters =
  jest.requireMock('@bahmni/services').getPatientEncounters;

const singleOption = [
  { translationKey: 'PRINT_SUMMARY', templateId: 'summary' },
];
const multipleOptions = [
  { translationKey: 'PRINT_SUMMARY', templateId: 'summary' },
  { translationKey: 'PRINT_PRESCRIPTION', templateId: 'prescription' },
];
const categorizedOption = [
  {
    translationKey: 'PRINT_PRESCRIPTION_BY_ENCOUNTER',
    templateId: 'prescription-encounter',
    category: 'PRESCRIPTION' as const,
  },
];
const renderContext = { patientUuid: 'abc-123', patientUUID: 'abc-123' };

const buildEncounter = (id: string, start: string): Encounter => ({
  resourceType: 'Encounter',
  id,
  status: 'finished',
  class: {},
  type: [{ text: `Consultation ${id}` }],
  period: { start },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRenderAsHtml.mockResolvedValue('<html><body>Print</body></html>');
  mockUseActivePractitioner.mockReturnValue({ practitioner: null });
  mockGetUserLoginLocation.mockImplementation(() => {
    throw new Error('no login location cookie');
  });
  mockGetPatientEncounters.mockResolvedValue([]);
});

describe('DocumentPrintButton', () => {
  describe('renders nothing', () => {
    it('when printOptions is not provided', () => {
      const { container } = render(
        <DocumentPrintButton renderContext={renderContext} />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('when printOptions is an empty array', () => {
      const { container } = render(
        <DocumentPrintButton printOptions={[]} renderContext={renderContext} />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('default (button) mode', () => {
    it('renders a button with the option label for a single option', () => {
      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
        />,
      );
      expect(screen.getByText('PRINT_SUMMARY')).toBeInTheDocument();
    });

    it('renders a ComboButton with primary action and additional options for multiple options', () => {
      render(
        <DocumentPrintButton
          printOptions={multipleOptions}
          renderContext={renderContext}
        />,
      );
      expect(screen.getByText('PRINT_SUMMARY')).toBeInTheDocument();
      expect(screen.getByText('PRINT_PRESCRIPTION')).toBeInTheDocument();
    });

    it('prints the first option when primary button is clicked with multiple options', async () => {
      render(
        <DocumentPrintButton
          printOptions={multipleOptions}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(screen.getByText('PRINT_SUMMARY'));

      await waitFor(() =>
        expect(mockRenderAsHtml).toHaveBeenCalledWith(
          expect.objectContaining({ templateId: 'summary' }),
        ),
      );
    });

    it('disables the button when disabled=true', () => {
      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
          data-testid="print-btn"
          disabled
        />,
      );
      expect(screen.getByTestId('print-btn')).toBeDisabled();
    });
  });

  describe('iconOnly mode', () => {
    it('renders an IconButton for a single option', () => {
      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
          iconOnly
          iconLabel="Print"
          data-testid="print-icon-btn"
        />,
      );
      expect(screen.getByTestId('print-icon-btn')).toBeInTheDocument();
    });

    it('renders an OverflowMenu with all options for multiple options', () => {
      render(
        <DocumentPrintButton
          printOptions={multipleOptions}
          renderContext={renderContext}
          iconOnly
          data-testid="print-overflow"
        />,
      );
      expect(screen.getByTestId('print-overflow')).toBeInTheDocument();
    });
  });

  describe('printing flow', () => {
    it('shows loading state while printing', async () => {
      let resolveHtml: (html: string) => void;
      mockRenderAsHtml.mockReturnValue(
        new Promise((resolve) => {
          resolveHtml = resolve;
        }),
      );

      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(screen.getByText('PRINT_SUMMARY'));
      expect(
        screen.getByText('PRINT_MODAL_PREPARING_DOCUMENT'),
      ).toBeInTheDocument();

      resolveHtml!('<html/>');
      await waitFor(() =>
        expect(
          screen.queryByText('PRINT_MODAL_PREPARING_DOCUMENT'),
        ).not.toBeInTheDocument(),
      );
    });

    it('calls renderAsHtml with templateId, context and locale', async () => {
      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(screen.getByText('PRINT_SUMMARY'));

      await waitFor(() =>
        expect(mockRenderAsHtml).toHaveBeenCalledWith(
          expect.objectContaining({
            templateId: 'summary',
            format: 'html',
            locale: 'en',
            context: renderContext,
          }),
        ),
      );
    });

    it('passes renderData to renderAsHtml', async () => {
      const renderData = { visitId: 'v-1' };

      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
          renderData={renderData}
        />,
      );

      await userEvent.click(screen.getByText('PRINT_SUMMARY'));

      await waitFor(() =>
        expect(mockRenderAsHtml).toHaveBeenCalledWith(
          expect.objectContaining({ data: renderData }),
        ),
      );
    });

    it('calls getRenderData with templateId and passes result to renderAsHtml', async () => {
      const data = { patientId: 'p-1' };
      const getRenderData = jest.fn().mockReturnValue(data);

      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
          getRenderData={getRenderData}
        />,
      );

      await userEvent.click(screen.getByText('PRINT_SUMMARY'));

      expect(getRenderData).toHaveBeenCalledWith('summary');
      await waitFor(() =>
        expect(mockRenderAsHtml).toHaveBeenCalledWith(
          expect.objectContaining({ data }),
        ),
      );
    });

    it('calls printViaIframe with the rendered HTML', async () => {
      const html = '<html><body>Report</body></html>';
      mockRenderAsHtml.mockResolvedValue(html);

      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(screen.getByText('PRINT_SUMMARY'));

      await waitFor(() =>
        expect(mockPrintViaIframe).toHaveBeenCalledWith(html),
      );
    });

    it('prints via menu item click for the second option', async () => {
      render(
        <DocumentPrintButton
          printOptions={multipleOptions}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(screen.getByText('PRINT_PRESCRIPTION'));

      await waitFor(() =>
        expect(mockRenderAsHtml).toHaveBeenCalledWith(
          expect.objectContaining({ templateId: 'prescription' }),
        ),
      );
    });

    it('prints via OverflowMenuItem click in iconOnly mode', async () => {
      render(
        <DocumentPrintButton
          printOptions={multipleOptions}
          renderContext={renderContext}
          iconOnly
          data-testid="print-overflow"
        />,
      );

      await userEvent.click(screen.getByTestId('print-overflow'));
      await userEvent.click(screen.getByText('PRINT_PRESCRIPTION'));

      await waitFor(() =>
        expect(mockRenderAsHtml).toHaveBeenCalledWith(
          expect.objectContaining({ templateId: 'prescription' }),
        ),
      );
    });

    it('shows an error notification when printing fails', async () => {
      mockRenderAsHtml.mockRejectedValue(new Error('Network error'));

      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(screen.getByText('PRINT_SUMMARY'));

      await waitFor(() =>
        expect(notificationService.showError).toHaveBeenCalledWith(
          'Print Error',
          'Failed to print',
        ),
      );
    });
  });

  describe('ambient context enrichment', () => {
    it('merges providerUuid and locationUuid into the render context when resolvable', async () => {
      mockUseActivePractitioner.mockReturnValue({
        practitioner: { uuid: 'prov-1' },
      });
      mockGetUserLoginLocation.mockReturnValue({
        uuid: 'loc-1',
        name: 'Location 1',
      });

      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(screen.getByText('PRINT_SUMMARY'));

      await waitFor(() =>
        expect(mockRenderAsHtml).toHaveBeenCalledWith(
          expect.objectContaining({
            context: {
              ...renderContext,
              providerUuid: 'prov-1',
              locationUuid: 'loc-1',
            },
          }),
        ),
      );
    });

    it('omits providerUuid/locationUuid when they cannot be resolved', async () => {
      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(screen.getByText('PRINT_SUMMARY'));

      await waitFor(() =>
        expect(mockRenderAsHtml).toHaveBeenCalledWith(
          expect.objectContaining({ context: renderContext }),
        ),
      );
    });
  });

  describe('category picker flow (PRESCRIPTION)', () => {
    it('opens the picker instead of printing immediately', async () => {
      mockGetPatientEncounters.mockResolvedValue([
        buildEncounter('enc-1', '2024-01-01T10:00:00Z'),
      ]);

      render(
        <DocumentPrintButton
          printOptions={categorizedOption}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(
        screen.getByText('PRINT_PRESCRIPTION_BY_ENCOUNTER'),
      );

      expect(mockRenderAsHtml).not.toHaveBeenCalled();
      expect(
        await screen.findByTestId('category-selection-modal'),
      ).toBeInTheDocument();
      expect(await screen.findByText('Consultation enc-1')).toBeInTheDocument();
    });

    it('shows the empty-state message when there are no encounters', async () => {
      mockGetPatientEncounters.mockResolvedValue([]);

      render(
        <DocumentPrintButton
          printOptions={categorizedOption}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(
        screen.getByText('PRINT_PRESCRIPTION_BY_ENCOUNTER'),
      );

      expect(
        await screen.findByText('NO_ENCOUNTERS_FOUND'),
      ).toBeInTheDocument();
    });

    it('prints with encounterUuid merged into the context when an encounter is selected', async () => {
      const encounter = buildEncounter('enc-1', '2024-01-01T10:00:00Z');
      mockGetPatientEncounters.mockResolvedValue([encounter]);

      render(
        <DocumentPrintButton
          printOptions={categorizedOption}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(
        screen.getByText('PRINT_PRESCRIPTION_BY_ENCOUNTER'),
      );
      await userEvent.click(await screen.findByText('Consultation enc-1'));

      await waitFor(() =>
        expect(mockRenderAsHtml).toHaveBeenCalledWith(
          expect.objectContaining({
            templateId: 'prescription-encounter',
            context: { ...renderContext, encounterUuid: 'enc-1' },
            data: { encounter },
          }),
        ),
      );
    });

    it('prints nothing when the picker is cancelled', async () => {
      mockGetPatientEncounters.mockResolvedValue([
        buildEncounter('enc-1', '2024-01-01T10:00:00Z'),
      ]);

      render(
        <DocumentPrintButton
          printOptions={categorizedOption}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(
        screen.getByText('PRINT_PRESCRIPTION_BY_ENCOUNTER'),
      );
      await screen.findByTestId('category-selection-modal');
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(
        screen.queryByTestId('category-selection-modal'),
      ).not.toBeInTheDocument();
      expect(mockRenderAsHtml).not.toHaveBeenCalled();
    });

    it('does not open the picker for a non-categorized option', async () => {
      render(
        <DocumentPrintButton
          printOptions={singleOption}
          renderContext={renderContext}
        />,
      );

      await userEvent.click(screen.getByText('PRINT_SUMMARY'));

      expect(
        screen.queryByTestId('category-selection-modal'),
      ).not.toBeInTheDocument();
      await waitFor(() => expect(mockRenderAsHtml).toHaveBeenCalled());
    });
  });
});
