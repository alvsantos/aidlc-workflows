"""
Lambda handler for Flask-style REST API using AWS Lambda Powertools.

Endpoints:
  GET /health         - liveness probe
  GET /hello/<name>   - parameterised greeting with input validation
  GET /version        - runtime metadata

Entry point: handler(event, context)
"""

import os
import re
import sys

from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver, Response
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, ServiceError
from aws_lambda_powertools.utilities.typing import LambdaContext

# ---------------------------------------------------------------------------
# Module-level configuration (read once at cold start, cached across invocations)
# ---------------------------------------------------------------------------
ENV = os.environ.get("ENV", "unknown")
APP_VERSION = os.environ.get("APP_VERSION", "0.1.0")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
POWERTOOLS_SERVICE_NAME = os.environ.get("POWERTOOLS_SERVICE_NAME", "flask-lambda-api")

# ---------------------------------------------------------------------------
# Powertools instances (module-level — persist across warm invocations)
# ---------------------------------------------------------------------------
logger = Logger(service=POWERTOOLS_SERVICE_NAME, level=LOG_LEVEL)
# APIGatewayHttpResolver handles HTTP API (v2) proxy event format natively
app = APIGatewayHttpResolver()

# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------
_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9 _\-]+$")
_MAX_NAME_LENGTH = 50


def _validate_name(name: str) -> str:
    """
    Validate and sanitise the `name` path parameter.

    Rules (BR-01, BR-02):
      - Must not be empty or whitespace-only
      - Must be <= 50 characters
      - Must match allowlist: alphanumeric, spaces, underscores, hyphens only

    Returns the stripped name on success.
    Raises BadRequestError (-> HTTP 400) on failure.
    Never reflects the invalid value back to the caller (SECURITY-09).
    """
    stripped = name.strip()
    if (
        not stripped
        or len(stripped) > _MAX_NAME_LENGTH
        or not _NAME_PATTERN.match(stripped)
    ):
        raise BadRequestError("Invalid name parameter")
    return stripped


# ---------------------------------------------------------------------------
# Global exception handler — fail closed, no internals exposed (SECURITY-15)
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
def handle_generic_exception(ex: Exception):
    """
    Catch-all handler for truly unexpected exceptions (not ServiceError subclasses).

    Powertools handles ServiceError subclasses (BadRequestError → 400,
    NotFoundError → 404, etc.) natively before reaching this handler.
    This handler only catches non-ServiceError exceptions to ensure
    no stack traces or internal details are returned to the caller (SECURITY-09).
    """
    if isinstance(ex, ServiceError):
        # Let Powertools handle it natively (returns correct HTTP status)
        raise ex
    logger.exception("Unhandled exception in handler")
    return Response(
        status_code=500,
        content_type="application/json",
        body={"statusCode": 500, "message": "Internal Server Error"},
    )


# ---------------------------------------------------------------------------
# Route handlers
# ---------------------------------------------------------------------------

@app.get("/health")
def get_health() -> dict:
    """
    GET /health — liveness probe (S-01).

    Returns:
        200 {"status": "ok", "environment": "<ENV>"}
    """
    return {"status": "ok", "environment": ENV}


@app.get("/hello/<name>")
def get_hello(name: str) -> dict:
    """
    GET /hello/<name> — parameterised greeting with input validation (S-02).

    Path parameter:
        name: 1-50 chars, alphanumeric + spaces/underscores/hyphens only

    Returns:
        200 {"message": "Hello, <name>!"}
        400 {"statusCode": 400, "message": "Invalid name parameter"} on bad input
    """
    validated_name = _validate_name(name)
    return {"message": f"Hello, {validated_name}!"}


@app.get("/version")
def get_version() -> dict:
    """
    GET /version — runtime metadata (S-03).

    Returns:
        200 {"version": str, "environment": str, "python_version": str}
    """
    return {
        "version": APP_VERSION,
        "environment": ENV,
        "python_version": sys.version,
    }


# ---------------------------------------------------------------------------
# Lambda entry point
# ---------------------------------------------------------------------------

@logger.inject_lambda_context(log_event=False)  # log_event=False: never log raw event (SECURITY-03)
def handler(event: dict, context: LambdaContext) -> dict:
    """
    Lambda function entry point.

    Delegates routing to Powertools ApiGatewayResolver.
    The @logger.inject_lambda_context decorator automatically injects:
      - function_request_id, cold_start, function_name into every log entry.

    log_event=False ensures the raw API GW event (which may contain headers,
    query params, or body) is never written to logs (SECURITY-03).
    """
    return app.resolve(event, context)
