# Template: Negative API scenarios
# Copy this file, remove the _ prefix, and customize for your app.
# Prefixed with _ so /generate-all skips it.

@negative @api-only
Feature: API Error Handling
  Verify API returns correct error codes for invalid requests.

  Scenario: Unauthenticated request returns 401
    When API: GET "/profile" returns 401
    Then API: response status should be 401

  Scenario: Forbidden resource returns 403
    Given API: user "viewer" is authenticated
    When API: DELETE "/admin/users/1" returns 403
    Then API: response status should be 403

  Scenario: Non-existent resource returns 404
    Given API: user "owner" is authenticated
    When API: GET "/orders/non-existent-id" returns 404
    Then API: response status should be 404
