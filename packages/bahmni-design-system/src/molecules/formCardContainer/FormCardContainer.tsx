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
  noFormsMessage = "No forms found",
  showNoFormsMessage = false,
}) => {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className={styles.formCardContainer}>
      <div className={styles.title}>
        {title}
      </div>

      {hasChildren ? (
        <div className={styles.formsGrid}>
          {children}
        </div>
      ) : showNoFormsMessage ? (
        <div className={styles.noFormsMessage}>
          {noFormsMessage}
        </div>
      ) : null}
    </div>
  );
};

export default FormCardContainer;