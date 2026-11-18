import {
  getUserPreferredLocale,
  notificationService,
  renderAsHtml,
} from '@bahmni/services';
import { getI18n } from 'react-i18next';
import { categoryPickers } from './categoryPickers/types';
import type { CategoryPicker, PrintOption } from './categoryPickers/types';
import { printViaIframe } from './printViaIframe';

export interface PrintTemplateContext {
  renderData?: Record<string, unknown>;
  getRenderData?: (templateId: string) => Promise<Record<string, unknown>>;
  setIsPrinting: (isPrinting: boolean) => void;
}

export interface PrintOptionHandlerContext extends PrintTemplateContext {
  renderContext: Record<string, string>;
  openPicker: (picker: CategoryPicker<unknown>, option: PrintOption) => void;
}

export interface PrintOptionHandler {
  trigger: (option: PrintOption, ctx: PrintOptionHandlerContext) => void;
}

// Translates through the i18n instance the app initialised and `useTranslation` is bound to.
// A bare `import i18next from 'i18next'` is bundled into this package as a separate copy that
// is never initialised, so in the built app it returned empty text and the error toast showed
// no title or message. Falls back to the key if no instance has been set up.
const translate = (key: string): string => getI18n()?.t(key) ?? key;

const HTTP_BAD_REQUEST = 400;

// The template service reports a request it cannot fulfil as a 400 with an explanation, for
// example "No medications prescribed for this visit". The API client keeps the original error
// as `cause`, so that explanation is shown instead of the generic text, which would tell the
// user to retry something that cannot succeed. Every other failure (service down, 404, 5xx)
// has no message worth showing and keeps the translated generic text.
const getValidationMessage = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) return undefined;
  const status = (error.cause as { response?: { status?: number } } | undefined)
    ?.response?.status;
  const message = error.message.trim();
  return status === HTTP_BAD_REQUEST && message ? message : undefined;
};

export async function printTemplate(
  option: PrintOption,
  renderContext: Record<string, string>,
  ctx: PrintTemplateContext,
  extraData?: Record<string, unknown>,
): Promise<void> {
  ctx.setIsPrinting(true);

  try {
    const baseData = ctx.getRenderData
      ? await ctx.getRenderData(option.templateId)
      : ctx.renderData;
    const data = extraData ? { ...baseData, ...extraData } : baseData;

    const html = await renderAsHtml({
      templateId: option.templateId,
      format: 'html',
      locale: getUserPreferredLocale(),
      context: renderContext,
      data,
    });
    await printViaIframe(html);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `Failed to print document for template ${option.templateId}`,
      error,
    );
    notificationService.showError(
      translate('PRINT_DOCUMENT_ERROR_TITLE'),
      getValidationMessage(error) ?? translate('PRINT_DOCUMENT_ERROR_MESSAGE'),
    );
  } finally {
    ctx.setIsPrinting(false);
  }
}

export const directPrintHandler: PrintOptionHandler = {
  trigger: (option, ctx) => void printTemplate(option, ctx.renderContext, ctx),
};

export const categoryPickerHandler = (
  picker: CategoryPicker<unknown>,
): PrintOptionHandler => ({
  trigger: (option, ctx) => ctx.openPicker(picker, option),
});

const unrecognizedCategoryHandler = (category: string): PrintOptionHandler => ({
  trigger: () =>
    notificationService.showError(
      'Print Error',
      `Unrecognized print category: ${category}`,
    ),
});

export function getHandlerFor(option: PrintOption): PrintOptionHandler {
  if (!option.category) return directPrintHandler;

  const picker = categoryPickers[option.category];
  return picker
    ? categoryPickerHandler(picker)
    : unrecognizedCategoryHandler(option.category);
}
