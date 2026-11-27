import { createRoot, type Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { initAppI18n } from '@bahmni/services';
import commandPaletteStyles from 'virtual:command-palette-styles?inline';
import { CommandPaletteProvider } from './components/CommandPaletteProvider';
import { BAHMNI_COMMAND_PALETTE_NAMESPACE } from './constants/app';

const TAG_NAME = 'bahmni-command-palette';

// Angular's $location navigation never fires a native popstate, so BrowserRouter
// goes stale — resync it on every keydown to keep useLocation() current.
function resyncRouterOnKeydown(): () => void {
  const resync = () => window.dispatchEvent(new PopStateEvent('popstate'));
  document.addEventListener('keydown', resync, true);
  return () => document.removeEventListener('keydown', resync, true);
}

class BahmniCommandPaletteElement extends HTMLElement {
  private root: Root | null = null;
  private stopResync: (() => void) | null = null;

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = commandPaletteStyles;
    shadow.appendChild(style);

    const mount = document.createElement('div');
    shadow.appendChild(mount);

    this.stopResync = resyncRouterOnKeydown();
    this.root = createRoot(mount);

    // Wait for i18n init before the first render, else useTranslation() skips its
    // hooks on render 1 and calls them on render 2 — a rules-of-hooks crash.
    void initAppI18n(BAHMNI_COMMAND_PALETTE_NAMESPACE).finally(() => {
      this.root?.render(
        <BrowserRouter>
          <CommandPaletteProvider portalContainer={shadow} />
        </BrowserRouter>,
      );
    });
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = null;
    this.stopResync?.();
    this.stopResync = null;
  }
}

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, BahmniCommandPaletteElement);
}

if (!document.querySelector(TAG_NAME)) {
  document.body.appendChild(document.createElement(TAG_NAME));
}
