import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { SupportedServiceRequestPriority } from '../../models/serviceRequest';
import { useServiceRequestStore } from '../serviceRequestStore';

describe('useServiceRequestStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useServiceRequestStore());
    act(() => {
      result.current.reset();
    });
  });

  // INITIALIZATION TESTS
  describe('Initialization', () => {
    test('should initialize with empty selected service requests map', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      expect(result.current.selectedServiceRequests).toBeInstanceOf(Map);
      expect(result.current.selectedServiceRequests.size).toBe(0);
    });
  });

  // ADD SERVICE REQUEST TESTS
  describe('addServiceRequest', () => {
    test('should add a new service request to a category', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests).toBeDefined();
      expect(categoryRequests).toHaveLength(1);
      expect(categoryRequests![0].id).toBe(conceptUUID);
      expect(categoryRequests![0].selectedPriority).toBe('routine');
      expect(categoryRequests![0].display).toBe('Test Display');
      expect(typeof categoryRequests![0].uid).toBe('string');
      expect(categoryRequests![0].uid).toBeTruthy();
    });

    test('should generate unique uid for each service request', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';

      act(() => {
        result.current.addServiceRequest(category, 'test-uuid-1', 'Test 1');
        result.current.addServiceRequest(category, 'test-uuid-1', 'Test 2');
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests).toHaveLength(2);
      expect(categoryRequests![0].uid).not.toBe(categoryRequests![1].uid);
    });

    test('should add multiple service requests to the same category', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID1 = 'test-uuid-1';
      const conceptUUID2 = 'test-uuid-2';

      act(() => {
        result.current.addServiceRequest(
          category,
          conceptUUID1,
          'Test Display 1',
        );
        result.current.addServiceRequest(
          category,
          conceptUUID2,
          'Test Display 2',
        );
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests).toHaveLength(2);
      expect(categoryRequests![0].id).toBe(conceptUUID2); // Most recent first
      expect(categoryRequests![1].id).toBe(conceptUUID1);
    });

    test('should add duplicate service requests (same concept id) to a category', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests).toHaveLength(2);
      expect(categoryRequests![0].id).toBe(conceptUUID);
      expect(categoryRequests![1].id).toBe(conceptUUID);
      // Each entry should have a unique uid
      expect(categoryRequests![0].uid).not.toBe(categoryRequests![1].uid);
    });

    test('should add service requests to different categories', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category1 = 'lab';
      const category2 = 'radiology';
      const conceptUUID1 = 'test-uuid-1';
      const conceptUUID2 = 'test-uuid-2';

      act(() => {
        result.current.addServiceRequest(category1, conceptUUID1, 'Lab Test');
        result.current.addServiceRequest(
          category2,
          conceptUUID2,
          'Radiology Test',
        );
      });

      expect(result.current.selectedServiceRequests.size).toBe(2);
      expect(
        result.current.selectedServiceRequests.get(category1),
      ).toHaveLength(1);
      expect(
        result.current.selectedServiceRequests.get(category2),
      ).toHaveLength(1);
    });

    test('should create new service request with default priority as routine', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests![0].selectedPriority).toBe('routine');
    });

    test('should store the display name provided', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';
      const displayName = 'Complete Blood Count';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, displayName);
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests![0].display).toBe(displayName);
    });

    test('should handle empty display name', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, '');
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests![0].display).toBe('');
    });

    test('should handle special characters in display name', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';
      const displayName = 'Test & Measurement (Special) - 123';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, displayName);
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests![0].display).toBe(displayName);
    });

    test('should maintain unique display names for different service requests', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID1 = 'test-uuid-1';
      const conceptUUID2 = 'test-uuid-2';
      const displayName1 = 'Blood Test';
      const displayName2 = 'Urine Test';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID1, displayName1);
        result.current.addServiceRequest(category, conceptUUID2, displayName2);
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests![0].display).toBe(displayName2); // Most recent first
      expect(categoryRequests![1].display).toBe(displayName1);
    });
  });

  // REMOVE SERVICE REQUEST TESTS
  describe('removeServiceRequest', () => {
    test('should remove a service request from a category by uid', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
      });

      expect(result.current.selectedServiceRequests.get(category)).toHaveLength(
        1,
      );

      const uid = result.current.selectedServiceRequests.get(category)![0].uid;

      act(() => {
        result.current.removeServiceRequest(category, uid);
      });

      // When all items are removed, the category should be deleted from the Map
      expect(
        result.current.selectedServiceRequests.get(category),
      ).toBeUndefined();
      expect(result.current.selectedServiceRequests.has(category)).toBe(false);
    });

    test('should remove only the specified service request by uid from multiple requests', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';

      act(() => {
        result.current.addServiceRequest(category, 'test-uuid-1', 'Test 1');
        result.current.addServiceRequest(category, 'test-uuid-2', 'Test 2');
        result.current.addServiceRequest(category, 'test-uuid-3', 'Test 3');
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category)!;
      // Most recent first: uuid-3, uuid-2, uuid-1
      const uidToRemove = categoryRequests.find(
        (r) => r.id === 'test-uuid-2',
      )!.uid;

      act(() => {
        result.current.removeServiceRequest(category, uidToRemove);
      });

      const afterRemoval = result.current.selectedServiceRequests.get(category);
      expect(afterRemoval).toHaveLength(2);
      expect(
        afterRemoval!.find((req) => req.id === 'test-uuid-2'),
      ).toBeUndefined();
      expect(
        afterRemoval!.find((req) => req.id === 'test-uuid-1'),
      ).toBeDefined();
      expect(
        afterRemoval!.find((req) => req.id === 'test-uuid-3'),
      ).toBeDefined();
    });

    test('should remove only one of two duplicate concept-id entries by uid', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
      });

      expect(result.current.selectedServiceRequests.get(category)).toHaveLength(
        2,
      );

      const uid = result.current.selectedServiceRequests.get(category)![0].uid;

      act(() => {
        result.current.removeServiceRequest(category, uid);
      });

      expect(result.current.selectedServiceRequests.get(category)).toHaveLength(
        1,
      );
    });

    test('should handle removing from non-existent category gracefully', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'non-existent';
      const uid = 'some-uid';

      expect(() => {
        act(() => {
          result.current.removeServiceRequest(category, uid);
        });
      }).not.toThrow();

      // Non-existent category should remain undefined
      expect(
        result.current.selectedServiceRequests.get(category),
      ).toBeUndefined();
      expect(result.current.selectedServiceRequests.has(category)).toBe(false);
    });

    test('should handle removing non-existent uid gracefully', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID1 = 'test-uuid-1';

      act(() => {
        result.current.addServiceRequest(
          category,
          conceptUUID1,
          'Test Display',
        );
      });

      act(() => {
        result.current.removeServiceRequest(category, 'non-existent-uid');
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests).toHaveLength(1);
      expect(categoryRequests![0].id).toBe(conceptUUID1);
    });
  });

  // UPDATE NOTE TESTS
  describe('updateNote', () => {
    test('should update note of a service request by uid', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';
      const note = 'Patient has low hemoglobin levels';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
      });

      const uid = result.current.selectedServiceRequests.get(category)![0].uid;

      act(() => {
        result.current.updateNote(category, uid, note);
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests![0].note).toBe(note);
    });

    test('should update note of only the specified service request by uid', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const note = 'Special instructions for test 1';

      act(() => {
        result.current.addServiceRequest(category, 'test-uuid-1', 'Test 1');
        result.current.addServiceRequest(category, 'test-uuid-2', 'Test 2');
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category)!;
      const uid1 = categoryRequests.find((r) => r.id === 'test-uuid-1')!.uid;

      act(() => {
        result.current.updateNote(category, uid1, note);
      });

      const updatedRequests =
        result.current.selectedServiceRequests.get(category)!;
      const request1 = updatedRequests.find((req) => req.id === 'test-uuid-1');
      const request2 = updatedRequests.find((req) => req.id === 'test-uuid-2');

      expect(request1!.note).toBe(note);
      expect(request2!.note).toBeUndefined();
    });

    test('should handle updating note for non-existent category gracefully', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'non-existent';
      const uid = 'some-uid';
      const note = 'Test note';

      expect(() => {
        act(() => {
          result.current.updateNote(category, uid, note);
        });
      }).not.toThrow();

      expect(
        result.current.selectedServiceRequests.get(category),
      ).toBeUndefined();
      expect(result.current.selectedServiceRequests.has(category)).toBe(false);
    });

    test('should handle empty note string', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
      });

      const uid = result.current.selectedServiceRequests.get(category)![0].uid;

      act(() => {
        result.current.updateNote(category, uid, 'Initial note');
      });

      act(() => {
        result.current.updateNote(category, uid, '');
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests![0].note).toBe('');
    });

    test('should update notes independently for different categories', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const labCategory = 'lab';
      const radiologyCategory = 'radiology';
      const labNote = 'Lab note';
      const radNote = 'Radiology note';

      act(() => {
        result.current.addServiceRequest(labCategory, 'lab-uuid-1', 'Lab Test');
        result.current.addServiceRequest(
          radiologyCategory,
          'rad-uuid-1',
          'Rad Test',
        );
      });

      const labUid =
        result.current.selectedServiceRequests.get(labCategory)![0].uid;
      const radUid =
        result.current.selectedServiceRequests.get(radiologyCategory)![0].uid;

      act(() => {
        result.current.updateNote(labCategory, labUid, labNote);
        result.current.updateNote(radiologyCategory, radUid, radNote);
      });

      const labRequests =
        result.current.selectedServiceRequests.get(labCategory);
      const radRequests =
        result.current.selectedServiceRequests.get(radiologyCategory);

      expect(labRequests![0].note).toBe(labNote);
      expect(radRequests![0].note).toBe(radNote);
    });
  });

  // UPDATE PRIORITY TESTS
  describe('updatePriority', () => {
    test('should update priority of a service request by uid', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';
      const newPriority: SupportedServiceRequestPriority = 'stat';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
      });

      const uid = result.current.selectedServiceRequests.get(category)![0].uid;

      act(() => {
        result.current.updatePriority(category, uid, newPriority);
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests![0].selectedPriority).toBe(newPriority);
    });

    test('should update priority of only the specified service request by uid', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const newPriority: SupportedServiceRequestPriority = 'stat';

      act(() => {
        result.current.addServiceRequest(category, 'test-uuid-1', 'Test 1');
        result.current.addServiceRequest(category, 'test-uuid-2', 'Test 2');
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category)!;
      const uid1 = categoryRequests.find((r) => r.id === 'test-uuid-1')!.uid;

      act(() => {
        result.current.updatePriority(category, uid1, newPriority);
      });

      const updatedRequests =
        result.current.selectedServiceRequests.get(category)!;
      const request1 = updatedRequests.find((req) => req.id === 'test-uuid-1');
      const request2 = updatedRequests.find((req) => req.id === 'test-uuid-2');

      expect(request1!.selectedPriority).toBe(newPriority);
      expect(request2!.selectedPriority).toBe('routine');
    });

    test('should handle updating priority for non-existent category gracefully', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'non-existent';
      const uid = 'some-uid';
      const newPriority: SupportedServiceRequestPriority = 'stat';

      expect(() => {
        act(() => {
          result.current.updatePriority(category, uid, newPriority);
        });
      }).not.toThrow();

      // Non-existent category should remain undefined
      expect(
        result.current.selectedServiceRequests.get(category),
      ).toBeUndefined();
      expect(result.current.selectedServiceRequests.has(category)).toBe(false);
    });

    test('should handle updating priority for non-existent uid gracefully', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID1 = 'test-uuid-1';
      const newPriority: SupportedServiceRequestPriority = 'stat';

      act(() => {
        result.current.addServiceRequest(
          category,
          conceptUUID1,
          'Test Display',
        );
      });

      act(() => {
        result.current.updatePriority(
          category,
          'non-existent-uid',
          newPriority,
        );
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests).toHaveLength(1);
      expect(categoryRequests![0].selectedPriority).toBe('routine');
    });

    test('should preserve other properties when updating priority', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';
      const newPriority: SupportedServiceRequestPriority = 'stat';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
      });

      const originalRequest =
        result.current.selectedServiceRequests.get(category)![0];

      act(() => {
        result.current.updatePriority(
          category,
          originalRequest.uid,
          newPriority,
        );
      });

      const updatedRequest =
        result.current.selectedServiceRequests.get(category)![0];
      expect(updatedRequest.uid).toBe(originalRequest.uid);
      expect(updatedRequest.id).toBe(originalRequest.id);
      expect(updatedRequest.display).toBe(originalRequest.display);
      expect(updatedRequest.selectedPriority).toBe(newPriority);
    });
  });

  // RESET TESTS
  describe('reset', () => {
    test('should clear all service requests', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category1 = 'lab';
      const category2 = 'radiology';

      act(() => {
        result.current.addServiceRequest(category1, 'test-uuid-1', 'Test 1');
        result.current.addServiceRequest(category1, 'test-uuid-2', 'Test 2');
        result.current.addServiceRequest(category2, 'test-uuid-3', 'Test 3');
      });

      expect(result.current.selectedServiceRequests.size).toBe(2);

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedServiceRequests.size).toBe(0);
      expect(result.current.selectedServiceRequests).toBeInstanceOf(Map);
    });

    test('should create a new Map instance after reset', () => {
      const { result } = renderHook(() => useServiceRequestStore());

      act(() => {
        result.current.addServiceRequest('lab', 'test-uuid-1', 'Test Display');
      });

      const originalMap = result.current.selectedServiceRequests;

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedServiceRequests).not.toBe(originalMap);
      expect(result.current.selectedServiceRequests).toBeInstanceOf(Map);
    });
  });

  // GET STATE TESTS
  describe('getState', () => {
    test('should return the current state', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, 'Test Display');
      });

      const state = result.current.getState();
      expect(state).toHaveProperty('selectedServiceRequests');
      expect(state).toHaveProperty('addServiceRequest');
      expect(state).toHaveProperty('removeServiceRequest');
      expect(state).toHaveProperty('updatePriority');
      expect(state).toHaveProperty('reset');
      expect(state).toHaveProperty('getState');
      expect(state.selectedServiceRequests.get(category)).toHaveLength(1);
    });
  });

  // EDGE CASES AND INTEGRATION TESTS
  describe('Edge cases and integration', () => {
    test('should handle complex workflow of adding, updating, and removing', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const uuids = ['uuid-1', 'uuid-2', 'uuid-3'];

      // Add multiple service requests
      act(() => {
        uuids.forEach((uuid, index) =>
          result.current.addServiceRequest(category, uuid, `Test ${index + 1}`),
        );
      });

      expect(result.current.selectedServiceRequests.get(category)).toHaveLength(
        3,
      );

      const requests = result.current.selectedServiceRequests.get(category)!;
      const uid2 = requests.find((r) => r.id === 'uuid-2')!.uid;
      const uid1 = requests.find((r) => r.id === 'uuid-1')!.uid;

      // Update priority of middle item
      act(() => {
        result.current.updatePriority(category, uid2, 'stat');
      });

      // Remove first item
      act(() => {
        result.current.removeServiceRequest(category, uid1);
      });

      const finalRequests =
        result.current.selectedServiceRequests.get(category);
      expect(finalRequests).toHaveLength(2);
      expect(
        finalRequests!.find((req) => req.id === 'uuid-2')!.selectedPriority,
      ).toBe('stat');
      expect(
        finalRequests!.find((req) => req.id === 'uuid-3')!.selectedPriority,
      ).toBe('routine');
    });

    test('should maintain separate categories independently', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const labCategory = 'lab';
      const radiologyCategory = 'radiology';

      act(() => {
        result.current.addServiceRequest(labCategory, 'lab-uuid-1', 'Lab Test');
        result.current.addServiceRequest(
          radiologyCategory,
          'rad-uuid-1',
          'Radiology Test',
        );
      });

      const labUid =
        result.current.selectedServiceRequests.get(labCategory)![0].uid;

      act(() => {
        result.current.updatePriority(labCategory, labUid, 'stat');
      });

      const labRequests =
        result.current.selectedServiceRequests.get(labCategory);
      const radiologyRequests =
        result.current.selectedServiceRequests.get(radiologyCategory);

      expect(labRequests![0].selectedPriority).toBe('stat');
      expect(radiologyRequests![0].selectedPriority).toBe('routine');
    });

    test('should handle adding duplicate service requests with same concept id (duplicates now allowed)', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';

      act(() => {
        result.current.addServiceRequest(
          category,
          conceptUUID,
          'First Display',
        );
        result.current.addServiceRequest(
          category,
          conceptUUID,
          'Second Display',
        );
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests).toHaveLength(2);
      expect(categoryRequests![0].display).toBe('Second Display');
      expect(categoryRequests![1].display).toBe('First Display');
      // Both should have the same concept ID
      expect(categoryRequests![0].id).toBe(conceptUUID);
      expect(categoryRequests![1].id).toBe(conceptUUID);
      // But each should have a unique uid
      expect(categoryRequests![0].uid).not.toBe(categoryRequests![1].uid);
    });

    test('should preserve display name when updating priority', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';
      const displayName = 'Blood Glucose Test';

      act(() => {
        result.current.addServiceRequest(category, conceptUUID, displayName);
      });

      const uid = result.current.selectedServiceRequests.get(category)![0].uid;

      act(() => {
        result.current.updatePriority(category, uid, 'stat');
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests![0].display).toBe(displayName);
      expect(categoryRequests![0].selectedPriority).toBe('stat');
    });

    test('should handle very long display names', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';
      const longDisplayName = 'A'.repeat(500); // 500 character display name

      act(() => {
        result.current.addServiceRequest(
          category,
          conceptUUID,
          longDisplayName,
        );
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests![0].display).toBe(longDisplayName);
      expect(categoryRequests![0].display).toHaveLength(500);
    });

    test('should handle unicode characters in display name', () => {
      const { result } = renderHook(() => useServiceRequestStore());
      const category = 'lab';
      const conceptUUID = 'test-uuid-1';
      const unicodeDisplayName = '血液検査 🩸 (Blood Test)';

      act(() => {
        result.current.addServiceRequest(
          category,
          conceptUUID,
          unicodeDisplayName,
        );
      });

      const categoryRequests =
        result.current.selectedServiceRequests.get(category);
      expect(categoryRequests![0].display).toBe(unicodeDisplayName);
    });
  });
});
