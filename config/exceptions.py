from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    """Keep DRF's default handling, but don't let DB errors turn into ugly 500 pages."""
    response = exception_handler(exc, context)

    if response is None and isinstance(exc, IntegrityError):
        return Response(
            {"detail": "That record conflicts with one that already exists."},
            status=status.HTTP_409_CONFLICT,
        )

    return response
