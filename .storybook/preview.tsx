import React from 'react';
import type { Preview } from '@storybook/react';
import { Theme } from '@carbon/react';
import { initFontAwesome } from '../src/fontawesome';

// Initialize FontAwesome icons for tests
initFontAwesome();

const preview: Preview = {
  decorators: [
    (Story) => (
      <Theme theme="white">
        <Story />
      </Theme>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
