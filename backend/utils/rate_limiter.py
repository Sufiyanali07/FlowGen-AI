import time
from typing import Dict, Tuple

from fastapi import HTTPException, Request, status

from backend.config import get_settings


settings = get_settings()

_rate_limit_store: Dict[str, Tuple[int, float]] = {}


def rate_limiter(request: Request):
    """
    Simple in-memory fixed-window rate limiter per client IP.
    Allows N requests per 60-second window.
    """
    max_requests = settings.rate_limit_requests_per_minute
    window_seconds = 60

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    count, window_start = _rate_limit_store.get(client_ip, (0, now))

    if now - window_start > window_seconds:
        # Reset window
        count = 0
        window_start = now

    count += 1

    _rate_limit_store[client_ip] = (count, window_start)

    if count > max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "rate_limit_exceeded",
                "message": "Too many requests. Please wait and try again.",
            },
        )

