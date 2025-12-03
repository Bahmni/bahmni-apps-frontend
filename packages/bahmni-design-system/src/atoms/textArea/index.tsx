import {
  TextArea as CarbonTextArea,
  TextAreaProps as CarbonTextAreaProps,
} from '@carbon/react';
import React from 'react';
import styles from './styles/TextArea.module.scss';

export type TextAreaProps = CarbonTextAreaProps & {
  testId?: string;
};

export const TextArea: React.FC<TextAreaProps> = ({
  testId,
  className,
  invalid = false,
  ...carbonProps
}) => {
  const wrapperClassName = invalid
    ? styles.textAreaWrapperInvalid
    : styles.textAreaWrapper;

  return (
    <div className={wrapperClassName}>
      <CarbonTextArea
        {...carbonProps}
        invalid={invalid}
        className={className}
        data-testid={testId}
      />
    </div>
  );
};
