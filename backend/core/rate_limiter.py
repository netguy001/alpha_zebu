"""
AlphaSync Rate Limiter — In-memory request throttling middleware.

Provides per-IP rate limiting for auth endpoints (login, register)
to prevent brute-force attacks. Uses a sliding window counter.

Usage:
    Applied as FastAPI middleware in main.py.
"""

import time
import logging
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)

# Rate limit configurations per path prefix
RATE_LIMITS = {
    "/api/auth/login": {"max_requests": 10, "window_seconds": 60},
    "/api/auth/register": {"max_requests": 5, "window_seconds": 60},
    "/api/auth/refresh": {"max_requests": 30, "window_seconds": 60},
    "/api/auth/2fa": {"max_requests": 10, "window_seconds": 60},
}

# Default rate limit for all other API endpoints
DEFAULT_RATE_LIMIT = {"max_requests": 120, "window_seconds": 60}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window rate limiter keyed by client IP + path prefix.

    Design decisions:
    - In-memory only (no Redis dependency for demo platform).
    - Cleans up expired entries periodically to prevent memory leaks.
    - Skips non-API paths (static files, WebSocket, health).
    """

    def __init__(self, app):
        super().__init__(app)
        # {(ip, path_prefix): [timestamp, timestamp, ...]}
        self._requests: dict[tuple, list[float]] = defaultdict(list)
        self._last_cleanup = time.time()
        self._cleanup_interval = 300  # 5 minutes

    async def __call__(self, scope, receive, send):
        # CRITICAL: BaseHTTPMiddleware breaks WebSocket protocol.
        # Bypass completely for WebSocket connections.
        if scope["type"] == "websocket":
            await self.app(scope, receive, send)
            return
        await super().__call__(scope, receive, send)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Skip non-API paths, WebSocket, and health checks
        if not path.startswith("/api/") or path == "/api/health":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"

        # Find matching rate limit config
        config = DEFAULT_RATE_LIMIT
        for prefix, limit_config in RATE_LIMITS.items():
            if path.startswith(prefix):
                config = limit_config
                break

        max_requests = config["max_requests"]
        window = config["window_seconds"]

        # Sliding window check
        now = time.time()
        key = (client_ip, path.split("/")[2] if len(path.split("/")) > 2 else "api")

        # Clean old timestamps
        self._requests[key] = [ts for ts in self._requests[key] if now - ts < window]

        if len(self._requests[key]) >= max_requests:
            retry_after = int(window - (now - self._requests[key][0])) + 1
            logger.warning(
                f"Rate limit exceeded: {client_ip} on {path} "
                f"({len(self._requests[key])}/{max_requests} in {window}s)"
            )
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "retry_after": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )

        self._requests[key].append(now)

        # Periodic cleanup of expired entries
        if now - self._last_cleanup > self._cleanup_interval:
            self._cleanup(now)
            self._last_cleanup = now

        return await call_next(request)

    def _cleanup(self, now: float):
        """Remove expired entries to prevent memory growth."""
        max_window = max(c["window_seconds"] for c in RATE_LIMITS.values())
        expired_keys = [
            key
            for key, timestamps in self._requests.items()
            if not timestamps or (now - timestamps[-1]) > max_window
        ]
        for key in expired_keys:
            del self._requests[key]
