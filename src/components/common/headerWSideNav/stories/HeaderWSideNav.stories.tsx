import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import HeaderWSideNav from '../HeaderWSideNav';
import BahmniIcon from '@/components/common/bahmniIcon/BahmniIcon';

// Create a decorator for better layout in Storybook
const HeaderDecorator = (Story: React.ComponentType) => (
  <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
    <Story />
  </div>
);

const meta: Meta<typeof HeaderWSideNav> = {
  title: 'Components/Common/HeaderWSideNav',
  component: HeaderWSideNav,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `

The HeaderWSideNav component combines a header with side navigation, breadcrumbs, and global actions. It serves as the primary navigation interface for the Bahmni Clinical application.

## Features

- **Side Navigation**: Provides main navigation options with icons
- **Breadcrumbs**: Shows hierarchical navigation context
- **Global Actions**: Quick access to global functions like search or notifications
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility Support**: ARIA-compliant for screen readers
- **i18n Support**: All text elements use translation keys

## When to use

Use this component for:
- Main application layouts that need primary navigation
- Clinical workflows where users need to navigate between different sections
- Interfaces where showing navigation hierarchy is important
- Applications requiring consistent header with global actions

## Integration

This component is typically used in layout components like \`ClinicalLayout\` to provide consistent navigation across the application.
        `,
      },
    },
  },
  decorators: [HeaderDecorator],
  tags: ['autodocs'],
  argTypes: {
    breadcrumbItems: {
      description: 'Array of breadcrumb items to display in the header',
      control: 'object',
      table: {
        type: { summary: 'HeaderBreadcrumbItem[]' },
        defaultValue: { summary: '[]' },
      },
    },
    globalActions: {
      description: 'Array of global action buttons to display in the header',
      control: 'object',
      table: {
        type: { summary: 'HeaderGlobalAction[]' },
        defaultValue: { summary: '[]' },
      },
    },
    sideNavItems: {
      description:
        'Array of navigation items to display in the side navigation',
      control: 'object',
      table: {
        type: { summary: 'HeaderSideNavItem[]' },
      },
    },
    activeSideNavItemId: {
      description: 'ID of the currently active side navigation item',
      control: 'text',
      table: {
        type: { summary: 'string | null' },
        defaultValue: { summary: 'null' },
      },
    },
    onSideNavItemClick: {
      description:
        'Callback function called when a side navigation item is clicked',
      control: false,
      table: {
        type: { summary: '(itemId: string) => void' },
      },
    },
    ariaLabel: {
      description: 'ARIA label for the header component for accessibility',
      control: 'text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"HeaderWSideNav"' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeaderWSideNav>;

/**
 * This is the basic configuration with minimal props.
 * It demonstrates the essential functionality of the component.
 */
export const Default: Story = {
  args: {
    sideNavItems: [
      { id: 'dashboard', icon: 'fa-dashboard', label: 'Dashboard' },
      { id: 'patients', icon: 'fa-user', label: 'Patients' },
      { id: 'reports', icon: 'fa-chart-bar', label: 'Reports' },
    ],
    activeSideNavItemId: 'dashboard',
    onSideNavItemClick: (id) => console.log(`Nav item clicked: ${id}`),
    ariaLabel: 'Bahmni Clinical',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic header with side navigation items only. No breadcrumbs or global actions are displayed.',
      },
    },
  },
};

/**
 * This example shows the header with breadcrumb navigation.
 * Breadcrumbs help users understand their current location in a hierarchical structure.
 */
export const WithBreadcrumbs: Story = {
  args: {
    ...Default.args,
    breadcrumbItems: [
      { id: 'home', label: 'Home', href: '#' },
      { id: 'patients', label: 'Patients', href: '#' },
      { id: 'current', label: 'Current Patient', isCurrentPage: true },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Header with breadcrumb navigation showing the user's current location in the application hierarchy. The last item is marked as the current page.",
      },
    },
  },
};

/**
 * This example shows the header with global action buttons in the top-right.
 * Global actions provide quick access to frequently used functions.
 */
export const WithGlobalActions: Story = {
  args: {
    ...Default.args,
    globalActions: [
      {
        id: 'search',
        label: 'Search',
        renderIcon: <BahmniIcon id="fa-search" name="fa-search" />,
        onClick: () => console.log('Search clicked'),
      },
      {
        id: 'notifications',
        label: 'Notifications',
        renderIcon: (
          <BahmniIcon id="fa-notifications" name="fa-notifications" />
        ),
        onClick: () => console.log('Notifications clicked'),
      },
      {
        id: 'settings',
        label: 'Settings',
        renderIcon: <BahmniIcon id="fa-settings" name="fa-settings" />,
        onClick: () => console.log('Settings clicked'),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Header with global action buttons in the top-right corner. These provide quick access to frequently used functions like search, notifications, and settings.',
      },
    },
  },
};

/**
 * This example demonstrates a complete header configuration with all features enabled.
 * It shows how the component looks with breadcrumbs, global actions, and side navigation.
 */
export const Complete: Story = {
  args: {
    breadcrumbItems: [
      { id: 'home', label: 'Home', href: '#' },
      { id: 'patients', label: 'Patients', href: '#' },
      { id: 'current', label: 'Current Patient', isCurrentPage: true },
    ],
    globalActions: [
      {
        id: 'search',
        label: 'Search',
        renderIcon: <BahmniIcon id="fa-search" name="fa-search" />,
        onClick: () => console.log('Search clicked'),
      },
      {
        id: 'notifications',
        label: 'Notifications',
        renderIcon: (
          <BahmniIcon id="fa-notifications" name="fa-notifications" />
        ),
        onClick: () => console.log('Notifications clicked'),
      },
      {
        id: 'help',
        label: 'Help',
        renderIcon: <BahmniIcon id="fa-help" name="fa-help" />,
        onClick: () => console.log('Help clicked'),
      },
    ],
    sideNavItems: [
      { id: 'dashboard', icon: 'fa-dashboard', label: 'Dashboard' },
      { id: 'patients', icon: 'fa-user', label: 'Patients' },
      { id: 'reports', icon: 'fa-chart-bar', label: 'Reports' },
      { id: 'settings', icon: 'fa-cog', label: 'Settings' },
    ],
    activeSideNavItemId: 'dashboard',
    onSideNavItemClick: (id) => console.log(`Nav item clicked: ${id}`),
    ariaLabel: 'Bahmni Clinical',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complete header configuration with breadcrumbs, global actions, and side navigation. This represents how the component typically appears in a full application.',
      },
    },
  },
};

/**
 * This example shows a clinically-focused configuration for a patient dashboard.
 * It demonstrates how the component can be used in a clinical context.
 */
export const PatientDashboard: Story = {
  args: {
    breadcrumbItems: [
      { id: 'home', label: 'Home', href: '#' },
      { id: 'patients', label: 'Patients', href: '#' },
      { id: 'patient', label: 'John Doe', isCurrentPage: true },
    ],
    globalActions: [
      {
        id: 'search',
        label: 'Search',
        renderIcon: <BahmniIcon id="fa-search" name="fa-search" />,
        onClick: () => console.log('Search clicked'),
      },
      {
        id: 'notifications',
        label: 'Notifications',
        renderIcon: (
          <BahmniIcon id="fa-notifications" name="fa-notifications" />
        ),
        onClick: () => console.log('Notifications clicked'),
      },
    ],
    sideNavItems: [
      { id: 'summary', icon: 'fa-dashboard', label: 'Summary' },
      { id: 'visits', icon: 'fa-calendar', label: 'Visits' },
      { id: 'conditions', icon: 'fa-heartbeat', label: 'Conditions' },
      { id: 'medications', icon: 'fa-pills', label: 'Medications' },
      { id: 'lab-results', icon: 'fa-flask', label: 'Lab Results' },
      { id: 'vitals', icon: 'fa-chart-line', label: 'Vitals' },
    ],
    activeSideNavItemId: 'summary',
    onSideNavItemClick: (id) => console.log(`Patient nav item clicked: ${id}`),
    ariaLabel: 'Patient Dashboard',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration for a patient dashboard showing patient-specific navigation items. This demonstrates how the component can be used in a patient-centric clinical workflow.',
      },
    },
  },
};

/**
 * This example shows a configuration for clinical consultation workflow.
 * It demonstrates how the component adapts to a specific clinical process.
 */
export const ClinicalConsultation: Story = {
  args: {
    breadcrumbItems: [
      { id: 'home', label: 'Home', href: '#' },
      { id: 'patients', label: 'Patients', href: '#' },
      { id: 'patient', label: 'John Doe', href: '#' },
      { id: 'consultation', label: 'Consultation', isCurrentPage: true },
    ],
    globalActions: [
      {
        id: 'save',
        label: 'Save',
        renderIcon: <BahmniIcon id="fa-save" name="fa-save" />,
        onClick: () => console.log('Save consultation clicked'),
      },
      {
        id: 'complete',
        label: 'Complete',
        renderIcon: <BahmniIcon id="fa-check" name="fa-check" />,
        onClick: () => console.log('Complete consultation clicked'),
      },
    ],
    sideNavItems: [
      { id: 'observations', icon: 'fa-stethoscope', label: 'Observations' },
      { id: 'diagnoses', icon: 'fa-clipboard-list', label: 'Diagnoses' },
      { id: 'medications', icon: 'fa-pills', label: 'Medications' },
      { id: 'orders', icon: 'fa-file-medical', label: 'Orders' },
      { id: 'notes', icon: 'fa-notes-medical', label: 'Notes' },
    ],
    activeSideNavItemId: 'observations',
    onSideNavItemClick: (id) =>
      console.log(`Consultation nav item clicked: ${id}`),
    ariaLabel: 'Clinical Consultation',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration for a clinical consultation workflow. This demonstrates how the component can be used during an active patient consultation, with appropriate navigation items and global actions for the clinical process.',
      },
    },
  },
};

/**
 * This example shows a department-specific configuration.
 * It demonstrates how the component can be customized for different clinical departments.
 */
export const DepartmentView: Story = {
  args: {
    breadcrumbItems: [
      { id: 'home', label: 'Home', href: '#' },
      { id: 'departments', label: 'Departments', href: '#' },
      { id: 'department', label: 'Pediatrics', isCurrentPage: true },
    ],
    globalActions: [
      {
        id: 'search',
        label: 'Search',
        renderIcon: <BahmniIcon id="fa-search" name="fa-search" />,
        onClick: () => console.log('Search clicked'),
      },
      {
        id: 'notifications',
        label: 'Notifications',
        renderIcon: (
          <BahmniIcon id="fa-notifications" name="fa-notifications" />
        ),
        onClick: () => console.log('Notifications clicked'),
      },
    ],
    sideNavItems: [
      { id: 'dashboard', icon: 'fa-dashboard', label: 'Dashboard' },
      { id: 'appointments', icon: 'fa-calendar', label: 'Appointments' },
      { id: 'patients', icon: 'fa-user', label: 'Patients' },
      { id: 'reports', icon: 'fa-chart-bar', label: 'Reports' },
      { id: 'protocols', icon: 'fa-clipboard-list', label: 'Protocols' },
    ],
    activeSideNavItemId: 'dashboard',
    onSideNavItemClick: (id) =>
      console.log(`Department nav item clicked: ${id}`),
    ariaLabel: 'Pediatrics Department',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Configuration for a department-specific view. This demonstrates how the component can be customized for different clinical departments within a healthcare facility.',
      },
    },
  },
};

/**
 * This example shows the component with custom CSS classes.
 * It demonstrates how the component's appearance can be customized.
 */
export const WithCustomStyling: Story = {
  args: {
    ...Complete.args,
    // Custom class names would be applied here in a real implementation
  },
  parameters: {
    docs: {
      description: {
        story: `
Configuration with custom styling. In a real implementation, you could apply custom CSS classes to modify the component's appearance.

\`\`\`scss
// Example of custom SCSS that could be used
.custom-header {
  border-bottom: 2px solid var(--brand-primary);

  .breadcrumb {
    font-weight: 500;
  }

  :global(.cds--side-nav) {
    background-color: var(--background-subtle);
  }
}
\`\`\`
      `,
      },
    },
  },
};

/**
 * This example demonstrates accessibility features of the component.
 * It highlights how the component supports keyboard navigation and screen readers.
 */
export const AccessibilityFeatures: Story = {
  args: {
    ...Complete.args,
    ariaLabel: 'Accessible Navigation',
  },
  parameters: {
    docs: {
      description: {
        story: `
This example highlights the accessibility features of the HeaderWSideNav component:

- **ARIA Labels**: The header has an ARIA label for screen readers
- **Keyboard Navigation**: All navigation items and actions are keyboard accessible
- **Focus Management**: Proper focus handling for interactive elements
- **Screen Reader Support**: Compatible with screen readers through proper ARIA attributes
- **Color Contrast**: Meets WCAG AA standards for color contrast
- **Internationalization**: All text uses translation keys for localization

Keyboard navigation:
- Tab: Navigate between interactive elements
- Enter/Space: Activate the focused element
- Arrow keys: Navigate within the side navigation

The component inherits accessibility features from Carbon Design System components.
        `,
      },
    },
  },
};

/**
 * This example demonstrates the component in a mobile context.
 * It shows how the component responds to smaller screen sizes.
 */
export const MobileView: Story = {
  args: {
    ...PatientDashboard.args,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: `
This example demonstrates how the HeaderWSideNav component adapts to mobile screens:

- Side navigation collapses to a rail view on mobile devices
- Breadcrumbs adapt to show only the current page on smaller screens
- Touch targets are appropriately sized for mobile interaction
- Layout adjusts to maintain usability on smaller screens

The responsive behavior is handled automatically by:
- The useHeaderSideNav hook which detects screen size
- Responsive CSS using Carbon's breakpoint mixins
- Adaptive layout in the Carbon components

This ensures the component remains usable across all device sizes, which is essential for healthcare environments where both desktop and mobile devices may be used.
        `,
      },
    },
  },
};

/**
 * This example shows how the component integrates with the i18n system.
 * It demonstrates the component's internationalization support.
 */
export const InternationalizationSupport: Story = {
  args: {
    ...Complete.args,
  },
  parameters: {
    docs: {
      description: {
        story: `
This example demonstrates the internationalization features of the HeaderWSideNav component:

- All text content uses translation keys
- Navigation labels are translated using the i18next system
- ARIA labels are also translated for accessibility across languages
- Right-to-left (RTL) language support inherited from Carbon components

In the actual implementation:
\`\`\`tsx
// Translation happens through the useTranslation hook
const { t } = useTranslation();

// Text is displayed using the translation function
<BreadcrumbItem>
  {t(item.label)}
</BreadcrumbItem>
\`\`\`

This ensures the component can be used in multilingual healthcare environments and supports the diverse language needs of global healthcare systems.
        `,
      },
    },
  },
};

/**
 * This example shows how the component is used in a clinical workflow.
 * It demonstrates a comprehensive real-world usage scenario.
 */
export const ClinicalWorkflowExample: Story = {
  args: {
    breadcrumbItems: [
      { id: 'home', label: 'Home', href: '#' },
      { id: 'outpatient', label: 'Outpatient', href: '#' },
      { id: 'patient', label: 'Smith, John (43M)', href: '#' },
      { id: 'visit', label: 'Visit 05-May-2025', isCurrentPage: true },
    ],
    globalActions: [
      {
        id: 'search',
        label: 'Search',
        renderIcon: <BahmniIcon id="fa-search" name="fa-search" />,
        onClick: () => console.log('Search clicked'),
      },
      {
        id: 'user',
        label: 'User Profile',
        renderIcon: <BahmniIcon id="fa-user" name="fa-user" />,
        onClick: () => console.log('User profile clicked'),
      },
      {
        id: 'help',
        label: 'Help',
        renderIcon: <BahmniIcon id="fa-help" name="fa-help" />,
        onClick: () => console.log('Help clicked'),
      },
    ],
    sideNavItems: [
      { id: 'summary', icon: 'fa-dashboard', label: 'Summary' },
      { id: 'vitals', icon: 'fa-heartbeat', label: 'Vitals' },
      { id: 'orders', icon: 'fa-file-medical', label: 'Orders' },
      { id: 'observations', icon: 'fa-stethoscope', label: 'Observations' },
      { id: 'medications', icon: 'fa-pills', label: 'Medications' },
      { id: 'lab-results', icon: 'fa-flask', label: 'Lab Results' },
      { id: 'notes', icon: 'fa-notes-medical', label: 'Notes' },
      { id: 'disposition', icon: 'fa-clipboard-check', label: 'Disposition' },
    ],
    activeSideNavItemId: 'observations',
    onSideNavItemClick: (id) =>
      console.log(`Clinical workflow nav item clicked: ${id}`),
    ariaLabel: 'Clinical Workflow',
  },
  parameters: {
    docs: {
      description: {
        story: `
This example demonstrates a comprehensive real-world usage of the HeaderWSideNav component in a clinical workflow:

1. **Context**: An outpatient visit for patient John Smith
2. **Breadcrumb Trail**: Shows the navigation path from home to the current visit
3. **Global Actions**: Provides quick access to search, user profile, and help
4. **Clinical Navigation**: Side navigation items specific to the clinical visit workflow
5. **Current Section**: The "Observations" section is active

This configuration showcases how the component serves as the primary navigation hub during clinical care delivery, allowing healthcare providers to efficiently access different aspects of the patient's record and clinical documentation.

The component helps maintain clinical context throughout the workflow, ensuring healthcare providers always know which patient they're working with and what section of the clinical record they're viewing.
        `,
      },
    },
  },
};

/**
 * Implementation guidance for developers using this component.
 */
export const ImplementationGuidance: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Implementation Best Practices

### Basic Implementation

\`\`\`tsx
import React from 'react';
import HeaderWSideNav from '@components/common/headerWSideNav/HeaderWSideNav';
import { useNavigate, useLocation } from 'react-router-dom';

const MyLayout: React.FC = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define navigation items
  const sideNavItems = [
    { id: 'dashboard', icon: 'fa-dashboard', label: 'Dashboard' },
    { id: 'patients', icon: 'fa-user', label: 'Patients' },
    // Additional items...
  ];

  // Determine active item based on current route
  const getActiveItemId = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/patients')) return 'patients';
    // Additional route checks...
    return null;
  };

  // Handle navigation item clicks
  const handleSideNavItemClick = (itemId: string) => {
    switch (itemId) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'patients':
        navigate('/patients');
        break;
      // Additional navigation handlers...
    }
  };

  return (
    <div className="layout">
      <HeaderWSideNav
        sideNavItems={sideNavItems}
        activeSideNavItemId={getActiveItemId()}
        onSideNavItemClick={handleSideNavItemClick}
        ariaLabel="My Application"
      />
      <main>
        {children}
      </main>
    </div>
  );
};

export default MyLayout;
\`\`\`

### Integration with Breadcrumbs

For dynamic breadcrumbs based on the route:

\`\`\`tsx
// Generate breadcrumbs based on the current route
const getBreadcrumbs = () => {
  const path = location.pathname;
  const breadcrumbs = [{ id: 'home', label: 'Home', href: '/' }];

  if (path.includes('/patients')) {
    breadcrumbs.push({ id: 'patients', label: 'Patients', href: '/patients' });

    // If on a specific patient page
    if (path.match(/\\/patients\\/[\\w-]+$/)) {
      const patientId = path.split('/').pop();
      breadcrumbs.push({
        id: 'patient',
        label: \`Patient \${patientId}\`,
        isCurrentPage: true
      });
    }
  }

  return breadcrumbs;
};
\`\`\`

### Integration with Global Actions

For global actions like search or notifications:

\`\`\`tsx
import { Search, Notification, Help } from '@carbon/icons-react';

// Define global actions
const globalActions = [
  {
    id: 'search',
    label: 'Search',
    renderIcon: Search,
    onClick: () => setSearchModalOpen(true),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    renderIcon: Notification,
    onClick: () => setNotificationsOpen(true),
  },
  {
    id: 'help',
    label: 'Help',
    renderIcon: Help,
    onClick: () => setHelpPanelOpen(true),
  },
];
\`\`\`

### Performance Considerations

- Use React.memo for stable props to prevent unnecessary re-renders
- Memoize callback functions with useCallback
- Consider the impact of icon loading on performance

### Accessibility Guidelines

- Ensure all navigation items have meaningful labels
- Use appropriate ARIA attributes for custom interactions
- Test keyboard navigation thoroughly
- Verify screen reader compatibility

### Mobile Considerations

- Test on various screen sizes to ensure responsive behavior
- Ensure touch targets are at least 44x44px for mobile users
- Consider the collapsed rail state for mobile navigation
        `,
      },
    },
  },
};
