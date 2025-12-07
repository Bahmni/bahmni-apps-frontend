import { useTranslation } from '@bahmni/services';
import React, { ReactNode } from 'react';
import { useConfigValidation } from '../hooks/useConfigValidation';
import styles from './styles/ConfigValidator.module.scss';

interface ConfigValidatorProps {
  config: unknown;
  schema: Record<string, unknown>;
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
}

const DefaultLoadingComponent = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.validatingConfig}>
      <p>{t('CONFIG_VALIDATING')}</p>
    </div>
  );
};

const DefaultErrorComponent = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.configValidatorError}>
      <p>
        <span>⚠️</span> {t('INVALID_CONTROL_CONFIGURATION')}
      </p>
    </div>
  );
};

export const ConfigValidator: React.FC<ConfigValidatorProps> = ({
  config,
  schema,
  children,
  loadingComponent,
  errorComponent,
}) => {
  const { isValidating, isValid } = useConfigValidation({
    config,
    schema,
  });

  if (isValidating) return loadingComponent ?? <DefaultLoadingComponent />;
  if (!isValid) return errorComponent ?? <DefaultErrorComponent />;
  return <>{children}</>;
};
