import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { initFontAwesome } from '@/fontawesome';
import BahmniIcon from '../Icon';
import { ICON_SIZE, ICON_PADDING } from '@constants/icon';

// Initialize FontAwesome
initFontAwesome();
// Create a decorator to provide a better layout for the component
const IconDecorator = (Story: React.ComponentType) => (
  <div
    style={{
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}
  >
    <Story />
  </div>
);

const meta: Meta<typeof BahmniIcon> = {
  title: 'Components/Common/BahmniIcon',
  component: BahmniIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The BahmniIcon component is a reusable component that renders FontAwesome icons with customizable size, color, and padding.
It supports both solid and regular icon styles and provides a consistent way to use icons throughout the application.

Key features:
- Solid and regular icon styles
- Customizable size using the ICON_SIZE enum
- Customizable color using CSS color values
- Customizable padding using the ICON_PADDING enum
- Accessibility support with aria-label
        `,
      },
    },
  },
  decorators: [IconDecorator],
  tags: ['autodocs'],
  argTypes: {
    name: {
      description: 'Icon name in the format "fa-home" or "fas-user"',
      control: 'text',
    },
    size: {
      description: 'Icon size from ICON_SIZE enum',
      control: 'select',
      options: Object.values(ICON_SIZE),
    },
    color: {
      description: 'Icon color as CSS color value',
      control: 'color',
    },
    id: {
      description:
        'Unique identifier for the icon (used for testing and accessibility)',
      control: 'text',
    },
    ariaLabel: {
      description: 'Accessibility label (defaults to id if not provided)',
      control: 'text',
    },
    padding: {
      description: 'Padding around the icon from ICON_PADDING enum',
      control: 'select',
      options: Object.values(ICON_PADDING),
    },
  },
};

export default meta;
type Story = StoryObj<typeof BahmniIcon>;

// Basic usage stories
export const Default: Story = {
  args: {
    name: 'fa-home',
    id: 'home-icon',
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic usage with default settings',
      },
    },
  },
};

export const WithCustomSize: Story = {
  args: {
    name: 'fa-home',
    id: 'sized-home-icon',
    size: ICON_SIZE.X2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Icon with custom size (2x)',
      },
    },
  },
};

export const WithCustomColor: Story = {
  args: {
    name: 'fa-home',
    id: 'colored-home-icon',
    color: '#0f62fe',
  },
  parameters: {
    docs: {
      description: {
        story: 'Icon with custom color',
      },
    },
  },
};

export const WithCustomPadding: Story = {
  args: {
    name: 'fa-home',
    id: 'padded-home-icon',
    padding: ICON_PADDING.MEDIUM,
  },
  parameters: {
    docs: {
      description: {
        story: 'Icon with custom padding',
      },
    },
  },
};

export const WithCustomAriaLabel: Story = {
  args: {
    name: 'fa-home',
    id: 'accessible-home-icon',
    ariaLabel: 'Home page icon',
  },
  parameters: {
    docs: {
      description: {
        story: 'Icon with custom aria-label for accessibility',
      },
    },
  },
};

// Icon style stories
export const SolidIcon: Story = {
  args: {
    name: 'fa-user',
    id: 'solid-user-icon',
  },
  parameters: {
    docs: {
      description: {
        story: 'Solid icon style (default)',
      },
    },
  },
};

// Size variations
export const SizeVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h3>Extra Small Sizes</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <BahmniIcon name="fa-star" id="xxs-icon" size={ICON_SIZE.XXS} />
            <p>XXS (2xs)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="xs-icon" size={ICON_SIZE.XS} />
            <p>XS (xs)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="sm-icon" size={ICON_SIZE.SM} />
            <p>SM (sm)</p>
          </div>
        </div>
      </div>

      <div>
        <h3>Standard Sizes</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <BahmniIcon name="fa-star" id="x1-icon" size={ICON_SIZE.X1} />
            <p>X1 (1x)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="lg-icon" size={ICON_SIZE.LG} />
            <p>LG (lg)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="xl-icon" size={ICON_SIZE.XL} />
            <p>XL (xl)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="xxl-icon" size={ICON_SIZE.XXL} />
            <p>XXL (2xl)</p>
          </div>
        </div>
      </div>

      <div>
        <h3>Large Sizes</h3>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <BahmniIcon name="fa-star" id="x2-icon" size={ICON_SIZE.X2} />
            <p>X2 (2x)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="x3-icon" size={ICON_SIZE.X3} />
            <p>X3 (3x)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="x4-icon" size={ICON_SIZE.X4} />
            <p>X4 (4x)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="x5-icon" size={ICON_SIZE.X5} />
            <p>X5 (5x)</p>
          </div>
        </div>
      </div>

      <div>
        <h3>Extra Large Sizes</h3>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <BahmniIcon name="fa-star" id="x6-icon" size={ICON_SIZE.X6} />
            <p>X6 (6x)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="x7-icon" size={ICON_SIZE.X7} />
            <p>X7 (7x)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="x8-icon" size={ICON_SIZE.X8} />
            <p>X8 (8x)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="x9-icon" size={ICON_SIZE.X9} />
            <p>X9 (9x)</p>
          </div>
          <div>
            <BahmniIcon name="fa-star" id="x10-icon" size={ICON_SIZE.X10} />
            <p>X10 (10x)</p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available icon sizes from the ICON_SIZE enum',
      },
    },
  },
};

// Padding variations
export const PaddingVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ border: '1px dashed #ccc', display: 'inline-block' }}>
          <BahmniIcon
            name="fa-star"
            id="none-padding-icon"
            size={ICON_SIZE.X2}
            padding={ICON_PADDING.NONE}
          />
          <p>NONE (0)</p>
        </div>
        <div style={{ border: '1px dashed #ccc', display: 'inline-block' }}>
          <BahmniIcon
            name="fa-star"
            id="xxsmall-padding-icon"
            size={ICON_SIZE.X2}
            padding={ICON_PADDING.XXSMALL}
          />
          <p>XXSMALL (0.125rem)</p>
        </div>
        <div style={{ border: '1px dashed #ccc', display: 'inline-block' }}>
          <BahmniIcon
            name="fa-star"
            id="xsmall-padding-icon"
            size={ICON_SIZE.X2}
            padding={ICON_PADDING.XSMALL}
          />
          <p>XSMALL (0.25rem)</p>
        </div>
        <div style={{ border: '1px dashed #ccc', display: 'inline-block' }}>
          <BahmniIcon
            name="fa-star"
            id="small-padding-icon"
            size={ICON_SIZE.X2}
            padding={ICON_PADDING.SMALL}
          />
          <p>SMALL (0.5rem)</p>
        </div>
        <div style={{ border: '1px dashed #ccc', display: 'inline-block' }}>
          <BahmniIcon
            name="fa-star"
            id="medium-padding-icon"
            size={ICON_SIZE.X2}
            padding={ICON_PADDING.MEDIUM}
          />
          <p>MEDIUM (1rem)</p>
        </div>
        <div style={{ border: '1px dashed #ccc', display: 'inline-block' }}>
          <BahmniIcon
            name="fa-star"
            id="large-padding-icon"
            size={ICON_SIZE.X2}
            padding={ICON_PADDING.LARGE}
          />
          <p>LARGE (1.5rem)</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available padding options from the ICON_PADDING enum',
      },
    },
  },
};

// Color variations
export const ColorVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <BahmniIcon
            name="fa-star"
            id="default-color-icon"
            size={ICON_SIZE.X2}
          />
          <p>Default</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-star"
            id="blue-icon"
            size={ICON_SIZE.X2}
            color="#0f62fe"
          />
          <p>Blue (#0f62fe)</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-star"
            id="red-icon"
            size={ICON_SIZE.X2}
            color="#da1e28"
          />
          <p>Red (#da1e28)</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-star"
            id="green-icon"
            size={ICON_SIZE.X2}
            color="#24a148"
          />
          <p>Green (#24a148)</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-star"
            id="yellow-icon"
            size={ICON_SIZE.X2}
            color="#f1c21b"
          />
          <p>Yellow (#f1c21b)</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-star"
            id="purple-icon"
            size={ICON_SIZE.X2}
            color="#8a3ffc"
          />
          <p>Purple (#8a3ffc)</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of different icon colors',
      },
    },
  },
};

// Common icon examples
export const CommonIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3>Navigation Icons</h3>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <BahmniIcon
            name="fa-home"
            id="home-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-home</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-user"
            id="user-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-user</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-cog"
            id="settings-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-cog</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-search"
            id="search-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-search</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-bell"
            id="notification-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-bell</p>
        </div>
      </div>

      <h3>Action Icons</h3>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <BahmniIcon
            name="fa-plus"
            id="add-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-plus</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-minus"
            id="minus-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-minus</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-edit"
            id="edit-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-edit</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-trash"
            id="delete-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-trash</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-save"
            id="save-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-save</p>
        </div>
      </div>

      <h3>Medical Icons</h3>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <BahmniIcon
            name="fa-heartbeat"
            id="heartbeat-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-heartbeat</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-stethoscope"
            id="stethoscope-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-stethoscope</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-pills"
            id="pills-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-pills</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-hospital"
            id="hospital-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-hospital</p>
        </div>
        <div>
          <BahmniIcon
            name="fa-user-md"
            id="doctor-icon-example"
            size={ICON_SIZE.X2}
          />
          <p>fa-user-md</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of commonly used icons in the application',
      },
    },
  },
};

// Fully customized icon
export const FullyCustomizedIcon: Story = {
  args: {
    name: 'fa-star',
    id: 'fully-customized-icon',
    size: ICON_SIZE.X3,
    color: '#8a3ffc',
    padding: ICON_PADDING.MEDIUM,
    ariaLabel: 'Favorite item',
  },
  parameters: {
    docs: {
      description: {
        story: 'Icon with all customizable properties set',
      },
    },
  },
};

// Accessibility example
export const AccessibilityExample: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h3>Accessibility Best Practices</h3>
        <p>Icons should always have an aria-label for screen readers.</p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <BahmniIcon
              name="fa-home"
              id="accessible-home"
              size={ICON_SIZE.X2}
              ariaLabel="Navigate to home page"
            />
            <p>With descriptive aria-label</p>
          </div>
          <div>
            <BahmniIcon
              name="fa-search"
              id="accessible-search"
              size={ICON_SIZE.X2}
              ariaLabel="Search for content"
            />
            <p>With descriptive aria-label</p>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of icons with proper accessibility attributes',
      },
    },
  },
};
