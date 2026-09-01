import {
  getFormattedError,
  getUserPreferredLocale,
  notificationService,
  renderAsHtml,
} from '@bahmni/services';
import { categoryPickers } from './categoryPickers/prescriptionEncounterPicker';
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
): Promise<void> {
  ctx.setIsPrinting(true);

  const data = ctx.getRenderData
    ? await ctx.getRenderData(option.templateId)
    : ctx.renderData;

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

export function getHandlerFor(option: PrintOption): PrintOptionHandler {
  const picker = option.category && categoryPickers[option.category];
  return picker ? categoryPickerHandler(picker) : directPrintHandler;
}
