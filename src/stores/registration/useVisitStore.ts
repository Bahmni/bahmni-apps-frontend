import { create } from 'zustand';
import { Visit } from '@/types/registration';

interface VisitState {
  activeVisit: Visit | null;
  setActiveVisit: (visit: Visit | null) => void;
}

export const useVisitStore = create<VisitState>((set) => ({
  activeVisit: null,
  setActiveVisit: (visit) => set({ activeVisit: visit }),
}));
