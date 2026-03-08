@smoke
Feature: Login Flow
  Users can log in with valid credentials and see the dashboard.

  Background:
    Given I am on the "login" page

  Scenario: Successful login
    When I fill "email" with "owner@test.com"
    And I fill "password" with "TestPassword123!"
    And I click button "Sign In"
    Then the URL should contain "/dashboard"
    And I should see "Dashboard"

  Scenario Outline: Login validation - <case>
    When I fill "email" with "<email>"
    And I fill "password" with "<password>"
    And I click button "Sign In"
    Then I should see "<message>"

    Examples:
      | case            | email              | password       | message              |
      | empty email     |                    | TestPassword1! | Required             |
      | empty password  | owner@test.com     |                | Required             |
      | invalid email   | notanemail         | TestPassword1! | Invalid email        |
      | wrong password  | owner@test.com     | wrongpass      | Invalid credentials  |
