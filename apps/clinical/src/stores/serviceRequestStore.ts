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
  removeServiceRequest: (category: string, serviceRequestId: string) => void;
  updatePriority: (
    category: string,
    serviceRequestId: string,
    priority: SupportedServiceRequestPriority,
  ) => void;
  updateNote: (
    category: string,
    serviceRequestId: string,
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

    removeServiceRequest: (category: string, serviceRequestId: string) => {
      const currentServiceRequests =
        get().selectedServiceRequests.get(category);
      const updatedList = currentServiceRequests?.filter(
        (entry) => entry.id !== serviceRequestId,
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
      serviceRequestId: string,
      priority: SupportedServiceRequestPriority,
    ) => {
      const currentServiceRequests =
        get().selectedServiceRequests.get(category);
      if (!currentServiceRequests) return;

      const updatedList = currentServiceRequests.map((serviceRequest) => {
        if (serviceRequest.id !== serviceRequestId) {
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

    updateNote: (category: string, serviceRequestId: string, note: string) => {
      const currentServiceRequests =
        get().selectedServiceRequests.get(category);
      if (!currentServiceRequests) return;

      const updatedList = currentServiceRequests.map((serviceRequest) => {
        if (serviceRequest.id !== serviceRequestId) {
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
