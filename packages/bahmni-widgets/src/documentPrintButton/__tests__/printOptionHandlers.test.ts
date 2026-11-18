import { notificationService, renderAsHtml } from '@bahmni/services';
import { AxiosError } from 'axios';
import { categoryPickers } from '../categoryPickers/types';
import type { PrintOption } from '../categoryPickers/types';
import {
  categoryPickerHandler,
  directPrintHandler,
  getHandlerFor,
  printTemplate,
} from '../printOptionHandlers';
import { printViaIframe } from '../printViaIframe';

// The shared error and translation helpers run for real: the widget's behaviour depends on
// them. With no i18n instance set up, translate() falls back to the key.
jest.mock('@bahmni/services', () => {
  const actual = jest.requireActual('@bahmni/services');
  return {
    renderAsHtml: jest.fn(),
    getUserPreferredLocale: jest.fn().mockReturnValue('en'),
    notificationService: { showError: jest.fn() },
    getValidationMessage: actual.getValidationMessage,
    translate: actual.translate,
  };
});

jest.mock('../printViaIframe', () => ({
  printViaIframe: jest.fn().mockResolvedValue(undefined),
}));

const mockRenderAsHtml = renderAsHtml as jest.Mock;
const mockPrintViaIframe = printViaIframe as jest.Mock;

const option: PrintOption = { translationKey: 'PRINT_X', templateId: 'tpl-1' };
const categorizedOption: PrintOption = {
  translationKey: 'PRINT_Y',
  templateId: 'tpl-2',
  category: 'PRESCRIPTION',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRenderAsHtml.mockResolvedValue('<html/>');
});

describe('getHandlerFor', () => {
  it('returns directPrintHandler for an option with no category', () => {
    expect(getHandlerFor(option)).toBe(directPrintHandler);
  });

  it('shows an error notification, not directPrintHandler, for an unrecognized category', () => {
    const handler = getHandlerFor({ ...option, category: 'UNKNOWN' });

    expect(handler).not.toBe(directPrintHandler);
    handler.trigger(
      { ...option, category: 'UNKNOWN' },
      { renderContext: {}, setIsPrinting: jest.fn(), openPicker: jest.fn() },
    );

    expect(notificationService.showError).toHaveBeenCalledWith(
      'Print Error',
      'Unrecognized print category: UNKNOWN',
    );
  });

  it('returns a picker handler (not directPrintHandler) for a recognized category', () => {
    const openPicker = jest.fn();
    const handler = getHandlerFor(categorizedOption);

    expect(handler).not.toBe(directPrintHandler);
    handler.trigger(categorizedOption, {
      renderContext: {},
      setIsPrinting: jest.fn(),
      openPicker,
    });

    expect(openPicker).toHaveBeenCalledWith(
      categoryPickers.PRESCRIPTION,
      categorizedOption,
    );
    expect(mockRenderAsHtml).not.toHaveBeenCalled();
  });
});

describe('directPrintHandler.trigger / printTemplate', () => {
  const setIsPrinting = jest.fn();

  it('calls renderAsHtml then printViaIframe with the render context', async () => {
    directPrintHandler.trigger(option, {
      renderContext: { patientUUID: 'p-1' },
      setIsPrinting,
      openPicker: jest.fn(),
    });

    await waitForAsync();

    expect(mockRenderAsHtml).toHaveBeenCalledWith({
      templateId: 'tpl-1',
      format: 'html',
      locale: 'en',
      context: { patientUUID: 'p-1' },
      data: undefined,
    });
    expect(mockPrintViaIframe).toHaveBeenCalledWith('<html/>');
  });

  it('toggles setIsPrinting(true) then setIsPrinting(false)', async () => {
    await printTemplate(option, {}, { setIsPrinting });
    expect(setIsPrinting.mock.calls).toEqual([[true], [false]]);
  });

  it('resolves data via getRenderData when provided, else falls back to renderData', async () => {
    const getRenderData = jest.fn().mockResolvedValue({ from: 'callback' });
    await printTemplate(
      option,
      {},
      {
        setIsPrinting,
        getRenderData,
        renderData: { from: 'prop' },
      },
    );

    expect(getRenderData).toHaveBeenCalledWith('tpl-1');
    expect(mockRenderAsHtml).toHaveBeenCalledWith(
      expect.objectContaining({ data: { from: 'callback' } }),
    );
  });

  it('shows a translated error notification and still resets setIsPrinting on failure', async () => {
    mockRenderAsHtml.mockRejectedValue(new Error('boom'));

    await printTemplate(option, {}, { setIsPrinting });

    expect(notificationService.showError).toHaveBeenCalledWith(
      'PRINT_DOCUMENT_ERROR_TITLE',
      'PRINT_DOCUMENT_ERROR_MESSAGE',
    );
    expect(setIsPrinting).toHaveBeenLastCalledWith(false);
  });

  it('logs the original error for debugging without showing it to the user', async () => {
    const error = new Error('template missing');
    mockRenderAsHtml.mockRejectedValue(error);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await printTemplate(option, {}, { setIsPrinting });

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to print document for template %s',
      'tpl-1',
      error,
    );
    expect(notificationService.showError).toHaveBeenCalledWith(
      'PRINT_DOCUMENT_ERROR_TITLE',
      'PRINT_DOCUMENT_ERROR_MESSAGE',
    );
    consoleError.mockRestore();
  });

  describe('explanation from the template service', () => {
    // Mirrors the API client: an Error carrying the formatted text, with the original
    // Axios error as its cause.
    const failWith = (message: string, status?: number, data?: unknown) =>
      new Error(message, {
        cause:
          status === undefined
            ? undefined
            : new AxiosError(
                'Request failed',
                undefined,
                undefined,
                undefined,
                {
                  status,
                  data,
                  statusText: '',
                  headers: {},
                  config: {} as never,
                },
              ),
      });

    let consoleError: jest.SpyInstance;

    beforeEach(() => {
      consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    it('shows the explanation when the service rejects the request with a 400', async () => {
      mockRenderAsHtml.mockRejectedValue(
        failWith('wrapper text', 400, {
          message: 'No medications prescribed for this visit',
        }),
      );

      await printTemplate(option, {}, { setIsPrinting });

      expect(notificationService.showError).toHaveBeenCalledWith(
        'PRINT_DOCUMENT_ERROR_TITLE',
        'No medications prescribed for this visit',
      );
      expect(mockPrintViaIframe).not.toHaveBeenCalled();
      expect(setIsPrinting).toHaveBeenLastCalledWith(false);
    });

    it.each([404, 500, 503])(
      'keeps the generic message for a %s response',
      async (status) => {
        mockRenderAsHtml.mockRejectedValue(
          failWith('The server encountered an error.', status),
        );

        await printTemplate(option, {}, { setIsPrinting });

        expect(notificationService.showError).toHaveBeenCalledWith(
          'PRINT_DOCUMENT_ERROR_TITLE',
          'PRINT_DOCUMENT_ERROR_MESSAGE',
        );
      },
    );

    it('keeps the generic message when the service cannot be reached', async () => {
      mockRenderAsHtml.mockRejectedValue(
        failWith('Unable to connect to the server.'),
      );

      await printTemplate(option, {}, { setIsPrinting });

      expect(notificationService.showError).toHaveBeenCalledWith(
        'PRINT_DOCUMENT_ERROR_TITLE',
        'PRINT_DOCUMENT_ERROR_MESSAGE',
      );
    });

    it.each([
      ['a string cause', 'some string'],
      ['a null cause', null],
      ['a number cause', 42],
      ['a non-Axios object cause', { response: { status: 400 } }],
    ])(
      'keeps the generic message and does not throw for %s',
      async (_label, cause) => {
        mockRenderAsHtml.mockRejectedValue(new Error('boom', { cause }));

        await expect(
          printTemplate(option, {}, { setIsPrinting }),
        ).resolves.toBeUndefined();

        expect(notificationService.showError).toHaveBeenCalledWith(
          'PRINT_DOCUMENT_ERROR_TITLE',
          'PRINT_DOCUMENT_ERROR_MESSAGE',
        );
        expect(setIsPrinting).toHaveBeenLastCalledWith(false);
      },
    );

    it('keeps the generic message for a rejection that is not an Error', async () => {
      mockRenderAsHtml.mockRejectedValue('plain string rejection');

      await printTemplate(option, {}, { setIsPrinting });

      expect(notificationService.showError).toHaveBeenCalledWith(
        'PRINT_DOCUMENT_ERROR_TITLE',
        'PRINT_DOCUMENT_ERROR_MESSAGE',
      );
    });
  });

  it('logs with a constant format string so a template id cannot inject format specifiers', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const error = new Error('boom');
    mockRenderAsHtml.mockRejectedValue(error);

    await printTemplate(
      { ...option, templateId: 'evil-%s-%d-%o' },
      {},
      { setIsPrinting },
    );

    const [format, templateId, loggedError] = consoleError.mock.calls[0];
    expect(format).toBe('Failed to print document for template %s');
    expect(templateId).toBe('evil-%s-%d-%o');
    expect(loggedError).toBe(error);
    consoleError.mockRestore();
  });

  it('shows the error and resets setIsPrinting when printViaIframe rejects', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockPrintViaIframe.mockRejectedValueOnce(new Error('iframe failed'));

    await printTemplate(option, {}, { setIsPrinting });

    expect(mockRenderAsHtml).toHaveBeenCalledTimes(1);
    expect(notificationService.showError).toHaveBeenCalledWith(
      'PRINT_DOCUMENT_ERROR_TITLE',
      'PRINT_DOCUMENT_ERROR_MESSAGE',
    );
    expect(setIsPrinting.mock.calls).toEqual([[true], [false]]);
    consoleError.mockRestore();
  });

  it('does not open the print dialog when rendering fails', async () => {
    mockRenderAsHtml.mockRejectedValue(new Error('template missing'));

    await printTemplate(option, {}, { setIsPrinting });

    expect(mockPrintViaIframe).not.toHaveBeenCalled();
  });

  it('shows the error, skips rendering and resets setIsPrinting when getRenderData rejects', async () => {
    const getRenderData = jest.fn().mockRejectedValue(new Error('data failed'));

    await printTemplate(option, {}, { setIsPrinting, getRenderData });

    expect(mockRenderAsHtml).not.toHaveBeenCalled();
    expect(mockPrintViaIframe).not.toHaveBeenCalled();
    expect(notificationService.showError).toHaveBeenCalledWith(
      'PRINT_DOCUMENT_ERROR_TITLE',
      'PRINT_DOCUMENT_ERROR_MESSAGE',
    );
    expect(setIsPrinting).toHaveBeenLastCalledWith(false);
  });
});

describe('categoryPickerHandler', () => {
  it('opens the picker instead of printing', () => {
    const openPicker = jest.fn();
    const picker = categoryPickers.PRESCRIPTION!;

    categoryPickerHandler(picker).trigger(categorizedOption, {
      renderContext: {},
      setIsPrinting: jest.fn(),
      openPicker,
    });

    expect(openPicker).toHaveBeenCalledWith(picker, categorizedOption);
    expect(mockRenderAsHtml).not.toHaveBeenCalled();
  });
});

function waitForAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
