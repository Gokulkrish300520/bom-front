from rest_framework_simplejwt.views import TokenBlacklistView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class LogoutView(TokenBlacklistView):
    """Logout by blacklisting the refresh token."""
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
