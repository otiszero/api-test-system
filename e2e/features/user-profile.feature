@smoke @needs(login-owner)
Feature: User Profile & Settings
  Verify user profile page with account, password, settings, and 2FA tabs.

  Scenario: Navigate to user profile
    Given I am on the "user-profile" page
    Then I should see "Profile & Settings"

  Scenario: Account tab shows user info
    Given I am on the "user-profile" page
    Then I should see "Account"
    And I should see "Verified Profile"
    And I should see "Tienkim"

  Scenario: Password Setting tab is accessible
    Given I am on the "user-profile" page
    When I click button "Password Setting"
    Then I should see "Password Setting"

  Scenario: Settings & Preferences tab is accessible
    Given I am on the "user-profile" page
    When I click button "Settings & Preferences"
    Then I should see "Settings & Preferences"

  Scenario: Reset 2FA tab is accessible
    Given I am on the "user-profile" page
    When I click button "Reset 2FA"
    Then I should see "Reset 2FA"
