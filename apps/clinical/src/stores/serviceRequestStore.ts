import { create } from 'zustand';
import {
  ServiceRequestInputEntry,
  SupportedServiceRequestPriority,
} from '../models/serviceRequest';

export interface ServiceRequestState {
  selectedServiceRequests: Map<string, ServiceRequestInputEntry[]>;

  addServiceRequest: (
    category: string,
    conceptUUID: string,
    display: string,
  ) => void;
  removeServiceRequest: (category: string, serviceRequestUid: string) => void;
  updatePriority: (
    category: string,
    serviceRequestUid: string,
    priority: SupportedServiceRequestPriority,
  ) => void;
  updateNote: (
    category: string,
    serviceRequestUid: string,
    note: string,
  ) => void;
  reset: () => void;
  getState: () => ServiceRequestState;
}

export const useServiceRequestStore = create<ServiceRequestState>(
  (set, get) => ({
    selectedServiceRequests: new Map<string, ServiceRequestInputEntry[]>(),

    addServiceRequest: (
      category: string,
      conceptUUID: string,
      display: string,
    ) => {
      const newServiceRequest: ServiceRequestInputEntry = {
        uid: crypto.randomUUID(),
        id: conceptUUID,
        selectedPriority: 'routine',
        display: display,
      };

      const currentServiceRequests =
        get().selectedServiceRequests.get(category);
      const updatedList = currentServiceRequests
        ? [newServiceRequest, ...currentServiceRequests]
        : [newServiceRequest];

      set((state) => ({
        selectedServiceRequests: new Map(state.selectedServiceRequests).set(
          category,
          updatedList,
        ),
      }));
    },

    removeServiceRequest: (category: string, serviceRequestUid: string) => {
      const currentServiceRequests =
        get().selectedServiceRequests.get(category);
      const updatedList = currentServiceRequests?.filter(
        (entry) => entry.uid !== serviceRequestUid,
      );

      set((state) => {
        const newMap = new Map(state.selectedServiceRequests);
        if (updatedList && updatedList.length > 0) {
          newMap.set(category, updatedList);
        } else {
          newMap.delete(category);
        }
        return { selectedServiceRequests: newMap };
      });
    },

    updatePriority: (
      category: string,
      serviceRequestUid: string,
      priority: SupportedServiceRequestPriority,
    ) => {
      const currentServiceRequests =
        get().selectedServiceRequests.get(category);
      if (!currentServiceRequests) return;

      const updatedList = currentServiceRequests.map((serviceRequest) => {
        if (serviceRequest.uid !== serviceRequestUid) {
          return serviceRequest;
        }
        return {
          ...serviceRequest,
          selectedPriority: priority,
        };
      });

      set((state) => ({
        selectedServiceRequests: new Map(state.selectedServiceRequests).set(
          category,
          updatedList,
        ),
      }));
    },

    updateNote: (category: string, serviceRequestUid: string, note: string) => {
      const currentServiceRequests =
        get().selectedServiceRequests.get(category);
      if (!currentServiceRequests) return;

      const updatedList = currentServiceRequests.map((serviceRequest) => {
        if (serviceRequest.uid !== serviceRequestUid) {
          return serviceRequest;
        }
        return {
          ...serviceRequest,
          note: note,
        };
      });

      set((state) => ({
        selectedServiceRequests: new Map(state.selectedServiceRequests).set(
          category,
          updatedList,
        ),
      }));
    },

    reset: () => {
      set({
        selectedServiceRequests: new Map<string, ServiceRequestInputEntry[]>(),
      });
    },

    getState: () => get(),
  }),
);

export default useServiceRequestStore;
