import {
  getFormattedError,
  getUserPreferredLocale,
  notificationService,
  renderAsHtml,
} from '@bahmni/services';
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

export async function printTemplate(
  option: PrintOption,
  renderContext: Record<string, string>,
  ctx: PrintTemplateContext,
  extraData?: Record<string, unknown>,
): Promise<void> {
  ctx.setIsPrinting(true);

  const baseData = ctx.getRenderData
    ? await ctx.getRenderData(option.templateId)
    : ctx.renderData;
  const data = extraData ? { ...baseData, ...extraData } : baseData;

  try {
    const html = await renderAsHtml({
      templateId: option.templateId,
      format: 'html',
      locale: getUserPreferredLocale(),
      context: renderContext,
      data,
    });
    await printViaIframe(html);
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
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
