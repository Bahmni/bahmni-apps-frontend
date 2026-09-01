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
  getUserLoginLocation,
  useTranslation,
  type UserLocation,
} from '@bahmni/services';
import { useState } from 'react';
import { useActivePractitioner } from '../activePractitioner';
import type {
  CategoryPicker,
  PrintOption,
  PrintOptionCategory,
} from './categoryPickers/types';
import { CategorySelectionModal } from './CategorySelectionModal';
import { getHandlerFor, printTemplate } from './printOptionHandlers';

export type { PrintOption, PrintOptionCategory };

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
  const [activePicker, setActivePicker] = useState<{
    picker: CategoryPicker<unknown>;
    option: PrintOption;
  } | null>(null);

  const { practitioner } = useActivePractitioner();
  const [userLocation] = useState<UserLocation | null>(() => {
    try {
      return getUserLoginLocation();
    } catch {
      return null;
    }
  });

  const items = printOptions ?? [];

  const enrichedContext: Record<string, string> = {
    ...renderContext,
    ...(practitioner?.uuid && { providerUuid: practitioner.uuid }),
    ...(userLocation?.uuid && { locationUuid: userLocation.uuid }),
  };

  const handleTrigger = (option: PrintOption) => {
    getHandlerFor(option).trigger(option, {
      renderContext: enrichedContext,
      renderData,
      getRenderData,
      setIsPrinting,
      openPicker: (picker, selectedOption) =>
        setActivePicker({ picker, option: selectedOption }),
    });
  };

  const handlePickerSelect = (item: unknown) => {
    if (!activePicker) return;
    const { picker, option } = activePicker;
    const resolvedContext = picker.resolveSelection(item, enrichedContext);
    setActivePicker(null);
    void printTemplate(option, resolvedContext, {
      renderData,
      getRenderData,
      setIsPrinting,
    });
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

  const printButton = iconOnly ? (
    items.length === 1 ? (
      <IconButton
        label={t(items[0].translationKey) ?? iconLabel}
        kind="ghost"
        size={size ?? 'md'}
        disabled={disabled}
        testId={dataTestId}
        autoAlign
        onClick={() => handleTrigger(items[0])}
      >
        <Printer />
      </IconButton>
    ) : (
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
            onClick={() => handleTrigger(item)}
          />
        ))}
      </OverflowMenu>
    )
  ) : items.length === 1 ? (
    <div>
      <Button
        size={size}
        disabled={disabled}
        data-testid={dataTestId}
        onClick={() => handleTrigger(items[0])}
      >
        {t(items[0].translationKey)}
      </Button>
    </div>
  ) : (
    <ComboButton
      label={t(items[0].translationKey)}
      onClick={() => handleTrigger(items[0])}
      size={size ?? 'lg'}
      disabled={disabled}
      data-testid={dataTestId}
    >
      {items.slice(1).map((item) => (
        <MenuItem
          key={item.templateId}
          label={t(item.translationKey)}
          onClick={() => handleTrigger(item)}
        />
      ))}
    </ComboButton>
  );

  return (
    <>
      {printButton}
      {activePicker && (
        <CategorySelectionModal
          open
          picker={activePicker.picker}
          context={enrichedContext}
          onSelect={handlePickerSelect}
          onCancel={() => setActivePicker(null)}
        />
      )}
    </>
  );
};
