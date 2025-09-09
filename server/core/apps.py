"""App configuration for the core Django app."""
from django.apps import AppConfig


class CoreConfig(AppConfig):
    """AppConfig for the core app, sets up signals and post-migrate tasks."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        # Import signals and post-migrate tasks to ensure signal registration; suppress unused-import warning
        import core.signals  # noqa: F401
        _ = __import__("core.post_migrate_tasks")
