from django.apps import AppConfig
from django.db.models.signals import post_migrate
from django.dispatch import receiver


def schedule_task(sender, **kwargs):
    from core.background_tasks import preaggregate_daily_summaries
    from background_task.models import Task
    try:
        if not Task.objects.filter(
            task_name="core.background_tasks.preaggregate_daily_summaries"
        ).exists():
            preaggregate_daily_summaries(repeat=86400)  # every 24 hours
    except Exception:
        pass


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        import core.signals  # noqa
        post_migrate.connect(schedule_task, sender=self)
