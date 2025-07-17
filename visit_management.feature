Feature: Visit Management
  As a healthcare worker
  I want to create and manage patient visits
  So that I can track patient encounters and provide continuity of care

  Background:
    Given I am logged in as a user with "Add Visits" privilege
    And the following patient exists in the system:
      | identifier | givenName | familyName | gender | birthdate  | phoneNumber |
      | GAN200001  | John      | Doe        | Male   | 01/01/1988 | +1234567890 |
    And the system has the following visit types configured:
      | visitType | description           |
      | OPD       | Outpatient Department |
      | IPD       | Inpatient Department  |
      | Emergency | Emergency Department  |

  @visit-management @positive
  Scenario: Create a new outpatient visit
    Given I am on the patient details page for "GAN200001"
    When I click "Create Visit"
    And I select visit type "OPD"
    And I select location "Registration"
    And I click "Start Visit"
    Then a new visit should be created successfully
    And I should see the message "Visit started successfully"
    And the visit should be marked as active
    And I should be redirected to the visit page

  @visit-management @positive
  Scenario: Create visit with observations
    Given I am creating a new visit for patient "GAN200001"
    When I select visit type "OPD"
    And I fill in the following observations:
      | concept     | value | unit  |
      | Height      | 175   | cm    |
      | Weight      | 70    | kg    |
      | Temperature | 98.6  | F     |
      | Pulse       | 72    | /min  |
    And I click "Start Visit"
    Then the visit should be created with the observations
    And all observation values should be saved correctly
    And the BMI should be calculated automatically

  @visit-management @positive
  Scenario: Create visit with registration fees
    Given the system has registration fees configured
    And I am creating a new visit for patient "GAN200001"
    When I select visit type "OPD"
    And I enter registration fee as "100"
    And I select payment method "Cash"
    And I click "Start Visit"
    Then the visit should be created with fee information
    And the fee should be recorded in the visit
    And a receipt should be generated

  @visit-management @positive
  Scenario: Create emergency visit
    Given I am creating a new visit for patient "GAN200001"
    When I select visit type "Emergency"
    And I mark the visit as "Urgent"
    And I add chief complaint "Chest pain"
    And I click "Start Visit"
    Then an emergency visit should be created
    And the visit should be prioritized
    And the chief complaint should be recorded

  @visit-management @positive
  Scenario: Create visit with multiple observations
    Given I am creating a new visit for patient "GAN200001"
    When I select visit type "OPD"
    And I fill in vital signs:
      | concept           | value | abnormal |
      | Systolic BP       | 120   | false    |
      | Diastolic BP      | 80    | false    |
      | Pulse             | 72    | false    |
      | Temperature       | 99.2  | true     |
      | Respiratory Rate  | 18    | false    |
      | SPO2              | 98    | false    |
    And I click "Start Visit"
    Then all vital signs should be recorded
    And abnormal values should be flagged
    And normal ranges should be validated

  @visit-management @validation
  Scenario: Validation for mandatory visit fields
    Given I am creating a new visit
    When I click "Start Visit" without selecting visit type
    Then I should see a validation error "Visit type is required"
    And the visit should not be created

  @visit-management @validation
  Scenario: Validation for observation values
    Given I am creating a new visit with observations
    When I enter invalid observation values:
      | concept     | value | issue                    |
      | Height      | -10   | Negative value           |
      | Weight      | 500   | Unrealistic value        |
      | Temperature | 150   | Out of normal range      |
    And I click "Start Visit"
    Then I should see validation errors for invalid observations
    And the visit should not be created until values are corrected

  @visit-management @validation
  Scenario: Validation for duplicate active visits
    Given the patient already has an active visit
    When I try to create another visit
    Then I should see a warning "Patient already has an active visit"
    And I should be given options to:
      | option              | description                    |
      | Continue to visit   | Go to existing active visit   |
      | End current visit   | End current and start new     |
      | Cancel              | Cancel new visit creation     |

  @visit-management @negative
  Scenario: Create visit without sufficient privileges
    Given I am logged in as a user without "Add Visits" privilege
    When I try to create a visit
    Then I should see an error "Insufficient privileges to create visits"
    And the visit creation should be blocked

  @visit-management @negative
  Scenario: Create visit for non-existent patient
    Given I try to create a visit for a non-existent patient
    When I attempt to start the visit
    Then I should see an error "Patient not found"
    And the visit should not be created

  @visit-management @location-based
  Scenario: Create visit based on login location
    Given I am logged in at location "OPD"
    And the system has location-based visit type mapping:
      | location | defaultVisitType |
      | OPD      | OPD             |
      | IPD      | IPD             |
      | Emergency| Emergency       |
    When I create a visit
    Then the visit type should default to "OPD"
    And the visit location should be set to "OPD"

  @visit-management @concept-sets
  Scenario: Create visit with concept set observations
    Given the system has concept sets configured for "Nutritional Values"
    And I am creating a new visit
    When I select visit type "OPD"
    And I fill in the nutritional values:
      | concept    | value | unit |
      | Height     | 175   | cm   |
      | Weight     | 70    | kg   |
      | BMI        | 22.9  | kg/m²|
      | BMI Status | Normal|      |
    And I click "Start Visit"
    Then the concept set observations should be saved
    And the BMI should be calculated from height and weight
    And the BMI status should be determined automatically

  @visit-management @integration
  Scenario: Create visit and navigate to clinical
    Given I have successfully created a visit
    When I click "Go to Clinical"
    Then I should be redirected to the clinical module
    And the patient and visit context should be maintained
    And I should be able to continue with clinical documentation

  @visit-management @integration
  Scenario: Create visit from patient search
    Given I have searched for and found a patient
    When I click "Create Visit" from the search results
    Then I should be taken to the visit creation page
    And the patient information should be pre-populated
    And I should be able to create a visit directly

  @visit-management @printing
  Scenario: Print visit receipt
    Given I have created a visit with registration fees
    When I click "Print Receipt"
    Then a print dialog should open
    And the receipt should contain:
      | element          | value                    |
      | patientName      | John Doe                 |
      | identifier       | GAN200001               |
      | visitType        | OPD                     |
      | visitDate        | Today's date            |
      | registrationFee  | 100                     |
      | clinicName       | Current facility name   |

  @visit-management @audit
  Scenario: Visit creation creates audit log
    Given audit logging is enabled
    When I create a visit
    Then an audit log entry should be created
    And the audit log should contain:
      | field           | value                    |
      | action          | Visit Creation           |
      | patientUuid     | Patient's UUID           |
      | visitUuid       | Visit's UUID             |
      | userId          | Current user ID          |
      | timestamp       | Current timestamp        |
      | module          | Registration             |

  @visit-management @observations-validation
  Scenario: Validate observation ranges
    Given the system has normal ranges configured for observations
    When I enter observation values:
      | concept     | value | normalRange | expected    |
      | Pulse       | 120   | 60-100      | High        |
      | Temperature | 95.0  | 97.0-99.0   | Low         |
      | BP Systolic | 90    | 90-140      | Normal      |
    And I create the visit
    Then the observations should be flagged appropriately
    And I should see warnings for abnormal values
    And normal values should be accepted without warnings

  @visit-management @form-conditions
  Scenario: Apply form conditions during visit creation
    Given the system has form conditions configured
    And the conditions specify that "Weight is required if Height is entered"
    When I enter height but not weight
    And I try to create the visit
    Then I should see a validation message "Weight is required when Height is provided"
    And the visit should not be created until weight is entered

  @visit-management @defaults
  Scenario: Apply default values during visit creation
    Given the system has default values configured:
      | field       | defaultValue |
      | visitType   | OPD         |
      | location    | Registration |
      | feeStatus   | Paid        |
    When I create a new visit
    Then the default values should be pre-populated
    And I should be able to modify them if needed
    And the defaults should be applied when I save

  @visit-management @encounter-creation
  Scenario: Visit creation generates registration encounter
    Given I am creating a visit with observations
    When I complete the visit creation
    Then a registration encounter should be created automatically
    And the encounter should contain all the observations
    And the encounter type should be "REG"
    And the encounter should be linked to the visit

  @visit-management @visit-attributes
  Scenario: Create visit with custom attributes
    Given the system has visit attributes configured:
      | attribute    | type   | values           |
      | Visit Status | Coded  | OPD, IPD, Emergency |
      | Priority     | String | High, Medium, Low   |
    When I create a visit
    And I set the visit attributes:
      | attribute    | value     |
      | Visit Status | OPD       |
      | Priority     | Medium    |
    And I complete the visit creation
    Then the visit attributes should be saved
    And they should be displayed in the visit details

  @visit-management @performance
  Scenario: Visit creation performance
    Given I am creating a visit
    When I fill in all required information
    And I click "Start Visit"
    Then the visit should be created within 5 seconds
    And a loading indicator should be shown during creation
    And I should receive immediate feedback on success or failure

  @visit-management @concurrent-visits
  Scenario: Handle concurrent visit creation
    Given multiple users are creating visits for the same patient
    When I try to create a visit while another user is also creating one
    Then the system should handle the concurrency gracefully
    And I should be notified if another visit was created first
    And I should be given appropriate options to proceed
