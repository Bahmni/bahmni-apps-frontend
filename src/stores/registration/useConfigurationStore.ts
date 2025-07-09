import { create } from 'zustand';
import { PatientConfig } from '@/types/registration';

interface ConfigurationState {
  config: PatientConfig | null;
  setConfig: (config: PatientConfig) => void;
}

export const useConfigurationStore = create<ConfigurationState>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));
