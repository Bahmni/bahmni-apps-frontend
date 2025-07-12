# PersonAttributesForm Carbon Migration Plan

## Overview

This document outlines the plan to rewrite `src/components/registration/patient/PersonAttributesForm.tsx` using Carbon Design System components and default styling, following the established patterns in the project.

## Current State Analysis

### Current Implementation
- Uses custom HTML elements (div, input, select, label, h3, h4)
- Uses custom CSS classes (person-attributes-form__*)
- No SCSS module file exists (uses inline CSS classes)
- Handles multiple attribute types: String, Integer, Boolean, Concept-based
- Complex validation logic with custom error handling
- Responsive layout using custom CSS grid

### Functionality Requirements
- **Form Fields**: Dynamic rendering based on PersonAttributeType configuration
- **Validation**: Required field validation, format-specific validation (phone, integer, etc.)
- **Error Handling**: Field-level and form-level error display
- **Accessibility**: ARIA labels, error associations, keyboard navigation
- **Internationalization**: Full i18n support for all text
- **Wizard Integration**: Proper integration with PatientFormWizardContext

## Carbon Component Mapping

### Layout Components
| Current Element | Carbon Component | Purpose |
|----------------|------------------|---------|
| `<div className="person-attributes-form">` | `<Stack gap={6}>` | Main container with consistent spacing |
| `<div className="person-attributes-form__section">` | `<Layer>` | Section grouping with proper elevation |
| `<div className="person-attributes-form__group">` | `<Stack gap={4}>` | Group container for related fields |
| `<div className="person-attributes-form__fields">` | `<Grid>` with `<Column>` | Responsive field layout |

### Typography Components
| Current Element | Carbon Component | Purpose |
|----------------|------------------|---------|
| `<h3 className="person-attributes-form__section-title">` | `<Heading>` | Main section heading |
| `<h4 className="person-attributes-form__group-title">` | `<Heading>` with smaller size | Group heading |
| `<p className="person-attributes-form__description">` | `<Text>` | Descriptive text |

### Form Components
| Current Element | Carbon Component | Purpose |
|----------------|------------------|---------|
| `<input type="text">` | `<TextInput>` | String attribute input |
| `<input type="number">` | `<NumberInput>` | Integer/Double attribute input |
| `<input type="checkbox">` | `<Checkbox>` | Boolean attribute input |
| `<select>` | `<Select>` | Concept-based attribute selection |
| Custom error divs | `invalid` prop + `invalidText` | Individual field errors |
| Validation summary | `<InlineNotification>` | Form-level error display |

## Implementation Plan

### Phase 1: Setup and Testing Infrastructure
**Duration**: 1-2 hours
**Deliverables**:
- [ ] Create comprehensive test suite for current functionality
- [ ] Set up test utilities for Carbon components
- [ ] Verify all existing functionality works before migration

**Test Coverage**:
- Component rendering with different attribute types
- Form validation scenarios
- Error handling and display
- Wizard integration
- Accessibility features

### Phase 2: Carbon Component Integration
**Duration**: 2-3 hours
**Deliverables**:
- [ ] Update component imports to include Carbon components
- [ ] Replace layout structure with Stack/Layer/Grid
- [ ] Implement responsive design using Carbon's grid system

**Implementation Steps**:
1. **Import Carbon Components**:
   ```typescript
   import {
     Stack,
     Layer,
     Grid,
     Column,
     Heading,
     TextInput,
     NumberInput,
     Select,
     SelectItem,
     Checkbox,
     InlineNotification,
   } from '@carbon/react';
   ```

2. **Update Main Layout**:
   ```typescript
   return (
     <Stack gap={6}>
       <Layer>
         <Stack gap={5}>
           <Heading>{t('registration.patient.attributes.title')}</Heading>
           {/* Content */}
         </Stack>
       </Layer>
     </Stack>
   );
   ```

### Phase 3: Form Field Migration
**Duration**: 3-4 hours
**Deliverables**:
- [ ] Replace all input elements with Carbon components
- [ ] Maintain all validation logic
- [ ] Preserve accessibility features

**Implementation Details**:

1. **String Attributes** (TextInput):
   ```typescript
   <TextInput
     id={fieldId}
     labelText={`${attrType.name}${isRequired ? ' *' : ''}`}
     value={attribute.value || ''}
     onChange={(e) => updateAttribute(index, e.target.value)}
     placeholder={t('registration.patient.attributes.textPlaceholder', { name: attrType.name })}
     helperText={attrType.description}
     invalid={!!hasError}
     invalidText={hasError}
     maxLength={255}
   />
   ```

2. **Integer Attributes** (NumberInput):
   ```typescript
   <NumberInput
     id={fieldId}
     label={`${attrType.name}${isRequired ? ' *' : ''}`}
     value={attribute.value || ''}
     onChange={(e) => updateAttribute(index, (e.target as HTMLInputElement).value)}
     helperText={attrType.description}
     invalid={!!hasError}
     invalidText={hasError}
     min={0}
     step={attrType.format === 'java.lang.Double' ? 0.01 : 1}
   />
   ```

3. **Boolean Attributes** (Checkbox):
   ```typescript
   <Checkbox
     id={fieldId}
     labelText={attrType.name}
     checked={attribute.value === 'true'}
     onChange={(e, { checked }) => updateAttribute(index, checked ? 'true' : 'false')}
     helperText={attrType.description}
     invalid={!!hasError}
     invalidText={hasError}
   />
   ```

4. **Concept Attributes** (Select):
   ```typescript
   <Select
     id={fieldId}
     labelText={`${attrType.name}${isRequired ? ' *' : ''}`}
     value={attribute.value || ''}
     onChange={(e) => updateAttribute(index, e.target.value)}
     helperText={attrType.description}
     invalid={!!hasError}
     invalidText={hasError}
   >
     <SelectItem value="" text={t('registration.patient.attributes.selectOption', { name: attrType.name })} />
     {options.map((option) => (
       <SelectItem key={option.value} value={option.value} text={option.label} />
     ))}
   </Select>
   ```

### Phase 4: Error Handling Enhancement
**Duration**: 1-2 hours
**Deliverables**:
- [ ] Implement Carbon's error handling patterns
- [ ] Replace validation summary with InlineNotification
- [ ] Ensure proper error associations

**Implementation**:
```typescript
{/* Form-level validation errors */}
{stepValidation.errors.length > 0 && (
  <InlineNotification
    kind="error"
    title={t('registration.patient.attributes.validationErrors')}
    subtitle=""
    hideCloseButton
  >
    <ul style={{ margin: 0, paddingLeft: '1rem' }}>
      {stepValidation.errors.map((error, index) => (
        <li key={index}>{error}</li>
      ))}
    </ul>
  </InlineNotification>
)}
```

### Phase 5: Responsive Design Implementation
**Duration**: 1-2 hours
**Deliverables**:
- [ ] Implement responsive grid layout
- [ ] Ensure proper spacing and alignment
- [ ] Test on different screen sizes

**Grid Layout**:
```typescript
<Grid>
  <Column md={4} lg={8}>
    {/* Field components */}
  </Column>
</Grid>
```

### Phase 6: Testing and Validation
**Duration**: 2-3 hours
**Deliverables**:
- [ ] Update all existing tests
- [ ] Add new tests for Carbon component integration
- [ ] Verify accessibility compliance
- [ ] Test with real data

**Test Updates**:
- Update selectors to work with Carbon components
- Test Carbon component props (invalid, invalidText, etc.)
- Verify keyboard navigation and screen reader support
- Test responsive behavior

### Phase 7: Documentation and Cleanup
**Duration**: 1 hour
**Deliverables**:
- [ ] Create Storybook stories for the component
- [ ] Update component documentation
- [ ] Remove any unused custom CSS
- [ ] Update related documentation

## Technical Considerations

### Validation Logic Preservation
- All existing validation logic must be preserved
- Carbon components use `invalid` and `invalidText` props
- Error associations should use proper ARIA attributes
- Field-level errors should be displayed immediately

### Accessibility Requirements
- Carbon components have built-in accessibility features
- Ensure proper ARIA labels and descriptions
- Maintain keyboard navigation support
- Test with screen readers

### Performance Considerations
- Carbon components are optimized for performance
- Maintain React.memo, useMemo, and useCallback optimizations
- Consider lazy loading for large attribute sets

### Internationalization
- All existing translation keys must be preserved
- Carbon components support i18n out of the box
- Test with multiple languages

## Testing Strategy

### Unit Tests
- Component rendering with different attribute types
- Form validation scenarios
- Error handling and display
- State management and updates
- Accessibility features

### Integration Tests
- Wizard step integration
- Form submission handling
- Error recovery scenarios
- Responsive behavior

### Manual Testing
- Cross-browser compatibility
- Screen reader testing
- Keyboard navigation
- Mobile responsiveness

## Success Criteria

### Functional Requirements
- [ ] All existing functionality preserved
- [ ] Proper validation and error handling
- [ ] Wizard integration working correctly
- [ ] Internationalization support maintained

### Technical Requirements
- [ ] All tests passing
- [ ] No custom CSS dependencies
- [ ] Carbon components used throughout
- [ ] Accessibility compliance (WCAG 2.1 AA)

### User Experience
- [ ] Consistent visual design with other forms
- [ ] Responsive across all screen sizes
- [ ] Proper error messaging and guidance
- [ ] Smooth user interactions

## Risk Mitigation

### Potential Issues
1. **Component Behavior Changes**: Carbon components may behave differently than custom HTML elements
2. **Styling Conflicts**: Existing styles may conflict with Carbon components
3. **Test Failures**: Tests may need significant updates

### Mitigation Strategies
1. **Thorough Testing**: Comprehensive test coverage before and after migration
2. **Incremental Migration**: Phase-by-phase approach to identify issues early
3. **Documentation**: Clear documentation of changes and new patterns

## Post-Migration

### Monitoring
- Monitor for any regressions in functionality
- Gather user feedback on new interface
- Track performance metrics

### Future Enhancements
- Consider additional Carbon components for enhanced UX
- Implement any new Carbon features that become available
- Optimize performance based on usage patterns

## Conclusion

This migration plan ensures a systematic approach to converting the PersonAttributesForm component to use Carbon Design System components while maintaining all existing functionality and improving the overall user experience. The phased approach allows for thorough testing and validation at each step, minimizing risk and ensuring a successful migration.
