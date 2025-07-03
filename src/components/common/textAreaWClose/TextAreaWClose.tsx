import React from 'react';
import { Column, Grid, TextArea, Button } from '@carbon/react';
import { Close } from '@carbon/icons-react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/TextAreaWClose.module.scss';

/**
 * Properties for TextAreaWClose component
 * @interface TextAreaWCloseProps
 */
export interface TextAreaWCloseProps {
  /** Unique identifier for the textarea */
  id: string;
  /** Label text for the textarea */
  labelText: string;
  /** Placeholder text for the textarea */
  placeholder?: string;
  /** Current value of the textarea */
  value?: string;
  /** Callback function called when textarea value changes */
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Callback function called when close button is clicked */
  onClose: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Test identifier for the textarea */
  'data-testid'?: string;
  /** Test identifier for the close button */
  closeButtonTestId?: string;
  /** Whether the textarea is disabled */
  disabled?: boolean;
  /** Whether the textarea is in an invalid state */
  invalid?: boolean;
  /** Error message to display when invalid */
  invalidText?: string;
  /** Maximum character count for the textarea. Defaults to 512 */
  maxCount?: number;
  /** Whether to enable the character/word counter. Defaults to false */
  enableCounter?: boolean;
  /** Counter mode - character or word count. Defaults to 'character' */
  counterMode?: 'character' | 'word';
}

/**
 * TextAreaWClose component - A textarea with an integrated close button
 *
 * This component provides a textarea input with a close button positioned
 * within the same grid container. It's designed to be reusable across
 * different forms and contexts within the application.
 *
 * @param {TextAreaWCloseProps} props - Component props
 * @returns {JSX.Element} The rendered TextAreaWClose component
 */
const TextAreaWClose: React.FC<TextAreaWCloseProps> = ({
  id,
  labelText,
  placeholder,
  value,
  onChange,
  onClose,
  className,
  'data-testid': dataTestId,
  closeButtonTestId,
  disabled = false,
  invalid = false,
  invalidText,
  maxCount = 512,
  enableCounter = false,
  counterMode = 'character',
}) => {
  const { t } = useTranslation();

  return (
    <Grid className={className}>
      <Column
        sm={8}
        md={8}
        lg={16}
        xlg={16}
        className={
          invalid
            ? styles.textAreaWCloseContainerWInvalid
            : styles.textAreaWCloseContainer
        }
      >
        <TextArea
          id={id}
          data-testid={dataTestId}
          type="default"
          labelText={labelText}
          placeholder={placeholder || labelText}
          hideLabel
          value={value}
          onChange={onChange}
          disabled={disabled}
          invalid={invalid}
          invalidText={invalid ? invalidText : undefined}
          maxCount={maxCount}
          enableCounter={enableCounter}
          counterMode={counterMode}
        />
        <Column sm={1} md={1} lg={1} xlg={1} className={styles.closeButton}>
          <Button
            id={`${id}-close-button`}
            data-testid={closeButtonTestId || `${id}-close-button`}
            size="lg"
            hasIconOnly
            renderIcon={Close}
            iconDescription={t('SELECTED_ITEM_CLOSE')}
            aria-label={t('SELECTED_ITEM_CLOSE_ARIA_LABEL')}
            onClick={onClose}
            disabled={disabled}
          />
        </Column>
      </Column>
    </Grid>
  );
};

TextAreaWClose.displayName = 'TextAreaWClose';

export default TextAreaWClose;
