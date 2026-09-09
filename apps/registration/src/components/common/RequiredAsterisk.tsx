import styles from './styles/index.module.scss';

interface RequiredAsteriskProps {
  className?: string;
}

export const RequiredAsterisk = ({ className }: RequiredAsteriskProps) => (
  <span
    className={
      className
        ? `${styles.requiredAsterisk} ${className}`
        : styles.requiredAsterisk
    }
  >
    *
  </span>
);
