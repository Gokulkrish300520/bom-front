#!/bin/bash

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn to serve the Django app
exec gunicorn server.wsgi --log-file -
