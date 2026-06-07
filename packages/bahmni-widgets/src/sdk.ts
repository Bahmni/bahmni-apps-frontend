export interface BahmniControlsSdk {
  React: typeof import('react');
  ReactDOM: typeof import('react-dom');
  jsxRuntime: typeof import('react/jsx-runtime');
  reactQuery: typeof import('@tanstack/react-query');
  reactI18next: typeof import('react-i18next');
  designSystem: typeof import('@bahmni/design-system');
  services: typeof import('@bahmni/services');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  widgets: any;
}
