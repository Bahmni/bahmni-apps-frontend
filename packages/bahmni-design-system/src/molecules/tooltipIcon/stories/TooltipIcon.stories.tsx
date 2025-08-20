import type { Meta, StoryObj } from '@storybook/react';
import { TooltipIcon } from '../TooltipIcon';
import { ICON_SIZE, ICON_PADDING } from '../../icon';

const meta: Meta<typeof TooltipIcon> = {
  title: 'Molecules/TooltipIcon',
  component: TooltipIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    iconName: {
      control: 'text',
      description: 'FontAwesome icon name (e.g., fa-file-lines)',
    },
    content: {
      control: 'text',
      description: 'Content to display in the tooltip',
    },
    iconSize: {
      control: 'select',
      options: Object.values(ICON_SIZE),
      description: 'Size of the icon',
    },
    iconPadding: {
      control: 'select',
      options: Object.keys(ICON_PADDING).filter(key => isNaN(Number(key))),
      mapping: ICON_PADDING,
      description: 'Padding around the icon',
    },
    autoAlign: {
      control: 'boolean',
      description: 'Whether the tooltip should auto-align',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessibility label for the icon',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    iconName: 'fa-file-lines',
    content: 'This is additional information about the item.',
  },
};

export const WithCustomIcon: Story = {
  args: {
    iconName: 'fa-info-circle',
    content: 'Information tooltip with info icon.',
  },
};

export const LargeIcon: Story = {
  args: {
    iconName: 'fa-question-circle',
    content: 'Help information with larger icon.',
    iconSize: ICON_SIZE.XL,
  },
};

export const WithComplexContent: Story = {
  args: {
    iconName: 'fa-warning',
    content: (
      <div>
        <strong>Warning:</strong>
        <p>This action cannot be undone.</p>
        <ul>
          <li>All data will be lost</li>
          <li>Backups are recommended</li>
        </ul>
      </div>
    ),
  },
};

export const CustomStyling: Story = {
  args: {
    iconName: 'fa-star',
    content: 'Custom styled tooltip',
    className: 'custom-tooltip-style',
  },
};

export const NoAutoAlign: Story = {
  args: {
    iconName: 'fa-gear',
    content: 'Settings tooltip without auto-alignment',
    autoAlign: false,
  },
};

export const AccessibilityExample: Story = {
  args: {
    iconName: 'fa-heart',
    content: 'Favorite item - click to add to favorites',
    ariaLabel: 'Add to favorites',
  },
};
