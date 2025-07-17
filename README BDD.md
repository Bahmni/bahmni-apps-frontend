# Bahmni Registration Module - BDD Test Suite

This repository contains comprehensive Behavior Driven Development (BDD) tests for the Bahmni Registration module using Cucumber feature files. The test suite covers all major functionality areas of the patient registration system.

## Overview

The BDD test suite is designed to validate the complete patient registration workflow in the Bahmni healthcare system. It follows BDD best practices with clear Given-When-Then scenarios that are readable by both technical and non-technical stakeholders.

## Test Coverage

### 1. Patient Search (`patient_search.feature`)
- **Scope**: Patient search functionality across various criteria
- **Key Scenarios**:
  - Search by patient identifier (exact match)
  - Search by patient name (partial and full)
  - Search by address fields
  - Search by custom attributes
  - Search by program attributes
  - Search results pagination
  - Search privilege validation
  - Performance testing

### 2. Patient Registration (`patient_registration.feature`)
- **Scope**: New patient registration workflows
- **Key Scenarios**:
  - Register patient with mandatory fields
  - Register patient with complete information
  - Age vs birthdate registration
  - Custom identifier handling
  - Field validation (mandatory fields, formats, constraints)
  - Photo capture and upload
  - Patient relationships
  - Address hierarchy
  - Default values application
  - WhatsApp integration

### 3. Patient Management (`patient_management.feature`)
- **Scope**: Editing and updating existing patient information
- **Key Scenarios**:
  - Edit basic patient information
  - Update patient photos
  - Manage patient relationships (add, edit, delete)
  - Update custom attributes
  - Handle death information
  - Manage multiple identifiers
  - Read-only field handling
  - Audit logging
  - Concurrent edit handling

### 4. Visit Management (`visit_management.feature`)
- **Scope**: Patient visit creation and management
- **Key Scenarios**:
  - Create visits with different types (OPD, IPD, Emergency)
  - Record observations and vital signs
  - Handle registration fees
  - Location-based visit creation
  - Concept set observations
  - Visit validation
  - Performance testing
  - Integration with clinical systems

### 5. Security and Validation (`security_and_validation.feature`)
- **Scope**: Security controls and data validation
- **Key Scenarios**:
  - Authentication and authorization
  - Role-based access control
  - Session management
  - Data validation (names, ages, phone numbers, emails)
  - Identifier validation
  - Address hierarchy validation
  - Custom field validation
  - Audit logging
  - Input sanitization
  - Concurrent access handling

### 6. Integration and Workflows (`integration_and_workflows.feature`)
- **Scope**: End-to-end workflows and system integrations
- **Key Scenarios**:
  - Complete registration to clinical workflow
  - Multi-identifier patient management
  - Family registration workflows
  - Photo management workflows
  - Address hierarchy workflows
  - Custom attributes workflows
  - Audit trail workflows
  - Error recovery
  - Performance under load
  - Mobile responsiveness
  - Offline capability

## Test Organization

### Tags
Tests are organized using tags for easy filtering and execution:

- **@positive**: Happy path scenarios
- **@negative**: Error and edge case scenarios
- **@validation**: Data validation scenarios
- **@security**: Security-related scenarios
- **@integration**: Integration and workflow scenarios
- **@performance**: Performance testing scenarios

### Functional Tags
- **@search**: Patient search functionality
- **@registration**: Patient registration
- **@patient-management**: Patient editing and updates
- **@visit-management**: Visit creation and management
- **@relationships**: Patient relationship management
- **@photo-capture**: Photo capture and management
- **@whatsapp**: WhatsApp integration
- **@printing**: Printing functionality
- **@audit**: Audit logging

## Running the Tests

### Prerequisites
1. Cucumber test framework setup
2. Bahmni registration module deployed and accessible
3. Test data setup (users, locations, configurations)
4. Step definition implementations

### Execution Commands

```bash
# Run all tests
cucumber

# Run specific feature
cucumber patient_search.feature

# Run tests by tag
cucumber --tags @positive
cucumber --tags @search
cucumber --tags "@registration and @positive"

# Run tests excluding certain tags
cucumber --tags "not @performance"

# Generate reports
cucumber --format html --out reports/cucumber_report.html
```

### Test Environment Setup

#### Required System Configuration
```javascript
// Example configuration for test environment
{
  "defaultIdentifierPrefix": "TEST",
  "mandatoryPersonAttributes": ["givenName", "familyName", "gender"],
  "addressHierarchy": {
    "levels": ["country", "state", "district", "village"],
    "showAddressFieldsTopDown": false
  },
  "enableWhatsAppButton": true,
  "enableDashboardRedirect": true,
  "patientSearch": {
    "searchByPatientIdentifier": true,
    "address": {
      "field": "cityVillage",
      "label": "Village"
    },
    "customAttributes": {
      "fields": ["caste", "education"]
    }
  }
}
```

#### Test Data Requirements
- Test users with different privilege levels
- Sample patients with various attributes
- Address hierarchy data
- Custom attribute configurations
- Visit types and locations

## Step Definitions

### Common Step Patterns

#### Given Steps (Setup)
```gherkin
Given I am logged in as a user with "View Patients" privilege
Given I am on the patient search page
Given the system has the following patients:
Given the address hierarchy is configured as "Country > State > District > Village"
```

#### When Steps (Actions)
```gherkin
When I enter "John" in the name search field
When I click the search button
When I fill in the following patient details:
When I select visit type "OPD"
```

#### Then Steps (Assertions)
```gherkin
Then I should see search results containing:
Then the patient should be successfully registered
Then I should see the message "Patient saved successfully"
Then I should be redirected to the patient edit page
```

## Data Tables

The test suite extensively uses data tables for:
- Patient information
- Search criteria
- Validation scenarios
- Configuration settings
- Expected results

Example:
```gherkin
When I fill in the following patient details:
  | field      | value    |
  | givenName  | John     |
  | familyName | Doe      |
  | gender     | Male     |
  | birthdate  | 01/01/1988 |
```

## Best Practices

### Writing New Tests
1. **Use descriptive scenario names** that clearly state the expected behavior
2. **Follow Given-When-Then structure** consistently
3. **Use data tables** for multiple test cases
4. **Tag scenarios appropriately** for easy filtering
5. **Keep scenarios focused** on single functionality
6. **Use background sections** for common setup

### Maintenance
1. **Update tests** when functionality changes
2. **Remove obsolete tests** for deprecated features
3. **Refactor common steps** into reusable step definitions
4. **Keep test data current** with system changes
5. **Review and update tags** regularly

## Reporting

### Test Results
- HTML reports with detailed scenario results
- JSON reports for CI/CD integration
- Screenshots for failed scenarios
- Performance metrics for load tests

### Coverage Metrics
- Functional coverage by feature area
- Code coverage (if integrated with unit tests)
- User story coverage
- Risk-based testing coverage

## Integration with CI/CD

### Pipeline Integration
```yaml
# Example CI/CD pipeline step
test:
  stage: test
  script:
    - cucumber --tags "@smoke"
    - cucumber --tags "@regression"
  artifacts:
    reports:
      junit: reports/cucumber_report.xml
    paths:
      - reports/
```

### Quality Gates
- All @smoke tests must pass
- Critical @security tests must pass
- Performance tests must meet SLA
- No high-priority defects

## Troubleshooting

### Common Issues
1. **Test data conflicts**: Ensure unique identifiers for test patients
2. **Timing issues**: Add appropriate waits for async operations
3. **Environment differences**: Verify configuration matches test expectations
4. **Permission issues**: Ensure test users have required privileges

### Debug Tips
1. Run individual scenarios to isolate issues
2. Check browser console for JavaScript errors
3. Verify test data setup before test execution
4. Use step-through debugging in step definitions

## Contributing

### Adding New Tests
1. Identify the functionality to test
2. Write scenarios in business language
3. Use existing step definitions where possible
4. Add new step definitions if needed
5. Tag scenarios appropriately
6. Update this documentation

### Code Review Checklist
- [ ] Scenarios are written in business language
- [ ] Given-When-Then structure is followed
- [ ] Appropriate tags are used
- [ ] Data tables are used effectively
- [ ] Test covers both positive and negative cases
- [ ] Documentation is updated

## Support

For questions or issues with the BDD test suite:
1. Check existing documentation
2. Review similar scenarios for patterns
3. Consult the development team
4. Update documentation with solutions

---

**Note**: This BDD test suite is designed to evolve with the Bahmni Registration module. Regular updates and maintenance are essential to keep the tests relevant and valuable.
