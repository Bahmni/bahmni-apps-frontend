# Patient Registration Store

A Zustand store for managing patient registration form data with built-in validation.

## Features

- **Centralized State Management**: Single source of truth for all patient registration data
- **Built-in Validation**: Field-level and form-level validation functions
- **TypeScript Support**: Full type safety with exported interfaces
- **Performance Optimized**: Selector hooks to prevent unnecessary re-renders
- **Modular Actions**: Separate action hooks for different sections

## Store Structure

The store manages four main sections:

1. **Profile** - Basic patient information (name, gender, DOB, age, etc.)
2. **Address** - Patient address details
3. **Contact** - Phone numbers
4. **Additional Info** - Email and other details

## Usage Examples

### Reading Data

```typescript
import { useProfileData, useAddressData } from '../stores/patientRegistrationStore';

function MyComponent() {
  const profile = useProfileData();
  const address = useAddressData();

  return (
    <div>
      <p>{profile.firstName} {profile.lastName}</p>
      <p>{address.city}, {address.state}</p>
    </div>
  );
}
```

### Updating Data

```typescript
import { useProfileActions } from '../stores/patientRegistrationStore';

function ProfileForm() {
  const { setProfileField } = useProfileActions();

  return (
    <input
      onChange={(e) => setProfileField('firstName', e.target.value)}
    />
  );
}
```

### Validation

```typescript
import { useValidationActions } from '../stores/patientRegistrationStore';

function SubmitButton() {
  const { validateAll } = useValidationActions();

  const handleSubmit = () => {
    const result = validateAll();

    if (result.isValid) {
      // Submit form
    } else {
      // Show errors
      console.log(result.errors);
    }
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

### Accessing Validation Errors

```typescript
import { useProfileErrors, useAddressErrors } from '../stores/patientRegistrationStore';

function FormErrors() {
  const profileErrors = useProfileErrors();
  const addressErrors = useAddressErrors();

  return (
    <div>
      {profileErrors.firstName && <p>{profileErrors.firstName}</p>}
      {addressErrors.district && <p>{addressErrors.district}</p>}
    </div>
  );
}
```

## Available Hooks

### Data Selectors
- `useProfileData()` - Returns profile data
- `useAddressData()` - Returns address data
- `useContactData()` - Returns contact data
- `useAdditionalInfoData()` - Returns additional info data

### Error Selectors
- `useProfileErrors()` - Returns profile validation errors
- `useAgeErrors()` - Returns age validation errors
- `useAddressErrors()` - Returns address validation errors

### Action Hooks

#### Profile Actions
```typescript
const {
  setProfile,          // Update multiple profile fields
  setProfileField,     // Update a single field
  setDobEstimated,     // Set date of birth estimated flag
  setProfileErrors,    // Set profile errors
  setAgeErrors        // Set age errors
} = useProfileActions();
```

#### Address Actions
```typescript
const {
  setAddress,                       // Update multiple address fields
  setAddressField,                  // Update a single field
  setAddressErrors,                 // Set address errors
  setAddressSelectedFromDropdown    // Track dropdown selection
} = useAddressActions();
```

#### Contact Actions
```typescript
const {
  setContact,         // Update multiple contact fields
  setContactField     // Update a single field
} = useContactActions();
```

#### Additional Info Actions
```typescript
const {
  setAdditionalInfo,       // Update multiple fields
  setAdditionalInfoField   // Update a single field
} = useAdditionalInfoActions();
```

#### Validation Actions
```typescript
const {
  validateProfile,          // Validate profile fields
  validateAddress,          // Validate address fields
  validateAll,              // Validate all sections
  clearValidationErrors     // Clear all validation errors
} = useValidationActions();
```

#### Form Actions
```typescript
const {
  resetForm,       // Reset entire form
  resetSection     // Reset a specific section
} = useFormActions();
```

## Validation Rules

### Profile Validation
- `firstName` - Required, must contain only letters and spaces
- `lastName` - Required, must contain only letters and spaces
- `gender` - Required
- `dateOfBirth` - Required

### Address Validation
- `district`, `state`, `pincode` - If filled, must be selected from dropdown suggestions

## Advanced Usage

### Bulk Updates
```typescript
const { setProfile } = useProfileActions();

// Update multiple fields at once
setProfile({
  firstName: 'John',
  lastName: 'Doe',
  gender: 'Male'
});
```

### Section Reset
```typescript
const { resetSection } = useFormActions();

// Reset only the address section
resetSection('address');
```

### Complete Form Reset
```typescript
const { resetForm } = useFormActions();

// Reset all data and errors
resetForm();
```

## TypeScript Interfaces

### Exported Types
- `ProfileValidationErrors` - Profile error structure
- `AgeValidationErrors` - Age error structure
- `ValidationResult` - Result of validateAll()

### Usage
```typescript
import type { ValidationResult } from '../stores/patientRegistrationStore';

const handleValidation = (): ValidationResult => {
  // ...
};
```
