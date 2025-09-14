#!/bin/bash

# Collect static files
python server/manage.py collectstatic --noinput

# Start Gunicorn to serve the Django app
exec gunicorn server.server.wsgi --log-file -
