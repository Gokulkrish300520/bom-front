# Banking API Endpoints

## Overview
The banking module provides endpoints for managing bank and credit card accounts, as well as recording and querying transactions between them. All endpoints require authentication.

## Endpoints

### Banking Accounts
- **List/Create:** `GET/POST /api/banking/banking-accounts/`
- **Retrieve/Update/Delete:** `GET/PUT/PATCH/DELETE /api/banking/banking-accounts/{id}/`

#### Fields
- `account_type`: `bank` or `credit_card`
- For `bank`: `account_name`, `account_code`, `account_number`, `bank_name`, `ifsc`, `opening_balance`, `primary`
- For `credit_card`: `card_number`, `card_holder_name`, `expiry_date`, `opening_outstanding`, `primary`
- Read-only: `id`, `current_balance`, `current_outstanding`, `created_at`, `updated_at`

### Transactions
- **List/Create:** `GET/POST /api/banking/transactions/`
- **Retrieve/Update/Delete:** `GET/PUT/PATCH/DELETE /api/banking/transactions/{id}/`
- **Filtering:** Supports `from_date`, `to_date`, `transaction_type`, `from_amount`, `to_amount`, `source_type`, `source_id`, `destination_type`, `destination_id` as query params.

#### Fields
- `source_type`, `source_id`, `destination_type`, `destination_id`, `transaction_type`, `amount`, `date`, `description`, `reference_number`
- Read-only: `id`, `created_at`, `updated_at`

## Permissions
- All endpoints require authentication (`IsAuthenticated`).

## Integration
- Endpoints are available under `/api/banking/`.
- Add transactions to update balances atomically.
- Use filters for reporting and reconciliation.

## Example Usage
```http
POST /api/banking/banking-accounts/
{
  "account_type": "bank",
  "account_name": "Main Bank",
  "account_code": "MB001",
  "account_number": "1234567890",
  "bank_name": "BankName",
  "ifsc": "BANK0001",
  "opening_balance": 1000.0,
  "primary": true
}

POST /api/banking/transactions/
{
  "source_type": "bank",
  "source_id": 1,
  "destination_type": "credit_card",
  "destination_id": 2,
  "transaction_type": "payment",
  "amount": 100.0,
  "date": "2025-09-11"
}
```


## Notes
- All endpoints require JWT authentication (see instructions.txt for details)
- Balances are updated atomically on transaction create/delete
- Signals are used for hooks, auditability, and reporting integration
- All business logic is modular and auditable
- See banking_tests/ for usage patterns and validation
- Fully integrated with reporting and profit/loss endpoints

## Example: Filter Transactions
GET /api/banking/transactions/?from_date=2025-09-01&to_date=2025-09-12&transaction_type=payment
Authorization: Bearer <access_token>

## Example: Atomic Balance Update
POST /api/banking/transactions/
{
  "source_type": "bank",
  "source_id": 1,
  "destination_type": "credit_card",
  "destination_id": 2,
  "transaction_type": "payment",
  "amount": 100.0,
  "date": "2025-09-11"
}

## Test Coverage
- All banking and transaction logic is fully tested in banking_tests/
- Run all tests from project root for full coverage
