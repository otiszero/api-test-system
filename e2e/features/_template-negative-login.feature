# Template: Negative login scenarios
# Copy this file, remove the _ prefix, and customize for your app.
# Prefixed with _ so /generate-all skips it.

@negative
Feature: Login Error Handling
  Verify login form handles invalid inputs correctly.

  Background:
    Given I am on the "login" page

  Scenario: Wrong password
    When I fill "email" with "owner@test.com"
    And I fill "password" with "WrongPassword123!"
    And I click button "Continue"
    Then I should see error "Invalid credentials"

  Scenario: Empty email
    When I fill "password" with "TestPassword123!"
    And I click button "Continue"
    Then the submit button should be disabled

  Scenario: Invalid OTP code
    When I fill login form for "owner"
    And I click button "Continue"
    And I enter invalid OTP "000000"
    Then I should see error "Invalid verification code"

  Scenario Outline: Login validation - <case>
    When I fill "email" with "<email>"
    And I fill "password" with "<password>"
    And I click button "Continue"
    Then I should see error "<message>"

    Examples:
      | case             | email            | password    | message             |
      | wrong password   | owner@test.com   | wrongpass   | Invalid credentials |
      | invalid email    | not-an-email     | Pass123!    | Invalid email       |
