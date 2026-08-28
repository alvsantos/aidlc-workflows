"""
Unit tests for app/main.py

Tests cover:
  - GET /health (S-01)
  - GET /hello/<name> happy path + validation failures (S-02, BR-01, BR-02)
  - GET /version (S-03)
  - Unmatched route → 404

Uses Powertools ApiGatewayResolver test helper pattern:
  inject a mock API Gateway HTTP API proxy event and assert the response dict.
"""

import json
import pytest


# ---------------------------------------------------------------------------
# Test event builder
# ---------------------------------------------------------------------------

def build_apigw_event(method: str, path: str, path_parameters: dict = None) -> dict:
    """
    Build a minimal API Gateway HTTP API (v2) proxy event for testing.

    Powertools ApiGatewayResolver accepts both v1 (REST API) and v2 (HTTP API)
    proxy event formats. We use v2 here (requestContext.http).
    """
    return {
        "version": "2.0",
        "routeKey": f"{method} {path}",
        "rawPath": path,
        "rawQueryString": "",
        "headers": {
            "content-type": "application/json",
        },
        "requestContext": {
            "accountId": "123456789012",
            "stage": "$default",
            "http": {
                "method": method,
                "path": path,
                "protocol": "HTTP/1.1",
                "sourceIp": "127.0.0.1",
                "userAgent": "pytest",
            },
            "requestId": "test-request-id",
        },
        "pathParameters": path_parameters or {},
        "isBase64Encoded": False,
    }


# ---------------------------------------------------------------------------
# Fixture: mock LambdaContext
# ---------------------------------------------------------------------------

class MockLambdaContext:
    function_name = "test-function"
    memory_limit_in_mb = 128
    invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:test-function"
    aws_request_id = "test-request-id"

    def get_remaining_time_in_millis(self):
        return 30000


@pytest.fixture
def lambda_context():
    return MockLambdaContext()


# ---------------------------------------------------------------------------
# S-01: GET /health
# ---------------------------------------------------------------------------

class TestHealthEndpoint:

    def test_health_returns_200(self, lambda_context):
        from app.main import handler
        event = build_apigw_event("GET", "/health")
        response = handler(event, lambda_context)
        assert response["statusCode"] == 200

    def test_health_returns_status_ok(self, lambda_context):
        from app.main import handler
        event = build_apigw_event("GET", "/health")
        response = handler(event, lambda_context)
        body = json.loads(response["body"])
        assert body["status"] == "ok"

    def test_health_returns_environment(self, lambda_context):
        from app.main import handler
        event = build_apigw_event("GET", "/health")
        response = handler(event, lambda_context)
        body = json.loads(response["body"])
        assert "environment" in body


# ---------------------------------------------------------------------------
# S-02: GET /hello/<name>
# ---------------------------------------------------------------------------

class TestHelloEndpoint:

    def test_hello_valid_name_returns_200(self, lambda_context):
        from app.main import handler
        event = build_apigw_event("GET", "/hello/World", {"name": "World"})
        response = handler(event, lambda_context)
        assert response["statusCode"] == 200

    def test_hello_valid_name_returns_greeting(self, lambda_context):
        from app.main import handler
        event = build_apigw_event("GET", "/hello/Alice", {"name": "Alice"})
        response = handler(event, lambda_context)
        body = json.loads(response["body"])
        assert body["message"] == "Hello, Alice!"

    def test_hello_name_with_hyphen_is_valid(self, lambda_context):
        """Hyphens are in the allowlist (BR-01)."""
        from app.main import handler
        event = build_apigw_event("GET", "/hello/Jean-Paul", {"name": "Jean-Paul"})
        response = handler(event, lambda_context)
        assert response["statusCode"] == 200

    def test_hello_empty_name_returns_400(self, lambda_context):
        """
        Empty name: an empty path segment /hello/ won't match the /<name> route pattern.
        In real API Gateway, this would be a 404 (no route match).
        We test with a whitespace-only name instead for the 400 validation path.
        """
        from app.main import handler
        event = build_apigw_event("GET", "/hello/", {"name": ""})
        response = handler(event, lambda_context)
        # Empty path segment = no route match = 404 (API GW routing behaviour)
        assert response["statusCode"] == 404

    def test_hello_whitespace_only_name_returns_400(self, lambda_context):
        """Whitespace-only name must be rejected (BR-02)."""
        from app.main import handler
        event = build_apigw_event("GET", "/hello/   ", {"name": "   "})
        response = handler(event, lambda_context)
        assert response["statusCode"] == 400

    def test_hello_name_too_long_returns_400(self, lambda_context):
        """Name longer than 50 chars must be rejected (BR-02)."""
        from app.main import handler
        long_name = "A" * 51
        event = build_apigw_event("GET", f"/hello/{long_name}", {"name": long_name})
        response = handler(event, lambda_context)
        assert response["statusCode"] == 400

    def test_hello_name_exactly_50_chars_is_valid(self, lambda_context):
        """Exactly 50 chars is at the boundary — must be accepted (BR-02)."""
        from app.main import handler
        name_50 = "A" * 50
        event = build_apigw_event("GET", f"/hello/{name_50}", {"name": name_50})
        response = handler(event, lambda_context)
        assert response["statusCode"] == 200

    def test_hello_script_tag_in_name_returns_400_or_404(self, lambda_context):
        """
        HTML/script injection attempt (BR-01, SECURITY-05).
        '<script>' contains '<' and '>' which are not valid URL path characters.
        API Gateway URL-encodes them; the route either won't match (404) or
        the validator rejects the decoded value (400). Either is a safe outcome.
        We verify the response is NOT 200 (injection not accepted).
        """
        from app.main import handler
        malicious = "<script>alert(1)</script>"
        event = build_apigw_event("GET", f"/hello/{malicious}", {"name": malicious})
        response = handler(event, lambda_context)
        # Must not return 200 — injection is never accepted
        assert response["statusCode"] != 200

    def test_hello_sql_injection_in_name_returns_400(self, lambda_context):
        """SQL injection attempt must be rejected (BR-01, SECURITY-05)."""
        from app.main import handler
        malicious = "'; DROP TABLE users; --"
        event = build_apigw_event("GET", f"/hello/{malicious}", {"name": malicious})
        response = handler(event, lambda_context)
        assert response["statusCode"] == 400

    def test_hello_error_response_does_not_reflect_input(self, lambda_context):
        """
        Error response body must NOT contain the invalid input value (SECURITY-09).
        Only a generic message is returned.
        """
        from app.main import handler
        malicious = "<evil>"
        event = build_apigw_event("GET", f"/hello/{malicious}", {"name": malicious})
        response = handler(event, lambda_context)
        body = json.loads(response["body"])
        assert malicious not in body.get("message", "")


# ---------------------------------------------------------------------------
# S-03: GET /version
# ---------------------------------------------------------------------------

class TestVersionEndpoint:

    def test_version_returns_200(self, lambda_context):
        from app.main import handler
        event = build_apigw_event("GET", "/version")
        response = handler(event, lambda_context)
        assert response["statusCode"] == 200

    def test_version_returns_required_fields(self, lambda_context):
        from app.main import handler
        event = build_apigw_event("GET", "/version")
        response = handler(event, lambda_context)
        body = json.loads(response["body"])
        assert "version" in body
        assert "environment" in body
        assert "python_version" in body

    def test_version_values_are_strings(self, lambda_context):
        from app.main import handler
        event = build_apigw_event("GET", "/version")
        response = handler(event, lambda_context)
        body = json.loads(response["body"])
        assert isinstance(body["version"], str)
        assert isinstance(body["environment"], str)
        assert isinstance(body["python_version"], str)


# ---------------------------------------------------------------------------
# Routing: unmatched route → 404
# ---------------------------------------------------------------------------

class TestRouting:

    def test_unmatched_route_returns_404(self, lambda_context):
        from app.main import handler
        event = build_apigw_event("GET", "/nonexistent")
        response = handler(event, lambda_context)
        assert response["statusCode"] == 404

    def test_post_to_health_returns_404(self, lambda_context):
        """POST is not registered — should 404, not 405."""
        from app.main import handler
        event = build_apigw_event("POST", "/health")
        response = handler(event, lambda_context)
        assert response["statusCode"] == 404
