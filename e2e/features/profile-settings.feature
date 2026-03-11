@smoke @needs(login-owner)
Feature: Organization Profile Settings
  Verify organization profile settings page with tabs and business info.

  Background:
    Given I am on the "profile-settings" page

  Scenario: Profile Settings page loads
    Then I should see "Profile Settings"

  Scenario: Organization Profile tab is active by default
    Then I should see "Organization Profile"
    And I should see "Verified Organization"

  Scenario: Business information section is visible
    Then I should see "Business Information"
    And I should see "Legal business name"
    And I should see "Trading name"
    And I should see "Business type"
    And I should see "Country of incorporation"

  Scenario: Legal registration section is visible
    Then I should see "Legal & Registration Information"

  Scenario: Ownership section is visible
    Then I should see "Ownership & Control"

  Scenario: Subscription tab is accessible
    When I click button "Subscription"
    Then I should see "Subscription"

  Scenario: Payment tab is accessible
    When I click button "Payment"
    Then I should see "Payment"
