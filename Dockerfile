# Use an official Python runtime as a parent image
FROM python:3.13-slim

# Set the working directory to /app
WORKDIR /app

# Install system dependencies required for WeasyPrint and other libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgobject-2.0-0 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libffi-dev \
    libharfbuzz-icu0 \
    libgdk-pixbuf-2.0-0 \
    libcups2 \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the local source code to the container
COPY . /app/

# Install any dependencies specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port the app runs on
EXPOSE 8000

# Run the app
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "server.wsgi:application"]