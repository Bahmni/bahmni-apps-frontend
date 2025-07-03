import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { initFontAwesome } from '@/fontawesome';
import Sidebar, { SidebarItemProps } from '../Sidebar';

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
- Each item can be active or inactive based on activeItemId
- Centralized click handling through onItemClick
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
    activeItemId: {
      description: 'ID of the currently active item',
      control: 'text',
    },
    onItemClick: {
      description: 'Callback function when an item is clicked',
      action: 'clicked',
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
  },
  {
    id: 'vitals',
    icon: 'fa-heartbeat',
    label: 'Vital Signs',
  },
  {
    id: 'medications',
    icon: 'fa-pills',
    label: 'Medications',
  },
  {
    id: 'lab-orders',
    icon: 'fa-flask',
    label: 'Lab Orders',
  },
  {
    id: 'appointments',
    icon: 'fa-calendar-alt',
    label: 'Appointments',
  },
];

// Common onItemClick handler for stories
const onItemClick = (itemId: string) => {
  console.log(`Item clicked: ${itemId}`);
};

// Basic usage stories
export const Default: Story = {
  args: {
    items: defaultItems,
    activeItemId: 'notes',
    onItemClick,
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
    items: defaultItems,
    activeItemId: null,
    onItemClick,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with no active items',
      },
    },
  },
};

// Removed WithCustomClassName story as className is not part of the component props

export const WithLongLabels: Story = {
  args: {
    items: [
      {
        id: 'notes',
        icon: 'fa-clipboard-list',
        label:
          'Consultation Notes with a very long title that should be truncated',
      },
      {
        id: 'vitals',
        icon: 'fa-heartbeat',
        label: 'Vital Signs and Measurements with Detailed Information',
      },
      ...defaultItems.slice(2),
    ],
    activeItemId: 'notes',
    onItemClick,
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
    activeItemId: null,
    onItemClick,
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
      },
      {
        id: 'procedures',
        icon: 'fa-procedures',
        label: 'Procedures',
      },
      {
        id: 'allergies',
        icon: 'fa-allergies',
        label: 'Allergies',
      },
      {
        id: 'conditions',
        icon: 'fa-disease',
        label: 'Conditions',
      },
      {
        id: 'documents',
        icon: 'fa-file-medical',
        label: 'Documents',
      },
    ],
    activeItemId: 'notes',
    onItemClick,
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
const InteractiveSidebarComponent = () => {
  // Using React hooks for state management in the story
  const [activeItemId, setActiveItemId] = React.useState('notes');

  const handleItemClick = (itemId: string) => {
    console.log(`${itemId} clicked`);
    setActiveItemId(itemId);
  };

  return (
    <Sidebar
      items={defaultItems}
      activeItemId={activeItemId}
      onItemClick={handleItemClick}
    />
  );
};

// Interactive sidebar with state management
export const InteractiveSidebar: Story = {
  render: () => <InteractiveSidebarComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive sidebar with state management - clicking an item makes it active',
      },
    },
  },
};
