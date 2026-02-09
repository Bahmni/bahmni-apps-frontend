import { ReactNode } from 'react';
import styles from './index.module.scss';

export interface LabelValueProps {
  id: string;
  label: string;
  value: ReactNode;
  labelId?: string;
  valueId?: string;
  valueClassName?: string;
}

export const LabelValue: React.FC<LabelValueProps> = ({
  id,
  label,
  value,
  labelId = `${id}-label`,
  valueId = `${id}-value`,
  valueClassName = styles.definition,
}) => (
  <dl
    id={id}
    data-testid={`${id}-test-id`}
    aria-label={`${id}-aria-label`}
    className={styles.item}
  >
    <dt
      id={labelId}
      data-testid={`${labelId}-test-id`}
      aria-label={`${labelId}-aria-label`}
    >
      {label}
    </dt>
    <dd
      id={valueId}
      className={valueClassName}
      data-testid={`${valueId}-test-id`}
      aria-label={`${valueId}-aria-label`}
    >
      {value}
    </dd>
  </dl>
);
