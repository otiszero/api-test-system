@smoke @api-only
Feature: Health Check
  Verify the application is up and API is responding.

  Scenario: API health endpoint responds
    Given API: user "owner" is authenticated
    When API: GET "/health" returns 200
    Then API: response should contain "status"

  Scenario: Web app is accessible
    Given I navigate to "/"
    Then I should see "Welcome back,"
