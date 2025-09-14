
# Set the default target to 'help'
.DEFAULT_GOAL := help

.PHONY: help venv install format lint clean clean-pyc clean-pytestcache makemigrations migrate reset-db test coverage runserver generate-data superuser check

VENV_DIR := venv
PYTHON := $(VENV_DIR)/bin/python3
PIP := $(VENV_DIR)/bin/pip

# --- General/Utility Targets ---
help:
	@echo "Available targets:"
	@awk -F: '/^[a-zA-Z0-9_-]+:/ {print $$1}' Makefile | sort | uniq

venv:
	@test -d $(VENV_DIR) || python3 -m venv $(VENV_DIR)

install: venv
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

# --- Code Quality ---
format: install
	$(VENV_DIR)/bin/black server/

lint: install format
	$(VENV_DIR)/bin/flake8 server/ --exclude=migrations

# --- Cleaning ---
clean: clean-pyc clean-pytestcache
	rm -rf htmlcov .coverage

clean-pyc:
	find . -type d -name '__pycache__' -exec rm -rf {} +

clean-pytestcache:
	rm -rf .pytest_cache

# --- Database & Migrations ---
makemigrations: install
	PYTHONPATH=$(CURDIR) $(PYTHON) -m server.manage makemigrations

migrate: install makemigrations
	PYTHONPATH=$(CURDIR) $(PYTHON) -m server.manage migrate

reset-db: install clean-pyc clean-pytestcache
	rm -f server/db.sqlite3
	$(MAKE) migrate

# --- Testing ---
test: install clean-pyc clean-pytestcache
	PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=$(CURDIR) $(PYTHON) -m server.manage test --parallel

coverage: install clean-pyc clean-pytestcache
	COVERAGE_FILE=server/.coverage $(VENV_DIR)/bin/coverage run --rcfile=server/.coveragerc -m server.manage test
	COVERAGE_FILE=server/.coverage $(VENV_DIR)/bin/coverage report --rcfile=server/.coveragerc
	COVERAGE_FILE=server/.coverage $(VENV_DIR)/bin/coverage html --rcfile=server/.coveragerc

# --- Project Check ---
check: migrate
	@echo "Running linter (flake8)..."
	$(VENV_DIR)/bin/flake8 server/ --exclude=migrations
	@echo "Running tests with coverage (must be >90%)..."
	COVERAGE_FILE=server/.coverage $(VENV_DIR)/bin/coverage run --rcfile=server/.coveragerc -m server.manage test
	COVERAGE_FILE=server/.coverage $(VENV_DIR)/bin/coverage report --rcfile=server/.coveragerc --fail-under=90
	@echo "Generating synthetic data..."
	PYTHONPATH=$(CURDIR) $(PYTHON) -m server.manage load_demo_data

# --- Run Development Server ---
runserver: install
	PYTHONPATH=$(CURDIR) $(PYTHON) -m server.manage runserver