from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        import core.signals  # noqa
        from core.background_tasks import preaggregate_daily_summaries
        # Schedule the background task to run daily if not already scheduled
        try:
            from background_task.models import Task
            if not Task.objects.filter(task_name="core.background_tasks.preaggregate_daily_summaries").exists():
                preaggregate_daily_summaries(repeat=86400)  # every 24 hours
        except Exception:
            pass
