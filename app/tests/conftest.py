"""
pytest configuration for app unit tests.

Sets environment variables BEFORE any test module imports so that
AWS Lambda Powertools initialises in test-safe mode:
  - POWERTOOLS_TRACE_DISABLED=true  → Tracer() becomes a no-op (no aws_xray_sdk needed)
  - POWERTOOLS_DEV=true             → disables Powertools sampling / remote config
"""

import os

# Must be set before any import of aws_lambda_powertools.tracing
os.environ.setdefault("POWERTOOLS_TRACE_DISABLED", "true")
os.environ.setdefault("POWERTOOLS_DEV", "true")
os.environ.setdefault("ENV", "test")
os.environ.setdefault("APP_VERSION", "0.0.0-test")
os.environ.setdefault("LOG_LEVEL", "WARNING")  # Suppress log noise during tests
os.environ.setdefault("POWERTOOLS_SERVICE_NAME", "flask-lambda-api-test")
