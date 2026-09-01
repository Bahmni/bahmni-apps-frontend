import {
  getFormattedError,
  notificationService,
  renderAsHtml,
} from '@bahmni/services';
import { categoryPickers } from '../categoryPickers/prescriptionEncounterPicker';
import type { PrintOption } from '../categoryPickers/types';
import {
  categoryPickerHandler,
  directPrintHandler,
  getHandlerFor,
  printTemplate,
} from '../printOptionHandlers';
import { printViaIframe } from '../printViaIframe';

jest.mock('@bahmni/services', () => ({
  renderAsHtml: jest.fn(),
  getUserPreferredLocale: jest.fn().mockReturnValue('en'),
  notificationService: { showError: jest.fn() },
  getFormattedError: jest
    .fn()
    .mockReturnValue({ title: 'Print Error', message: 'Failed to print' }),
}));

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

  it('returns directPrintHandler for an unrecognized category', () => {
    expect(getHandlerFor({ ...option, category: 'UNKNOWN' as never })).toBe(
      directPrintHandler,
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

  it('shows an error notification and still resets setIsPrinting on failure', async () => {
    mockRenderAsHtml.mockRejectedValue(new Error('boom'));

    await printTemplate(option, {}, { setIsPrinting });

    expect(getFormattedError).toHaveBeenCalled();
    expect(notificationService.showError).toHaveBeenCalledWith(
      'Print Error',
      'Failed to print',
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
