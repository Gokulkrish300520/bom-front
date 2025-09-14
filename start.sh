#!/bin/bash
set -e

# Ensure Python sees the project root
export PYTHONPATH=/app

# Collect static files
python server/manage.py collectstatic --noinput

# Start Gunicorn to serve the Django app
exec gunicorn server.wsgi --log-file -
