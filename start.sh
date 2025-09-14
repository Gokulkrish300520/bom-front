#!/bin/bash
export PYTHONPATH=$PWD/server

# Collect static files
python -m server.manage collectstatic --noinput

# Start Gunicorn to serve the Django app
exec gunicorn server.wsgi --log-file -
