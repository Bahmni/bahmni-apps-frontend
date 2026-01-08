# Consultation Event System - Technical Design Document

## Executive Summary

This document describes the architectural approach for decoupling consultation data refresh logic using an event-driven publish-subscribe pattern. The goal is to move data refetch responsibility from `ConsultationPad` to individual dashboard widgets (e.g., `ConditionsTable`, `AllergiesTable`), achieving better separation of concerns and scalability.

**Problem:** Currently, `ConsultationPad` manually calls `refreshQueries` for conditions after saving, creating tight coupling.

**Solution:** Implement an event-driven pub-sub pattern using Window CustomEvents where `ConsultationPad` publishes a "consultation saved" event with metadata about what changed, and dashboard widgets selectively refetch their own data.

**Benefits:**

- ✅ Complete decoupling between ConsultationPad and widgets
- ✅ Scalable - easy to add new widgets without modifying ConsultationPad
- ✅ Selective refetch - only widgets with changed data refetch
- ✅ Type-safe event handling with TypeScript
- ✅ Testable - components can be tested independently

---

## 1. Current State Analysis

### Problem Description

**File:** `apps/clinical/src/components/consultationPad/ConsultationPad.tsx` (lines 267-270)

```typescript
// ❌ Current Implementation - Tight Coupling
if (selectedConditions.length > 0)
  await refreshQueries(queryClient, conditionsQueryKeys(patientUUID));
```

**Issues:**

1. **Incomplete Invalidation**: Only conditions get refreshed; allergies, medications, and investigations are ignored
2. **Tight Coupling**: ConsultationPad imports `conditionsQueryKeys` from `@bahmni/widgets`
3. **Not Scalable**: Adding new widgets (AllergiesTable, MedicationsTable) requires modifying ConsultationPad
4. **Violates Single Responsibility Principle**: ConsultationPad shouldn't know about widget internals
5. **Hard to Test**: Cannot test widgets' refetch behavior independently

### Current Flow

```
ConsultationPad
    │
    ├─ Saves consultation data
    │
    ├─ Directly calls refreshQueries(conditionsQueryKeys)
    │
    └─ ConditionsTable cache is invalidated
         (Other widgets ignored ❌)
```

---

## 2. Proposed Architecture

### Event-Driven Flow

```
ConsultationPad
    │
    ├─ Saves consultation data
    │
    ├─ Publishes "consultation:saved" event
    │   with metadata: { changedWidgets: { conditions: true, allergies: false, ... } }
    │
    └─ Event broadcast to all subscribers
          │
          ├─ ConditionsTable (listening)
          │   └─ Checks: changedWidgets.conditions === true? ✅ → refetch()
          │
          ├─ AllergiesTable (listening)
          │   └─ Checks: changedWidgets.allergies === false? ❌ → skip
          │
          ├─ MedicationsTable (listening)
          │   └─ Checks: changedWidgets.medications === true? ✅ → refetch()
          │
          └─ (Future widgets automatically work)
```

### Key Architectural Decisions

1. **Pub-Sub Pattern**: Publishers don't know about subscribers and vice versa
2. **Event Metadata**: Include which widgets changed to enable selective refetch
3. **Window CustomEvents with setTimeout**: Native browser API with async behavior for non-blocking execution
4. **Widget Responsibility**: Each widget manages its own data lifecycle
5. **Memory Safety**: useRef pattern to prevent memory leaks

---

## 3. Event Mechanism Comparison & ADR

We evaluated five different approaches before making the final selection:

### Option 1: Window CustomEvents with setTimeout ⭐ **SELECTED**

```typescript
// Asynchronous dispatch using setTimeout
setTimeout(() => {
  window.dispatchEvent(new CustomEvent("consultation:saved", { detail: data }));
}, 0);

// Subscribe
window.addEventListener("consultation:saved", handler);
```

**Pros:**
- ✅ Native browser API (no dependencies)
- ✅ **Asynchronous** - doesn't block caller (setTimeout defers to next tick)
- ✅ Simple implementation
- ✅ Works across React trees
- ✅ Zero serialization overhead (passes object references)
- ✅ **Secure** - data stays in-process, no third-party interception
- ✅ **PHI safe** - suitable for healthcare data

**Cons:**
- ⚠️ Global scope (mitigated with prefixed event names)
- ⚠️ Type safety requires casting
- ⚠️ Testing requires window mocks

**Why Selected:** Best balance of simplicity, performance, security, and async behavior without external dependencies or security risks.

### Option 2: EventEmitter Class

```typescript
class EventBus {
  private listeners = new Map<string, Set<Function>>();
  subscribe(event, callback) {
    /*...*/
  }
  publish(event, data) {
    /*...*/
  }
}
```

**Pros:** ✅ Full control, ✅ Type-safe, ✅ Easy to test, ✅ Namespace isolation  
**Cons:** ⚠️ More code to maintain, ⚠️ Need singleton management

### Option 3: React Context + useReducer

```typescript
const EventContext = createContext<EventContextType>(null);
export const useEventSubscription = (eventType, callback) => {
  /*...*/
};
```

**Pros:** ✅ Pure React way, ✅ Auto cleanup, ✅ DevTools support  
**Cons:** ⚠️ More boilerplate, ⚠️ Need Provider wrapping, ⚠️ **Challenging across packages**

**Cross-Package Considerations:**

- ❌ **Provider Placement Issue**: Would need to wrap entire app in `distro` (above both `apps/clinical` and `packages/bahmni-widgets`)
- ❌ **Multiple Apps Problem**: If widgets used in different apps, each needs Provider setup
- ❌ **Testing Complexity**: Every test needs Provider wrapper
- ⚠️ **Tight Coupling to React Tree**: Context only works within same React tree

### Option 4: Broadcast Channel API

```typescript
const channel = new BroadcastChannel("bahmni-consultation");

// Publish (asynchronous)
channel.postMessage({ type: "consultation:saved", payload: data });

// Subscribe
channel.onmessage = (event) => {
  if (event.data.type === "consultation:saved") {
    // handle event
  }
};
```

**Pros:**
- ✅ Native browser API
- ✅ **Truly asynchronous** - doesn't block
- ✅ Cross-tab communication (bonus feature)
- ✅ Simple API

**Cons:**
- ❌ **Security risk** - any script in same origin can intercept messages (including malicious browser extensions)
- ❌ **PHI exposure risk** - patient data could be intercepted by third-party scripts
- ❌ **HIPAA compliance concern** - unencrypted PHI accessible to any listener
- ⚠️ **Serialization overhead** - uses Structured Clone Algorithm (CPU cost)
- ⚠️ Browser support - not in IE11, older Safari
- ⚠️ Type safety requires casting

**Why Not Selected:** Security risks and PHI exposure make it unsuitable for healthcare applications.

### Option 5: TanStack Query Direct Invalidation

```typescript
queryClient.invalidateQueries({ predicate: (query) => {...} });
```

**Pros:** ✅ Using existing infrastructure, ✅ Direct  
**Cons:** ❌ Still couples ConsultationPad to query keys, ❌ Not truly decoupled

### Summary: Why Window CustomEvents with setTimeout Wins 🏆

| Feature | Window CustomEvents (setTimeout) | EventEmitter Class | Broadcast Channel |
|---------|----------------------------------|-------------------|-------------------|
| **Async Behavior** | ✅ Non-blocking (setTimeout) | ⚠️ Synchronous blocking | ✅ Truly async |
| **Type Safety** | ⚠️ Manual casting required | ✅ Full TypeScript inference | ⚠️ Manual casting |
| **Security** | ✅ In-process only | ✅ In-process only | ❌ **PHI exposure risk** |
| **Performance** | ✅ Zero serialization | ✅ Zero serialization | ❌ Structured Clone overhead |
| **Testing** | ⚠️ Requires window mocks | ✅ Easy spying & cleanup | ⚠️ Harder to mock |
| **Debugging** | ⚠️ Manual | ✅ Built-in introspection | ⚠️ Manual |
| **API** | ✅ Simple | ✅ Clean & consistent | ✅ Simple |
| **Namespace** | ⚠️ Global scope | ✅ Isolated | ⚠️ Global scope |
| **Memory Safety** | ✅ Clear cleanup (useRef) | ✅ Clear cleanup patterns | ✅ Built-in cleanup |
| **Code to Maintain** | ~50 lines | ~100 lines | ~50 lines |
| **Dependencies** | ✅ None (native) | ✅ None | ✅ None (native) |
| **Browser Support** | ✅ Universal | ✅ Universal | ⚠️ Modern browsers only |
| **HIPAA Compliant** | ✅ Yes | ✅ Yes | ❌ **Security concern** |

**Decision:** We chose **Window CustomEvents with setTimeout** because:

1. 🚀 **Asynchronous** - setTimeout defers to next tick, prevents blocking even with many listeners
2. 🔒 **Secure** - Data stays in-process, no third-party interception possible
3. 🏥 **PHI Safe** - Suitable for healthcare applications with sensitive data
4. ⚡ **Fast** - Zero serialization overhead, passes object references
5. 🌐 **Universal** - Works in all browsers, no compatibility issues
6. 📦 **No Dependencies** - Native browser API
7. ✅ **Simple** - Minimal code, easy to understand
8. 💾 **Memory Safe** - useRef pattern prevents leaks

### Why Window CustomEvents Works Well Across Packages

In our monorepo architecture:

```
bahmni-apps-frontend/
├── apps/clinical/                  # ConsultationPad lives here
│   └── src/components/consultationPad/
├── packages/bahmni-widgets/        # ConditionsTable lives here
│   └── src/conditions/
└── packages/bahmni-services/       # Event utilities live here
    └── src/events/
```

**Window CustomEvents Advantages:**

1. **No Provider Needed** - Works across any boundary:

   ```typescript
   // ConsultationPad.tsx (apps/clinical)
   import { dispatchConsultationSaved } from "@bahmni/services";
   dispatchConsultationSaved(data); // ✅ Just works

   // ConditionsTable.tsx (packages/bahmni-widgets)
   import { useConsultationSaved } from "@bahmni/services";
   useConsultationSaved(handler, [deps]); // ✅ Just works
   ```

2. **Global Accessibility** - Window object is accessible everywhere in the browser
3. **Simple Testing** - No Provider wrapper needed, just dispatch and listen
4. **Package Independent** - Works across apps, packages, lazy-loaded modules

**Why This Matters:**

React Context would require wrapping the entire app in `distro`, above both `apps/clinical` and `packages/bahmni-widgets`. Window events avoid this complexity entirely while maintaining the same decoupling benefits.

---

## 4. Event System Design

### Window CustomEvents Implementation

**File:** `packages/bahmni-services/src/events/consultationEvents.ts`

```typescript
import { useEffect, useRef } from 'react';

// Event name constant
export const CONSULTATION_SAVED_EVENT = 'consultation:saved';

// Event payload interface
export interface ConsultationSavedEventPayload {
  patientUUID: string;
  updatedResources: {
    conditions: boolean;
    allergies: boolean;
  };
}

/**
 * Dispatch consultation saved event using window.dispatchEvent
 *
 * ASYNCHRONOUS BEHAVIOR:
 * Uses setTimeout(fn, 0) to defer event dispatch to the next event loop tick.
 * This prevents blocking the caller and allows UI updates to happen immediately.
 *
 * Event listeners will be executed asynchronously after the current call stack clears.
 *
 * @param payload - The consultation saved event data
 */
export const dispatchConsultationSaved = (
  payload: ConsultationSavedEventPayload,
): void => {
  // Defer to next event loop tick to make it non-blocking
  setTimeout(() => {
    const event = new CustomEvent(CONSULTATION_SAVED_EVENT, {
      detail: payload,
    });
    window.dispatchEvent(event);
  }, 0);
};

/**
 * React hook for subscribing to consultation saved events
 *
 * MEMORY LEAK PREVENTION:
 * - Automatically removes event listener on component unmount
 * - Uses useRef to maintain stable callback reference
 * - Cleanup function ensures listener is always removed
 *
 * USAGE:
 * ```typescript
 * useConsultationSaved((payload) => {
 *   if (payload.patientUUID === currentPatient && payload.updatedResources.conditions) {
 *     refetch();
 *   }
 * }, [currentPatient, refetch]);
 * ```
 *
 * @param callback - Function to call when event is published
 * @param deps - Dependencies array (should include values used in callback)
 */
export const useConsultationSaved = (
  callback: (payload: ConsultationSavedEventPayload) => void,
  deps: React.DependencyList = [],
) => {
  // Use ref to store the latest callback without triggering re-subscription
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Create stable handler that uses the ref
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ConsultationSavedEventPayload>;
      // Always use the latest callback from ref
      callbackRef.current(customEvent.detail);
    };

    // Add listener
    window.addEventListener(CONSULTATION_SAVED_EVENT, handler);

    // CRITICAL: Cleanup function removes listener to prevent memory leaks
    return () => {
      window.removeEventListener(CONSULTATION_SAVED_EVENT, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps); // Only re-subscribe when deps change
};
```

### Key Features

**1. Asynchronous Dispatch:**
- Uses `setTimeout(fn, 0)` to defer execution to next event loop tick
- Prevents blocking even with multiple listeners
- UI remains responsive during event propagation

**2. Memory Safety:**
- `useRef` pattern prevents unnecessary re-subscriptions
- Automatic cleanup on component unmount via useEffect return
- No orphaned listeners or memory leaks

**3. Type Safety:**
- TypeScript interfaces for payload structure
- Compile-time checks for payload properties
- IDE autocomplete support

**4. Simplicity:**
- ~60 lines of code total
- No dependencies, uses native browser APIs
- Easy to understand and maintain

---

## 5. Implementation Details

### Step 1: Create Event Utilities in bahmni-services

**New File:** `packages/bahmni-services/src/events/consultationEvents.ts`

- Implement `dispatchConsultationSaved` function with setTimeout for async behavior
- Implement `useConsultationSaved` hook with useRef for memory safety
- Export event name constant
- Export type definitions for payload

### Step 2: Export from bahmni-services

**Update File:** `packages/bahmni-services/src/index.ts`

```typescript
// Add export
export {
  dispatchConsultationSaved,
  useConsultationSaved,
  CONSULTATION_SAVED_EVENT,
  type ConsultationSavedEventPayload,
} from "./events/consultationEvents";
```

### Step 3: Update ConsultationPad (Publisher)

**Update File:** `apps/clinical/src/components/consultationPad/ConsultationPad.tsx`

**Remove:**

```typescript
import { refreshQueries } from "@bahmni/services";
import { conditionsQueryKeys } from "@bahmni/widgets";
```

**Add:**

```typescript
import { dispatchConsultationSaved } from "@bahmni/services";
```

**Replace:**

```typescript
// ❌ OLD CODE - Remove this
if (selectedConditions.length > 0)
  await refreshQueries(queryClient, conditionsQueryKeys(patientUUID));

// ✅ NEW CODE - Add this
dispatchConsultationSaved({
  patientUUID: patientUUID!,
  updatedResources: {
    conditions: selectedConditions.length > 0,
    allergies: selectedAllergies.length > 0,
  },
});
```

### Step 4: Update ConditionsTable (Subscriber)

**Update File:** `packages/bahmni-widgets/src/conditions/ConditionsTable.tsx`

**Add import:**

```typescript
import { useConsultationSaved } from "@bahmni/services";
```

**Add subscription in component:**

```typescript
const ConditionsTable: React.FC = () => {
  const patientUUID = usePatientUUID();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: conditionsQueryKeys(patientUUID!),
    enabled: !!patientUUID,
    queryFn: () => fetchConditions(patientUUID!),
  });

  // ✅ NEW CODE - Subscribe to consultation saved event
  useConsultationSaved(
    (payload) => {
      // Only refetch if:
      // 1. Event is for the same patient
      // 2. Conditions were modified during consultation
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.conditions
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  // ... rest of component
};
```

---

## 6. Code Examples

### Before (Current Implementation)

```typescript
// ConsultationPad.tsx - BEFORE
import { conditionsQueryKeys } from "@bahmni/widgets"; // ❌ Tight coupling

const handleOnPrimaryButtonClick = async () => {
  await submitConsultation();

  // ConsultationPad handles invalidation directly
  if (selectedConditions.length > 0) {
    await refreshQueries(queryClient, conditionsQueryKeys(patientUUID));
  }
  // Other widgets ignored ❌

  onClose();
};
```

### After (Event-Driven Implementation)

```typescript
// ConsultationPad.tsx - AFTER
import { dispatchConsultationSaved } from "@bahmni/services"; // ✅ No widget imports!

const handleOnPrimaryButtonClick = async () => {
  await submitConsultation();

  // Just publish event with metadata
  dispatchConsultationSaved({
    patientUUID: patientUUID!,
    updatedResources: {
      conditions: selectedConditions.length > 0,
      allergies: selectedAllergies.length > 0,
    },
  });

  // That's it! ✅ Fully decoupled
  onClose();
};
```

```typescript
// ConditionsTable.tsx - AFTER
import { useConsultationSaved } from '@bahmni/services';

const ConditionsTable: React.FC = () => {
  const patientUUID = usePatientUUID();
  const { refetch } = useQuery({...});

  // Widget manages its own refetch
  useConsultationSaved(
    (payload) => {
      if (payload.patientUUID === patientUUID && payload.updatedResources.conditions) {
        refetch(); // ✅ Selective refetch
      }
    },
    [patientUUID, refetch]
  );

  return <SortableDataTable ... />;
};
```

---

## 7. Selective Refetch Logic

### Why Selective Refetch?

**Scenario:** User only adds an allergy during consultation

Without selective refetch:

- ❌ ConditionsTable refetches unnecessarily (no changes)
- ❌ AllergiesTable refetches (needed ✅)
- ❌ MedicationsTable refetches unnecessarily (no changes)
- **Result:** 3 API calls, only 1 needed

With selective refetch:

- ✅ ConditionsTable checks → updatedResources.conditions === false → skips
- ✅ AllergiesTable checks → updatedResources.allergies === true → refetches
- **Result:** 1 API call, exactly what's needed

### Implementation Pattern for All Widgets

```typescript
// Generic pattern for any widget
useConsultationSaved(
  (payload) => {
    // Check 1: Same patient?
    if (payload.patientUUID !== currentPatientUUID) return;

    // Check 2: Was this widget's data modified?
    if (!payload.updatedResources.{widgetType}) return;

    // Both checks passed → refetch
    refetch();
  },
  [currentPatientUUID, refetch]
);
```

---

## 8. Future Extensions

### Adding AllergiesTable

```typescript
// packages/bahmni-widgets/src/allergies/AllergiesTable.tsx

const AllergiesTable: React.FC = () => {
  const patientUUID = usePatientUUID();
  const { refetch } = useQuery({...});

  // Same pattern as ConditionsTable
  useConsultationSaved(
    (payload) => {
      if (payload.patientUUID === patientUUID && payload.updatedResources.allergies) {
        refetch();
      }
    },
    [patientUUID, refetch]
  );

  return <AllergiesDataTable ... />;
};
```

### Adding Other Widgets

```typescript
// Future widgets follow the same simple pattern
// Just check the appropriate resource flag in updatedResources
useConsultationSaved(
  (payload) => {
    if (
      payload.patientUUID === patientUUID &&
      payload.updatedResources.{resourceType}
    ) {
      refetch();
    }
  },
  [patientUUID, refetch],
);
```

**Key Point:** ConsultationPad doesn't need any changes when adding new widgets! ✅

---

## 9. Benefits & Trade-offs

### Benefits

✅ **Complete Decoupling**

- ConsultationPad has zero knowledge of widgets
- Widgets don't know about ConsultationPad
- Changes to widgets don't affect ConsultationPad

✅ **Scalability**

- Adding new widgets requires NO changes to ConsultationPad
- Just add event subscription in new widget
- Pattern is consistent across all widgets

✅ **Selective Refetch**

- Only widgets with changed data refetch
- Reduces unnecessary API calls
- Better performance and user experience

✅ **Type Safety**

- Full TypeScript support
- Compile-time error checking
- IDE autocomplete for event payloads

✅ **Testability**

- EventBus can be tested in isolation
- Widgets can be tested with mock events
- Easy to verify refetch behavior

✅ **Maintainability**

- Clear separation of concerns
- Each widget manages its own data lifecycle
- Easier to debug and reason about

### Trade-offs

⚠️ **Slightly More Code**

- Need EventBus implementation
- Hook for subscription
- But this is reusable infrastructure

⚠️ **Learning Curve**

- Team needs to understand pub-sub pattern
- But pattern is well-documented and common

⚠️ **Indirect Communication**

- Events make flow less explicit
- But proper naming and types help
- Good documentation mitigates this

---

## 10. Conclusion

This event-driven architecture provides a robust, scalable solution for decoupling consultation data refresh logic. By moving refetch responsibility to individual widgets and using selective refetch based on event metadata, we achieve:

1. Better separation of concerns
2. Improved scalability
3. Reduced API calls
4. Type-safe event handling
5. Easier testing and maintenance

The pattern is consistent, well-documented, and can be easily extended to other widgets in the future.

---

**Document Version:** 1.0  
**Last Updated:** December 18, 2025  
**Authors:** Development Team  
**Related Jira:** BAH-4325
