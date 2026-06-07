import { useTranslation } from '@bahmni/services';
import React from 'react';
import { ControlErrorBoundary } from './ControlErrorBoundary';
import styles from './custom.module.scss';
import { WidgetProps } from '../registry/model';

const cache = new Map<string, React.LazyExoticComponent<React.ComponentType<WidgetProps>>>();

function isAllowedUrl(raw: string): boolean {
  try {
    const u = new URL(raw, window.location.origin);
    return u.origin === window.location.origin && /^https?:$/.test(u.protocol);
  } catch {
    return false;
  }
}

function getLazy(
  url: string,
  name?: string,
): React.LazyExoticComponent<React.ComponentType<WidgetProps>> {
  const key = `${url}::${name ?? '__default__'}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      React.lazy(async () => {
        const mod = await import(/* webpackIgnore: true */ url);
        const Component = name ? mod[name] : mod.default;
        if (!Component) {
          throw new Error(`Control "${name ?? 'default'}" not found in ${url}`);
        }
        return { default: Component as React.ComponentType<WidgetProps> };
      }),
    );
  }
  return cache.get(key)!;
}

const CustomControl: React.FC<WidgetProps> = (props) => {
  const { t } = useTranslation();
  const url = props.config?.url as string | undefined;
  const name = props.config?.name as string | undefined;

  if (!url) {
    return <div className={styles.widgetError}>{t('CUSTOM_CONTROL_NO_URL')}</div>;
  }

  if (!isAllowedUrl(url)) {
    return (
      <div className={styles.widgetError}>{t('CUSTOM_CONTROL_INVALID_URL')}</div>
    );
  }

  const LazyComponent = getLazy(url, name);
  const { url: _url, name: _name, ...forwardedConfig } = props.config ?? {};

  return (
    <ControlErrorBoundary
      fallback={
        <div className={styles.widgetError}>{t('CUSTOM_CONTROL_LOAD_ERROR')}</div>
      }
    >
      <React.Suspense
        fallback={
          <div className={styles.widgetLoading}>{t('INITIALIZING_CONTROL')}</div>
        }
      >
        <LazyComponent {...props} config={forwardedConfig} />
      </React.Suspense>
    </ControlErrorBoundary>
  );
};

export default CustomControl;
