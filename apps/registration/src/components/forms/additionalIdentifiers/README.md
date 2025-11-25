# AdditionalIdentifiers Component

## Overview
Displays and captures additional (non-primary) identifier types for patient registration.

## Features
- Fetches identifier types from `/openmrs/ws/rest/v1/idgen/identifiertype`
- Filters to show only identifiers with `primary: false`
- Conditionally renders only when extra identifiers are available
- Positioned below "Basic Info" section in patient registration
- Returns data as `{ [identifierTypeUuid]: "value" }`

## Testing with Dummy Data

### Option 1: Using Mock Data in Tests

The component includes mock data that can be used for testing:

```typescript
import { mockIdentifierTypesData } from './__mocks__/mockIdentifierTypes';
```

### Option 2: API Mocking for Development

To see the component rendered in your development environment, you need to mock the API response. Here are different approaches:

#### A. Using Browser DevTools (Network Override)

1. Open your browser DevTools (F12)
2. Go to Network tab
3. Find the request to `/openmrs/ws/rest/v1/idgen/identifiertype`
4. Right-click → Override content
5. Paste this JSON:

```json
[
  {
    "uuid": "bahmni-primary-identifier-type",
    "name": "Bahmni Patient Identifier",
    "description": "Primary identifier for patient registration",
    "format": null,
    "required": true,
    "primary": true,
    "identifierSources": [
      {
        "uuid": "source-bah-001",
        "name": "BAH Source",
        "prefix": "BAH"
      }
    ]
  },
  {
    "uuid": "national-id-card-identifier-type",
    "name": "National ID Card",
    "description": "National identification card number",
    "format": null,
    "required": false,
    "primary": false,
    "identifierSources": []
  },
  {
    "uuid": "passport-number-identifier-type",
    "name": "Passport Number",
    "description": "International passport identification number",
    "format": null,
    "required": false,
    "primary": false,
    "identifierSources": []
  },
  {
    "uuid": "drivers-license-identifier-type",
    "name": "Driver's License",
    "description": "Driver's license number",
    "format": null,
    "required": false,
    "primary": false,
    "identifierSources": []
  },
  {
    "uuid": "social-security-identifier-type",
    "name": "Social Security Number",
    "description": "Government issued social security number",
    "format": null,
    "required": false,
    "primary": false,
    "identifierSources": []
  }
]
```

#### B. Using a Mock API Server (json-server)

1. Install json-server globally:
```bash
npm install -g json-server
```

2. Create a `db.json` file with the mock data above

3. Run the server:
```bash
json-server --watch db.json --port 8080 --routes routes.json
```

4. Update your API base URL to point to `http://localhost:8080`

#### C. Temporary Code Modification (Quick Test)

For a quick test, you can temporarily modify the `getIdentifierTypes` function:

**In `packages/bahmni-services/src/patientService/patientService.ts`:**

```typescript
export const getIdentifierTypes = async (): Promise<IdentifierTypesResponse> => {
  // TODO: Remove this mock data after testing
  return Promise.resolve([
    {
      uuid: "bahmni-primary-identifier-type",
      name: "Bahmni Patient Identifier",
      description: "Primary identifier for patient registration",
      format: null,
      required: true,
      primary: true,
      identifierSources: [
        { uuid: "source-bah-001", name: "BAH Source", prefix: "BAH" }
      ]
    },
    {
      uuid: "national-id-card-identifier-type",
      name: "National ID Card",
      description: "National identification card number",
      format: null,
      required: false,
      primary: false,
      identifierSources: []
    },
    {
      uuid: "passport-number-identifier-type",
      name: "Passport Number",
      description: "International passport identification number",
      format: null,
      required: false,
      primary: false,
      identifierSources: []
    },
    {
      uuid: "drivers-license-identifier-type",
      name: "Driver's License",
      description: "Driver's license number",
      format: null,
      required: false,
      primary: false,
      identifierSources: []
    }
  ]);

  // Original implementation:
  // return get<IdentifierTypesResponse>(IDENTIFIER_TYPES_URL);
};
```

**⚠️ Remember to revert this change after testing!**

## Expected Rendering

When the component renders with the mock data above, you should see:

```
┌─────────────────────────────────────────────────────────┐
│ Additional Identifiers                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ National ID Card                                         │
│ [___________________________]                            │
│                                                          │
│ Passport Number                                          │
│ [___________________________]                            │
│                                                          │
│ Driver's License                                         │
│ [___________________________]                            │
│                                                          │
│ Social Security Number                                   │
│ [___________________________]                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### What Should NOT Appear

The "Bahmni Patient Identifier" (primary: true) should **NOT** be displayed in this component, as it's handled by the Profile component.

## Verifying the Component

### 1. Check Conditional Rendering

Test these scenarios:
- ✅ Component appears when API returns non-primary identifiers
- ✅ Component does NOT appear when all identifiers are primary
- ✅ Component does NOT appear while loading
- ✅ Component does NOT appear on API error

### 2. Check Data Collection

Use browser console:
```javascript
// In the CreatePatient page, after filling in identifiers
// Open browser console and type:
patientAdditionalIdentifiersRef.current?.getData()

// Expected output:
{
  "national-id-card-identifier-type": "user input value",
  "passport-number-identifier-type": "user input value",
  "drivers-license-identifier-type": "user input value",
  "social-security-identifier-type": "user input value"
}
```

### 3. Check Form Integration

Navigate to: `/registration/new`

Expected position:
1. **Basic Info** (Profile section) ← First
2. **Additional Identifiers** ← Your new component (appears here)
3. Address Info
4. Contact Info
5. Additional Info

## Troubleshooting

### Component Not Appearing?

1. Check browser console for errors
2. Verify API is returning data with `primary: false` identifiers
3. Check React DevTools to see if `useIdentifierTypes` hook is loading
4. Verify mock data is being returned correctly

### Empty Fields Not Saving?

This is expected behavior. The component returns all identifier type UUIDs (empty or filled) in the data object.

### Translation Keys Not Working?

Make sure the translation key `CREATE_PATIENT_SECTION_ADDITIONAL_IDENTIFIERS` is defined in your locale files.

## Files

- **Component**: `AdditionalIdentifiers.tsx`
- **Styles**: `styles/index.module.scss`
- **Tests**: `__tests__/AdditionalIdentifiers.test.tsx`
- **Mock Data**: `__mocks__/mockIdentifierTypes.ts`
- **Examples**: `AdditionalIdentifiers.example.tsx`
- **Model**: `../../../models/patient.ts` (AdditionalIdentifiersData interface)
