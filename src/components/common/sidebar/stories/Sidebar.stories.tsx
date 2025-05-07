import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { initFontAwesome } from '@/fontawesome';
import Sidebar from '../Sidebar';
import { SidebarItemProps } from '../SidebarItem';

// Initialize FontAwesome for the icons
initFontAwesome();

// Create a decorator to provide proper layout and sizing for the sidebar
const SidebarDecorator = (Story: React.ComponentType) => <Story />;

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Common/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Sidebar component is a navigation component that displays a list of sidebar items.
It can be used to navigate between different sections or views of the application.

Key features:
- Displays a vertical list of navigation items
- Each item can be active or inactive
- Items can have click handlers for navigation
- Consistent styling with the design system
- Fully customizable through props
        `,
      },
    },
  },
  decorators: [SidebarDecorator],
  tags: ['autodocs'],
  argTypes: {
    items: {
      description: 'Array of sidebar items to render',
      control: 'object',
    },
    className: {
      description: 'Optional CSS class name for additional styling',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

// Sample sidebar items for the stories
const defaultItems: SidebarItemProps[] = [
  {
    id: 'notes',
    icon: 'fa-clipboard-list',
    label: 'Consultation Notes',
    active: true,
    action: () => console.log('Consultation Notes clicked'),
  },
  {
    id: 'vitals',
    icon: 'fa-heartbeat',
    label: 'Vital Signs',
    action: () => console.log('Vital Signs clicked'),
  },
  {
    id: 'medications',
    icon: 'fa-pills',
    label: 'Medications',
    action: () => console.log('Medications clicked'),
  },
  {
    id: 'lab-orders',
    icon: 'fa-flask',
    label: 'Lab Orders',
    action: () => console.log('Lab Orders clicked'),
  },
  {
    id: 'appointments',
    icon: 'fa-calendar-alt',
    label: 'Appointments',
    action: () => console.log('Appointments clicked'),
  },
];

// Basic usage stories
export const Default: Story = {
  args: {
    items: defaultItems,
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic sidebar with default items and one active item',
      },
    },
  },
};

export const NoActiveItem: Story = {
  args: {
    items: defaultItems.map((item) => ({ ...item, active: false })),
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with no active items',
      },
    },
  },
};

export const WithCustomClassName: Story = {
  args: {
    items: defaultItems,
    className: 'custom-sidebar',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with a custom CSS class for additional styling',
      },
    },
  },
};

export const WithLongLabels: Story = {
  args: {
    items: [
      {
        id: 'notes',
        icon: 'fa-clipboard-list',
        label:
          'Consultation Notes with a very long title that should be truncated',
        active: true,
        action: () => console.log('Consultation Notes clicked'),
      },
      {
        id: 'vitals',
        icon: 'fa-heartbeat',
        label: 'Vital Signs and Measurements with Detailed Information',
        action: () => console.log('Vital Signs clicked'),
      },
      ...defaultItems.slice(2),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with long item labels that should be truncated',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with no items',
      },
    },
  },
};

export const ManyItems: Story = {
  args: {
    items: [
      ...defaultItems,
      {
        id: 'imaging',
        icon: 'fa-x-ray',
        label: 'Imaging',
        action: () => console.log('Imaging clicked'),
      },
      {
        id: 'procedures',
        icon: 'fa-procedures',
        label: 'Procedures',
        action: () => console.log('Procedures clicked'),
      },
      {
        id: 'allergies',
        icon: 'fa-allergies',
        label: 'Allergies',
        action: () => console.log('Allergies clicked'),
      },
      {
        id: 'conditions',
        icon: 'fa-disease',
        label: 'Conditions',
        action: () => console.log('Conditions clicked'),
      },
      {
        id: 'documents',
        icon: 'fa-file-medical',
        label: 'Documents',
        action: () => console.log('Documents clicked'),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with many items to demonstrate scrolling behavior',
      },
    },
  },
};

// Interactive sidebar with state management
export const InteractiveSidebar: Story = {
  render: () => {
    // Using React hooks for state management in the story
    const [activeItemId, setActiveItemId] = React.useState('notes');

    const items: SidebarItemProps[] = defaultItems.map((item) => ({
      ...item,
      active: item.id === activeItemId,
      action: () => {
        console.log(`${item.label} clicked`);
        setActiveItemId(item.id);
      },
    }));

    return <Sidebar items={items} />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive sidebar with state management - clicking an item makes it active',
      },
    },
  },
};
