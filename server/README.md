# Server Directory Overview

This directory contains the Django backend for the BPM project. It is organized for modularity, atomicity, and robust test coverage. Key features and instructions are summarized below.

## Structure
- `core/` – Main business logic, models, and API endpoints
- `core/banking/` – Modular banking and transaction endpoints, atomic balance logic
- `core/core_tests/` and `core/banking/banking_tests/` – All test logic, fully discoverable from project root
- `management/commands/` – Custom Django management commands
- `instructions.txt` – Full API and usage guide
- `demo.http` – Example API requests for all endpoints
- `profit_and_loss_report.md` – API and usage for profit/loss reporting

## Setup
1. Install dependencies:
   ```bash
   pipenv install --dev
   ```
2. Apply migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
3. Run all tests from project root:
   ```bash
   PYTHONPATH=$(pwd) DJANGO_SETTINGS_MODULE=server.server.settings pipenv run python3 -m django test
   ```
4. Run linter (excluding migrations):
   ```bash
   pipenv run flake8 server/core --exclude=migrations
   ```

## Key Features
- Modular Django app structure (core, banking, etc.)
- Atomic, auditable business logic for all financial operations
- JWT authentication for all endpoints
- Robust filtering, reporting, and file attachment support
- Background pre-aggregation for performance
- Full test coverage, all tests discoverable from project root
- Linter score: ~95% (see flake8_report.txt)

## Documentation
- See `instructions.txt` for full API usage, authentication, and admin instructions
- See `demo.http` for example API requests (including banking, transactions, reports)
- See `profit_and_loss_report.md` for reporting API details
- See `core/banking/README.md` for banking/transaction API details

## Notes
- All endpoints require JWT authentication
- All business logic is atomic and auditable
- All tests must pass before deployment
- Lint and test regularly for code quality
