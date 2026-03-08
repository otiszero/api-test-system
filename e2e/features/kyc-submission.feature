@integration
Feature: KYC Submission
  Organization owner submits KYC documents and checks status.

  Scenario: Submit KYC and verify via API
    # API setup
    Given API: user "owner" is authenticated

    # UI journey
    Given I am on the "kyc/status" page
    Then I should see "KYC"

    # API verification
    When API: GET "/kyb" returns 200
