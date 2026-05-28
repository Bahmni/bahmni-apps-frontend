import React from 'react';
import { createRoot } from 'react-dom/client';
import { CommandPaletteProvider } from './CommandPaletteProvider';

const MOUNT_ID = 'bahmni-command-palette-root';

function mount() {
  if (document.getElementById(MOUNT_ID)) return;
  const container = document.createElement('div');
  container.id = MOUNT_ID;
  document.body.appendChild(container);
  createRoot(container).render(React.createElement(CommandPaletteProvider));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
