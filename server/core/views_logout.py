from rest_framework_simplejwt.views import TokenBlacklistView


class LogoutView(TokenBlacklistView):
    """Logout by blacklisting the refresh token."""

    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
