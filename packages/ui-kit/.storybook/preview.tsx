import React from 'react';
import type { Preview } from '@storybook/react';
import { UIProvider } from '../src/lib/themes/Theme';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    Story => (
      <UIProvider>
        <Story />
      </UIProvider>
    ),
  ],
};

export default preview;
