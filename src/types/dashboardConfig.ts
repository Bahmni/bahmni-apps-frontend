// Define supported control types as a union type for type safety
export type ControlType = 'allergies' | 'conditions' | 'diagnoses' | 'labInvestigations' | 'patient';

// Enhanced control configuration interface
export interface ControlConfig {
  id: string;
  type: ControlType;
  props?: Record<string, any>; // Control-specific props
  config?: Record<string, any>; // Control-specific configuration
  enabled?: boolean; // Whether the control is enabled
}

// Updated DashboardSectionConfig with better typing
export interface DashboardSectionConfig {
  id: string;
  name: string;
  translationKey?: string;
  icon: string;
  controls: ControlConfig[]; // Changed from fixed array to flexible array
  enabled?: boolean; // Whether the section is enabled
  order?: number; // Display order
}

export interface DashboardConfig {
  sections: DashboardSectionConfig[];
  version?: string; // Configuration version for future compatibility
}

// Control component interface for registry
export interface ControlComponent {
  component: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
  displayName?: string;
}
