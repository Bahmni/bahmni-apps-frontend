import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { initFontAwesome } from '@/fontawesome';
import SidebarItem from '../SidebarItem';

// Initialize FontAwesome for the icons
initFontAwesome();

// Create a decorator to provide a better layout for the component
const ItemDecorator = (Story: React.ComponentType) => (
  <div
    style={{
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: '300px',
    }}
  >
    <Story />
  </div>
);

const meta: Meta<typeof SidebarItem> = {
  title: 'Components/Common/SidebarItem',
  component: SidebarItem,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The SidebarItem component is a reusable component that renders a clickable item for the sidebar navigation.
It displays an icon and a label, and can be in either an active or inactive state.

Key features:
- Customizable icon using BahmniIcon
- Displays a text label
- Can be in active or inactive state with different styling
- Click handler support via the action prop
- Fully accessible
        `,
      },
    },
  },
  decorators: [ItemDecorator],
  tags: ['autodocs'],
  argTypes: {
    id: {
      description: 'Unique identifier for the sidebar item',
      control: 'text',
    },
    icon: {
      description:
        'Icon name in FontAwesome format (e.g., "fa-clipboard-list")',
      control: 'text',
    },
    label: {
      description: 'Display text for the item',
      control: 'text',
    },
    active: {
      description: 'Whether the item is currently active/selected',
      control: 'boolean',
    },
    action: {
      description: 'Callback function executed when the item is clicked',
      action: 'clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SidebarItem>;

// Basic usage stories
export const Default: Story = {
  args: {
    id: 'notes',
    icon: 'fa-clipboard-list',
    label: 'Consultation Notes',
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic usage with default settings (inactive state)',
      },
    },
  },
};

export const Active: Story = {
  args: {
    id: 'notes',
    icon: 'fa-clipboard-list',
    label: 'Consultation Notes',
    active: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'SidebarItem in active state',
      },
    },
  },
};

export const WithClickHandler: Story = {
  args: {
    id: 'notes',
    icon: 'fa-clipboard-list',
    label: 'Consultation Notes',
    action: () => console.log('SidebarItem clicked'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'SidebarItem with a click handler. Check the Actions tab to see the event being fired.',
      },
    },
  },
};

export const WithLongLabel: Story = {
  args: {
    id: 'notes',
    icon: 'fa-clipboard-list',
    label:
      'This is a very long label that should be truncated with ellipsis when it exceeds the available space',
  },
  parameters: {
    docs: {
      description: {
        story:
          'SidebarItem with a long label that demonstrates text truncation',
      },
    },
  },
};

// Common icon examples for sidebar items
export const CommonSidebarItems: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <SidebarItem
        id="notes"
        icon="fa-clipboard-list"
        label="Consultation Notes"
        active={true}
      />
      <SidebarItem id="vitals" icon="fa-heartbeat" label="Vital Signs" />
      <SidebarItem id="medications" icon="fa-pills" label="Medications" />
      <SidebarItem id="lab-orders" icon="fa-flask" label="Lab Orders" />
      <SidebarItem
        id="appointments"
        icon="fa-calendar-alt"
        label="Appointments"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of common sidebar items with different icons',
      },
    },
  },
};

// Interactive states
export const InteractiveStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h3>Normal State</h3>
        <SidebarItem
          id="normal"
          icon="fa-clipboard-list"
          label="Normal State"
        />
      </div>

      <div>
        <h3>Active State</h3>
        <SidebarItem
          id="active"
          icon="fa-clipboard-list"
          label="Active State"
          active={true}
        />
      </div>

      <div>
        <h3>Hover State (hover over the item below)</h3>
        <SidebarItem
          id="hover"
          icon="fa-clipboard-list"
          label="Hover Over Me"
        />
      </div>

      <div>
        <h3>With Click Handler</h3>
        <SidebarItem
          id="clickable"
          icon="fa-clipboard-list"
          label="Click Me"
          action={() => alert('Item clicked!')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstration of different interaction states for the SidebarItem',
      },
    },
  },
};
