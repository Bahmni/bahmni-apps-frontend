import React from 'react';
import styles from './styles/FormCardContainer.module.scss';

export interface FormCardContainerProps {
  /** Section title */
  title: string;

  /** Form cards to render */
  children: React.ReactNode;

  /** Message to show when no forms available */
  noFormsMessage?: string;

  /** Show no forms message when children is empty */
  showNoFormsMessage?: boolean;

  /** Data test ID for testing */
  dataTestId?: string;
}

/**
 * FormCardContainer - A minimal container for displaying form cards
 *
 * Simply renders a title and a grid layout for form cards.
 * The actual FormCard components and their actions are passed as children.
 */
export const FormCardContainer: React.FC<FormCardContainerProps> = ({
  title,
  children,
  noFormsMessage = 'No forms found',
  showNoFormsMessage = false,
  dataTestId = 'form-card-container',
}) => {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className={styles.formCardContainer} data-testid={dataTestId}>
      <div className={styles.title} data-testid={`${dataTestId}-title`}>
        {title}
      </div>

      {hasChildren ? (
        <div className={styles.formsGrid} data-testid={`${dataTestId}-grid`}>
          {children}
        </div>
      ) : showNoFormsMessage ? (
        <div
          className={styles.noFormsMessage}
          data-testid={`${dataTestId}-no-forms`}
        >
          {noFormsMessage}
        </div>
      ) : null}
    </div>
  );
};

export default FormCardContainer;
