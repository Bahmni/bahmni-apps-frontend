import {
  Button,
  ComboButton,
  IconButton,
  InlineLoading,
  MenuItem,
  OverflowMenu,
  OverflowMenuItem,
  Printer,
} from '@bahmni/design-system';
import {
  getFormattedError,
  getUserPreferredLocale,
  notificationService,
  renderAsHtml,
  useTranslation,
} from '@bahmni/services';
import { useState } from 'react';
import { printViaIframe } from './printViaIframe';

export interface PrintOption {
  translationKey: string;
  templateId: string;
  // TODO: shortcutKey is reserved for keyboard shortcut support — not yet implemented
  shortcutKey?: string;
  privileges?: string[];
}

interface DocumentPrintButtonProps {
  printOptions?: PrintOption[];
  renderContext: Record<string, string>;
  renderData?: Record<string, unknown>;
  getRenderData?: (templateId: string) => Promise<Record<string, unknown>>;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  'data-testid'?: string;
  iconOnly?: boolean;
  iconLabel?: string;
}

export const DocumentPrintButton = ({
  printOptions,
  renderContext,
  renderData,
  getRenderData,
  size,
  disabled,
  'data-testid': dataTestId,
  iconOnly,
  iconLabel,
}: DocumentPrintButtonProps) => {
  const { t } = useTranslation();
  const [isPrinting, setIsPrinting] = useState(false);

  const items = printOptions ?? [];

  const handlePrint = async (option: PrintOption) => {
    setIsPrinting(true);

    const data = getRenderData
      ? await getRenderData(option.templateId)
      : renderData;

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
      setIsPrinting(false);
    }
  };

  if (items.length === 0) return null;

  if (isPrinting) {
    const descriptionText = t('PRINT_MODAL_PREPARING_DOCUMENT');
    return iconOnly ? (
      <InlineLoading iconDescription={descriptionText} />
    ) : (
      <InlineLoading description={descriptionText} />
    );
  }

  if (iconOnly) {
    if (items.length === 1) {
      return (
        <IconButton
          label={ t(items[0].translationKey) ?? iconLabel}
          kind="ghost"
          size={size ?? 'md'}
          disabled={disabled}
          testId={dataTestId}
          autoAlign
          onClick={() => handlePrint(items[0])}
        >
          <Printer />
        </IconButton>
      );
    }

    return (
      <OverflowMenu
        renderIcon={Printer}
        iconDescription={iconLabel}
        size={size ?? 'md'}
        disabled={disabled}
        testId={dataTestId}
        autoAlign
        flipped
      >
        {items.map((item) => (
          <OverflowMenuItem
            key={item.templateId}
            itemText={t(item.translationKey)}
            onClick={() => handlePrint(item)}
          />
        ))}
      </OverflowMenu>
    );
  }

  return items.length === 1 ? (
    <div>
      <Button
        size={size}
        disabled={disabled}
        data-testid={dataTestId}
        onClick={() => handlePrint(items[0])}
      >
        {t(items[0].translationKey)}
      </Button>
    </div>
  ) : (
    <ComboButton
      label={t(items[0].translationKey)}
      onClick={() => handlePrint(items[0])}
      size={size ?? 'lg'}
      disabled={disabled}
      data-testid={dataTestId}
    >
      {items.slice(1).map((item) => (
        <MenuItem
          key={item.templateId}
          label={t(item.translationKey)}
          onClick={() => handlePrint(item)}
        />
      ))}
    </ComboButton>
  );
};
