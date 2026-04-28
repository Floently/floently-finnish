from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class AppError(Exception):
    status_code: int
    code: str
    message: str
    retryable: bool
    details: dict[str, Any] = field(default_factory=dict)


class FloentlyError(Exception):
    status_code = 400
    code = 'floently_error'

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFoundError(FloentlyError):
    status_code = 404
    code = 'not_found'


class UnauthorizedError(FloentlyError):
    status_code = 401
    code = 'unauthorized'


class ValidationError(FloentlyError):
    status_code = 422
    code = 'validation_error'
