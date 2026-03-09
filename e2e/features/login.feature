@smoke
Feature: Login Flow
  Users can log in with valid credentials and see validation errors.

  Background:
    Given I am on the "login" page

  Scenario: Login page is visible
    Then I should see "Welcome back,"
    And I should see "Enter the email with your Upmount account"

  Scenario Outline: Login validation - <case>
    When I fill input "Enter email address" with "<email>"
    And I fill input "Enter password" with "<password>"
    And I click button "Continue"
    Then I should see "<message>"

    Examples:
      | case                  | email              | password        | message                                          |
      | invalid email format  | notanemail         | TestPassword1!  | Email address is invalid                         |
      | weak password format  | owner@test.com     | wrongpass       | At least 1 uppercase, 1 lowercase, and 1 digit   |
      | wrong credentials     | owner@test.com     | TestPassword1!  | Your email or password is incorrect, try again.   |
