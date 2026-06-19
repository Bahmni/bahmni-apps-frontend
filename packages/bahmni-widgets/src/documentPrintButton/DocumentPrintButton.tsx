import {
  Button,
  Dropdown,
  IconButton,
  InlineLoading,
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
import styles from './DocumentPrintButton.module.scss';
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
          label={iconLabel}
          kind="ghost"
          size={size ?? 'md'}
          disabled={disabled}
          testId={dataTestId}
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
        kind="tertiary"
        size={size}
        disabled={disabled}
        data-testid={dataTestId}
        onClick={() => handlePrint(items[0])}
      >
        {t(items[0].translationKey)}
      </Button>
    </div>
  ) : (
    <div className={styles.printButtonGroup}>
      <Button
        kind="tertiary"
        size={size}
        disabled={disabled}
        className={styles.printButton}
        data-testid={dataTestId}
        onClick={() => handlePrint(items[0])}
      >
        {t(items[0].translationKey)}
      </Button>
      <Dropdown
        id={`print-dropdown-${dataTestId ?? 'default'}`}
        className={styles.printDropdown}
        disabled={disabled}
        items={items.slice(1)}
        itemToString={(item) => (item ? t(item.translationKey) : '')}
        onChange={({ selectedItem }) => {
          if (selectedItem) handlePrint(selectedItem);
        }}
        label=""
        type="inline"
        size={size ?? 'lg'}
        titleText={t('PRINT_MORE_OPTIONS')}
        selectedItem={null}
      />
    </div>
  );
};
