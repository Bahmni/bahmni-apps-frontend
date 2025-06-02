// Define supported control types as a union type for type safety
export type ControlType = 'allergies' | 'conditions' | 'diagnoses' | 'labInvestigations' | 'patient';

// Enhanced control configuration interface
export interface ControlConfig {
  type: ControlType;
}

// Updated DashboardSectionConfig with better typing
export interface DashboardSectionConfig {
  name: string;
  translationKey?: string;
  icon: string;
  controls: ControlConfig[]; // Changed from fixed array to flexible array
}

export interface DashboardConfig {
  sections: DashboardSectionConfig[];
}
