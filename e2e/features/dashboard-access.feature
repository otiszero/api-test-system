@smoke @needs(login-owner)
Feature: Dashboard Access
  Verify dashboard page is accessible after login.

  Scenario: Dashboard visible after login
    Then I should see "Dashboard"
    And the URL should contain "/dashboard"
