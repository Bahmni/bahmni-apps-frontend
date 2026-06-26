import { notificationService, renderAsHtml } from '@bahmni/services';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
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
}));

jest.mock('../printViaIframe', () => ({
  printViaIframe: jest.fn().mockResolvedValue(undefined),
}));

const mockRenderAsHtml = renderAsHtml as jest.Mock;
const mockPrintViaIframe = printViaIframe as jest.Mock;

const singleOption = [
  { translationKey: 'PRINT_SUMMARY', templateId: 'summary' },
];
const multipleOptions = [
  { translationKey: 'PRINT_SUMMARY', templateId: 'summary' },
  { translationKey: 'PRINT_PRESCRIPTION', templateId: 'prescription' },
];
const renderContext = { patientUuid: 'abc-123' };

beforeEach(() => {
  jest.clearAllMocks();
  mockRenderAsHtml.mockResolvedValue('<html><body>Print</body></html>');
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
});
