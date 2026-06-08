import * as DesignSystem from '@bahmni/design-system';
import * as Services from '@bahmni/services';
import * as ReactQuery from '@tanstack/react-query';
import React from 'react';
import * as ReactDOM from 'react-dom';
import * as JSXRuntime from 'react/jsx-runtime';
import * as ReactI18next from 'react-i18next';
import * as Widgets from './index';
import type { BahmniControlsSdk } from './sdk';

declare global {
  interface Window {
    BahmniControls: BahmniControlsSdk;
  }
}

/**
 * Expose the host SDK singletons on `window.BahmniControls` so externally-loaded
 * custom controls (type: 'custom') resolve React/design-system/services/widgets to
 * the SAME instances the running app uses. Must run synchronously during distro
 * bootstrap, before any control is loaded.
 *
 * Because this installer lives in `@bahmni/widgets` and imports the shared packages
 * (which are externalized in the published builds — see vite externals), the exposed
 * modules are the consumer distro's deduped instances, not bundled copies.
 *
 * Own-distro builders enable runtime custom controls with a single call:
 *   import { installControlsSdk } from '@bahmni/widgets';
 *   installControlsSdk(window);
 */
export function installControlsSdk(target: Window = window): void {
  target.BahmniControls = Object.freeze({
    React,
    ReactDOM,
    jsxRuntime: JSXRuntime,
    reactQuery: ReactQuery,
    reactI18next: ReactI18next,
    designSystem: DesignSystem,
    services: Services,
    widgets: Widgets,
  }) as BahmniControlsSdk;
}
