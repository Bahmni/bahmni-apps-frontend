# Active Context: PatientPhotoCapture Component Rewrite

## Task Overview
Rewrite the `src/components/registration/patient/PatientPhotoCapture.tsx` component to use only Carbon components and their default styling, replacing the current placeholder implementation with a fully functional photo capture and upload system.

## Business Context
The PatientPhotoCapture component is the fifth step in the patient registration wizard, allowing healthcare staff to capture or upload patient photos for identification and medical record purposes. This is crucial for patient identification and medical record management in healthcare systems.

## Technical Requirements

### Photo Storage
- **Format**: Base64 encoded strings
- **Storage Location**: Form data as part of patient registration
- **Persistence**: Submitted with patient creation API

### File Constraints
- **Maximum Size**: 5MB
- **Supported Formats**: JPEG, PNG, WebP
- **Preferred Orientation**: Portrait (width < height)
- **Validation**: File type, size, and orientation checks

### Camera Integration
- **Method**: HTML5 getUserMedia API
- **Target**: Webcam capture
- **Interface**: Modal-based camera controls
- **Permissions**: Handle camera access gracefully

### User Experience
- **Upload Methods**: Drag-and-drop, file picker, webcam capture
- **Processing**: Real-time validation and Base64 conversion
- **Feedback**: Loading states, success/error notifications
- **Preview**: Aspect ratio controlled photo display

## Design System Requirements

### Carbon Components Used
- **Layout**: Stack, Layer, Heading, Grid, Column
- **File Upload**: FileUploaderDropContainer, FileUploaderItem, Button
- **Media Display**: AspectRatio, Tile, SkeletonPlaceholder
- **Interaction**: Modal, ButtonSet, IconButton
- **Feedback**: InlineNotification, Loading, Tag

### Accessibility Features
- **WCAG AA**: Built-in via Carbon components
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Proper ARIA labels and descriptions
- **Focus Management**: Logical focus flow

## Form Data Structure

```typescript
interface PatientFormData {
  // ... existing fields
  photo?: {
    base64: string;           // Base64 encoded image data
    filename: string;         // Original filename
    size: number;            // File size in bytes
    type: string;            // MIME type
    dimensions?: {
      width: number;
      height: number;
    };
  };
}
```

## Implementation Phases

### Phase 1: Infrastructure
- Update translation files with new keys
- Create photo validation utilities
- Create custom hook for photo logic
- Update PatientFormData types

### Phase 2: Core Component
- Rewrite PatientPhotoCapture with Carbon components
- Implement file upload with drag-and-drop
- Add photo preview and removal
- Integrate with wizard validation

### Phase 3: Webcam Integration
- Create WebcamCaptureModal component
- Implement getUserMedia API integration
- Add camera permission handling
- Support photo capture to Base64

### Phase 4: Testing & Documentation
- Create comprehensive unit tests
- Add Storybook stories
- Test accessibility compliance
- Document component usage

## Validation Rules

```typescript
const VALIDATION_RULES = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  preferredOrientation: 'portrait',
  requiredDimensions: {
    minWidth: 150,
    minHeight: 200
  }
};
```

## API Integration Points

### Wizard Context
- `wizard.actions.setStepValidation('photo', stepValidation)`
- Step validation always returns `isValid: true` (photo is optional)
- Step completion based on photo presence

### Form Updates
- `updateField('photo', photoData)` to store photo in form
- Integration with existing form validation patterns
- Proper error handling and user feedback

## Translation Keys

New keys to be added to `public/locales/locale_en.json`:
- `registration.patient.photo.upload`
- `registration.patient.photo.capture`
- `registration.patient.photo.remove`
- `registration.patient.photo.dragDrop`
- `registration.patient.photo.processing`
- `registration.patient.photo.webcamAccess`
- Error messages for validation failures
- Success messages for photo operations

## Edge Cases & Error Handling

### File Upload Errors
- Invalid file types
- Oversized files
- Corrupted image data
- Network failures during processing

### Camera Access Issues
- Permission denied
- No camera available
- Camera already in use
- Browser compatibility issues

### User Experience Considerations
- Loading states during Base64 conversion
- Clear error messages with recovery options
- Responsive design across devices
- Touch-friendly interactions on mobile

## Performance Considerations

### Base64 Conversion
- Asynchronous processing to prevent UI blocking
- Progress indication for large files
- Memory management for large images

### Component Optimization
- Lazy loading of camera modal
- Proper cleanup of media streams
- Memoization of expensive operations

## Security & Privacy

### Data Handling
- No persistent storage of photo data
- Base64 encoding for secure transmission
- Proper disposal of temporary objects

### Camera Permissions
- Request permissions only when needed
- Clear user communication about camera usage
- Graceful degradation when permissions denied

## Testing Strategy

### Unit Tests
- File upload and validation logic
- Base64 conversion accuracy
- Wizard integration
- Error handling scenarios

### Integration Tests
- Complete photo capture flow
- Form submission with photo data
- Validation and error recovery

### Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Color contrast compliance

This technical context will guide the implementation of a robust, accessible, and user-friendly photo capture component that seamlessly integrates with the existing Bahmni registration system.
