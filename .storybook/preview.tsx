import React from 'react';
import type { Preview } from '@storybook/react';
import { Theme } from '@carbon/react';
import '../src/styles/index.scss';
import { initFontAwesome } from '../src/fontawesome';

// Initialize FontAwesome for the icons
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
