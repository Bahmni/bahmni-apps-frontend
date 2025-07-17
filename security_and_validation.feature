Feature: Security and Validation
  As a system administrator
  I want to ensure proper security controls and data validation
  So that patient data is protected and system integrity is maintained

  Background:
    Given the system has the following user roles configured:
      | role                | privileges                                    |
      | Registration Clerk  | View Patients, Add Patients                   |
      | Nurse              | View Patients, Add Patients, Edit Patients   |
      | Doctor             | View Patients, Edit Patients, Add Visits     |
      | Administrator      | All privileges                                |

  @security @authentication
  Scenario: User must be authenticated to access registration
    Given I am not logged in
    When I try to access the patient registration page
    Then I should be redirected to the login page
    And I should see the message "Please log in to continue"

  @security @authorization
  Scenario: User with View Patients privilege can search patients
    Given I am logged in as a "Registration Clerk"
    When I access the patient search page
    Then I should be able to search for patients
    And I should see search results when patients are found

  @security @authorization
  Scenario: User without Add Patients privilege cannot create patients
    Given I am logged in as a user without "Add Patients" privilege
    When I try to access the new patient registration page
    Then I should see an error "Insufficient privileges to add patients"
    And I should be redirected to the search page

  @security @authorization
  Scenario: User without Edit Patients privilege cannot edit patients
    Given I am logged in as a user without "Edit Patients" privilege
    And a patient "GAN200001" exists in the system
    When I try to access the patient edit page
    Then I should see an error "Insufficient privileges to edit patients"
    And I should be redirected to the patient view page

  @security @authorization
  Scenario: User without Add Visits privilege cannot create visits
    Given I am logged in as a user without "Add Visits" privilege
    And a patient "GAN200001" exists in the system
    When I try to create a visit for the patient
    Then I should see an error "Insufficient privileges to create visits"
    And the visit creation should be blocked

  @security @session-management
  Scenario: Session timeout redirects to login
    Given I am logged in and active
    When my session expires due to inactivity
    And I try to perform any action
    Then I should be redirected to the login page
    And I should see the message "Your session has expired"

  @security @data-access
  Scenario: User can only access patients from their location
    Given I am logged in at location "OPD"
    And the system has location-based access control enabled
    When I search for patients
    Then I should only see patients registered at "OPD" location
    And patients from other locations should not be visible

  @validation @patient-data
  Scenario: Validate patient name format
    Given I am registering a new patient
    When I enter invalid name formats:
      | field      | value      | issue                    |
      | givenName  | John123    | Contains numbers         |
      | familyName | Doe@#$     | Contains special chars   |
      | middleName | A          | Too short                |
    And I try to save the patient
    Then I should see validation errors for each invalid field
    And the patient should not be saved

  @validation @patient-data
  Scenario: Validate patient age constraints
    Given I am registering a new patient
    When I enter age values:
      | ageYears | ageMonths | ageDays | expected                    |
      | -5       | 0         | 0       | Age cannot be negative      |
      | 150      | 0         | 0       | Age cannot exceed 120 years |
      | 0        | 15        | 0       | Invalid month value         |
      | 0        | 0         | 400     | Invalid day value           |
    And I try to save the patient
    Then I should see appropriate validation errors
    And the patient should not be saved

  @validation @patient-data
  Scenario: Validate phone number formats
    Given I am registering a new patient
    When I enter phone numbers:
      | phoneNumber    | expected                           |
      | 123            | Phone number too short             |
      | abcd1234567    | Phone number contains letters      |
      | +1234567890    | Valid international format         |
      | 1234567890     | Valid domestic format              |
    And I try to save the patient
    Then only valid phone numbers should be accepted
    And invalid formats should show validation errors

  @validation @patient-data
  Scenario: Validate email address format
    Given I am registering a new patient with email
    When I enter email addresses:
      | email              | expected                    |
      | invalid-email      | Invalid email format        |
      | test@              | Incomplete email            |
      | @domain.com        | Missing username            |
      | test@domain.com    | Valid email format          |
    And I try to save the patient
    Then only valid email addresses should be accepted
    And invalid formats should show validation errors

  @validation @identifier-validation
  Scenario: Validate patient identifier uniqueness
    Given a patient with identifier "GAN200001" exists
    When I try to register a new patient with identifier "GAN200001"
    And I fill in other required fields
    And I try to save the patient
    Then I should see an error "Patient identifier already exists"
    And the patient should not be saved

  @validation @identifier-validation
  Scenario: Validate identifier format
    Given the system has identifier format rules configured
    When I enter identifiers:
      | identifier | format     | expected                    |
      | GAN123     | GAN######  | Too short                   |
      | ABC200001  | GAN######  | Wrong prefix                |
      | GAN200001  | GAN######  | Valid format                |
    And I try to save the patient
    Then only identifiers matching the format should be accepted
    And invalid formats should show validation errors

  @validation @address-validation
  Scenario: Validate address hierarchy
    Given the address hierarchy is configured as "Country > State > District > Village"
    When I select address components:
      | country | state       | district | village  | expected                    |
      | India   | Karnataka   | Pune     | Kothrud  | State-District mismatch     |
      | India   | Maharashtra | Pune     | Kothrud  | Valid hierarchy             |
    And I try to save the patient
    Then the address hierarchy should be validated
    And mismatched combinations should show errors

  @validation @custom-validation
  Scenario: Apply custom field validation rules
    Given the system has custom validation rules:
      | field       | rule                           | message                        |
      | landHolding | Must be between 1-999 acres    | Should be between 1 to 999 acres |
      | primaryContact | Must be 8-10 digits         | Should be 8-10 digits          |
    When I enter values that violate these rules
    And I try to save the patient
    Then I should see the custom validation messages
    And the patient should not be saved

  @validation @date-validation
  Scenario: Validate date fields
    Given I am entering date information
    When I enter dates:
      | field      | value      | expected                    |
      | birthdate  | 01/01/2030 | Future date not allowed     |
      | deathDate  | 01/01/1980 | Death before birth          |
      | visitDate  | 32/01/2023 | Invalid date format         |
    And I try to save the information
    Then I should see appropriate date validation errors
    And invalid dates should not be accepted

  @validation @relationship-validation
  Scenario: Validate patient relationships
    Given I am adding a patient relationship
    When I enter relationship data:
      | relationshipType | personAge | patientAge | expected                    |
      | Parent/Child     | 20        | 30         | Parent younger than child   |
      | Spouse           | 15        | 25         | Spouse too young            |
      | Sibling          | 25        | 30         | Valid relationship          |
    And I try to save the relationship
    Then logical relationship validations should be applied
    And invalid relationships should show warnings

  @security @audit-logging
  Scenario: All patient operations are logged
    Given audit logging is enabled
    When I perform the following operations:
      | operation      | details                    |
      | Patient Search | Search by name "John"      |
      | Patient Create | Register new patient       |
      | Patient Edit   | Update phone number        |
      | Visit Create   | Create OPD visit           |
    Then each operation should create an audit log entry
    And the audit logs should contain:
      | field           | description                    |
      | userId          | ID of user performing action   |
      | timestamp       | When the action occurred       |
      | action          | Type of action performed       |
      | patientUuid     | Patient involved (if applicable)|
      | details         | Specific details of the action |

  @security @data-encryption
  Scenario: Sensitive data is encrypted
    Given I have registered a patient with sensitive information
    When I check the database storage
    Then sensitive fields should be encrypted:
      | field           | encryption    |
      | phoneNumber     | Encrypted     |
      | address         | Encrypted     |
      | personalDetails | Encrypted     |
    And only authorized users should be able to decrypt the data

  @security @input-sanitization
  Scenario: Input data is sanitized to prevent injection
    Given I am entering patient information
    When I enter potentially malicious input:
      | field      | value                           |
      | givenName  | <script>alert('xss')</script>   |
      | address    | '; DROP TABLE patients; --      |
      | notes      | <img src=x onerror=alert(1)>    |
    And I try to save the patient
    Then the input should be sanitized
    And no malicious code should be executed
    And the data should be stored safely

  @security @password-policy
  Scenario: User passwords must meet security requirements
    Given I am creating a new user account
    When I enter passwords:
      | password    | expected                           |
      | 123         | Too short                          |
      | password    | No special characters or numbers   |
      | Password1!  | Meets all requirements             |
    And I try to create the account
    Then only passwords meeting policy should be accepted
    And weak passwords should be rejected with appropriate messages

  @validation @concurrent-access
  Scenario: Handle concurrent data modifications
    Given two users are editing the same patient simultaneously
    When both users try to save their changes
    Then the system should detect the conflict
    And the second user should see a warning about concurrent modifications
    And options should be provided to resolve the conflict

  @validation @data-integrity
  Scenario: Maintain referential integrity
    Given a patient has relationships and visits
    When I try to delete the patient
    Then the system should check for dependent records
    And I should see warnings about:
      | dependency | description                    |
      | Visits     | Patient has active visits      |
      | Relationships | Patient has family relationships |
    And deletion should be prevented until dependencies are resolved

  @security @location-security
  Scenario: Location-based data access control
    Given I am logged in at location "OPD"
    And another location "IPD" exists with different patients
    When I try to access patient data
    Then I should only see patients associated with "OPD"
    And attempts to access "IPD" patients should be blocked
    And appropriate security messages should be displayed

  @validation @business-rules
  Scenario: Apply business rule validations
    Given the system has business rules configured:
      | rule                           | condition                    |
      | Minimum age for marriage       | Age >= 18 for spouse relation |
      | Maximum children per family    | <= 10 children relationships  |
      | Required fields for emergency  | Phone number mandatory        |
    When I enter data that violates these rules
    Then I should see business rule validation messages
    And the data should not be saved until rules are satisfied
