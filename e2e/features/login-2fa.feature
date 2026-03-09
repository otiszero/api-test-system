@smoke
Feature: Login with 2FA
  Users can log in with email, password and TOTP 2FA code.

  Scenario: Login with 2FA using account config
    Given I login as "owner" with 2FA
    Then I should see "Dashboard"
