# Patient Search Implementation Guide

This guide documents the implementation of the patient search feature in the Bahmni Clinical Frontend application.

## Overview

The patient search feature allows healthcare workers to search for patients using various criteria including patient identifier, name, and phone number. The implementation follows BDD (Behavior-Driven Development) principles with comprehensive Cucumber test coverage.

## Architecture

### Components Structure

```
src/
├── pages/
│   └── PatientSearchPage.tsx          # Main search page
├── components/
│   └── registration/
│       ├── PatientSearchForm.tsx      # Search form component
│       └── PatientSearchResults.tsx   # Results display component
├── services/
│   └── patientSearchService.ts        # API service for patient search
├── hooks/
│   └── usePatientSearch.ts            # Custom hook for search logic
├── types/
│   └── patientSearch.ts               # TypeScript interfaces
└── __tests__/
    ├── PatientSearchPage.test.tsx     # Unit tests
    └── step_definitions/
        └── patient_search_steps.ts    # Cucumber step definitions
```

## Features Implemented

### Core Search Functionality
- **Search by Patient Identifier**: Exact match search using patient ID
- **Search by Name**: Partial and full name matching
- **Search by Phone Number**: Phone number search
- **Multi-criteria Search**: Combine multiple search criteria
- **Real-time Validation**: Search button disabled when no criteria entered

### User Interface
- **Responsive Form**: Three-column layout with ID, Name, and Phone Number fields
- **Results Table**: Displays search results in a sortable data table
- **Loading States**: Loading indicators during search operations
- **Error Handling**: User-friendly error messages
- **Empty States**: "No patients found" message when no results

### Technical Features
- **TypeScript Support**: Fully typed implementation
- **Internationalization**: i18n support with translation keys
- **Carbon Design System**: Consistent UI components
- **Error Boundaries**: Graceful error handling
- **API Integration**: OpenMRS REST API integration

## API Integration

### Endpoints Used
- **Patient Search**: `/openmrs/ws/rest/v1/bahmnicore/search/patient` (Bahmni-specific API)
- **Query Parameters**:
  - `s`: Search strategy (`byIdOrNameOrVillage`)
  - `loginLocationUuid`: Required location UUID for Bahmni search
  - `identifier`: Patient identifier search
  - `q`: Name search query
  - `customAttribute`: Phone number or custom attribute search
  - `addressFieldName`: Address field configuration
  - `filterOnAllIdentifiers`: Include all identifier types

### Data Mapping
The service maps OpenMRS patient data to our internal format:

```typescript
interface PatientSearchResult {
  uuid: string;
  identifier: string;
  name: string;
  gender: string;
  age: number;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  registrationDate: string;
}
```

## Usage

### Basic Search
1. Navigate to `/registration` route
2. Enter search criteria in any combination:
   - Patient ID
   - Patient name (partial or full)
   - Phone number
3. Click "Search" button
4. View results in the table below

### Search Behavior
- **Empty Criteria**: Search button remains disabled
- **Single Result**: Displays in results table (no auto-redirect)
- **Multiple Results**: All results shown in table
- **No Results**: "No patients found" message displayed
- **Errors**: Error message with retry option

## Testing

### Unit Tests
Run unit tests with:
```bash
yarn test
```

### Cucumber BDD Tests
Run Cucumber tests with:
```bash
yarn test:cucumber
```

### Test Coverage
The implementation includes comprehensive test coverage for:
- Form validation and interaction
- Search functionality
- Results display
- Error handling
- Loading states
- Edge cases

## Configuration

### Translation Keys
Add these keys to `public/locales/locale_en.json`:

```json
{
  "PATIENT_SEARCH_TITLE": "Patient Search",
  "PATIENT_SEARCH_ID_LABEL": "ID",
  "PATIENT_SEARCH_NAME_LABEL": "Name",
  "PATIENT_SEARCH_PHONE_LABEL": "Phone Number",
  "SEARCH_BUTTON": "Search",
  "NO_PATIENTS_FOUND": "No patients found"
}
```

### Routing
The patient search is available at:
- `/registration` - Main registration landing page

## Limitations (Simplified Implementation)

The current implementation is simplified and does not include:
- Custom attribute search (caste, program enrollment)
- Address search functionality
- Pagination/Load More functionality
- Patient creation workflow
- Edit/Print actions
- Navigation header
- User privilege checking

## Future Enhancements

### Planned Features
1. **Advanced Search**: Custom attributes and program enrollment
2. **Pagination**: Load more functionality for large result sets
3. **Patient Actions**: Edit and print patient information
4. **Navigation**: Header with breadcrumbs and action buttons
5. **Permissions**: Role-based access control
6. **Performance**: Search debouncing and caching

### Technical Improvements
1. **Caching**: Implement search result caching
2. **Offline Support**: PWA capabilities for offline search
3. **Accessibility**: Enhanced screen reader support
4. **Performance**: Virtual scrolling for large result sets

## Troubleshooting

### Common Issues

1. **Search Button Disabled**
   - Ensure at least one search field has content
   - Check form validation logic

2. **No Results Displayed**
   - Verify API endpoint configuration
   - Check network connectivity
   - Review search criteria format

3. **400 Bad Request Error**
   - The service automatically falls back to basic search if custom view fails
   - Check console logs for detailed error information
   - Verify OpenMRS API version compatibility

4. **TypeScript Errors**
   - Ensure all types are properly imported
   - Check interface definitions match API responses

5. **Translation Missing**
   - Add missing keys to locale files
   - Verify i18n configuration

6. **API Compatibility Issues**
   - The service tries multiple API approaches:
     1. Default view parameter
     2. Basic search without view parameter
   - Check browser console for debug URLs

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'patient-search');
```

## Contributing

When contributing to the patient search feature:

1. **Follow BDD**: Write Cucumber scenarios first
2. **Type Safety**: Maintain TypeScript coverage
3. **Testing**: Add unit tests for new functionality
4. **Documentation**: Update this guide for new features
5. **Accessibility**: Ensure WCAG compliance
6. **Performance**: Consider impact on search performance

## Related Documentation

- [Architecture Documentation](architecture.md)
- [i18n Guide](i18n-guide.md)
- [Testing Guide](../README.md#testing)
- [Carbon Design System](https://carbondesignsystem.com/)
