### Profit and Loss Report (API)

#### Endpoint
- GET /api/reports/profit-and-loss/?time=This%20Month|Last%20Month|This%20Year&basis=Accrual|Cash&compare_with=None|Last%20Month|Last%20Year

#### Description
- Returns a real-time Profit and Loss report for the specified period.
- Filter results by time frame (This Month, Last Month, This Year), accounting basis (Accrual or Cash), and compare with previous periods.
- Aggregates all Invoices (income), Payments (received), and Bills (expenses) in the period.
- Returns detailed breakdowns by invoice and bill, and calculates gross and net profit/loss.

#### Query Parameters
- time: string (This Month, Last Month, This Year; default: This Month)
- basis: string (Accrual or Cash; default: Accrual)
- compare_with: string (None, Last Month, Last Year; default: None)
- customer_id: integer (optional)
- summary_only: boolean (optional; default: false)

#### Output Fields
- operating_income: Total sales/invoice amount for the period
- cost_of_goods_sold: Total bill amount (COGS) for the period
- gross_profit: operating_income - cost_of_goods_sold
- operating_expense: (currently 0, can be split from bills in future)
- operating_profit: gross_profit - operating_expense
- non_operating_income: (currently 0)
- non_operating_expense: (currently 0)
- net_profit_loss: operating_profit + non_operating_income - non_operating_expense
- payments_received: Total payments received for the period
- invoice_breakdown: List of invoices in the period
- bill_breakdown: List of bills in the period

#### Sample Output
{
  "period": "This Month",
  "basis": "Accrual",
  "start_date": "2025-08-01",
  "end_date": "2025-08-31",
  "report": {
    "operating_income": 15000.0,
    "cost_of_goods_sold": 8000.0,
    "gross_profit": 7000.0,
    "operating_expense": 0.0,
    "operating_profit": 7000.0,
    "non_operating_income": 0.0,
    "non_operating_expense": 0.0,
    "net_profit_loss": 7000.0,
    "payments_received": 12000.0,
    "invoice_breakdown": [ ... ],
    "bill_breakdown": [ ... ]
  },
  "compare_with": "Last Month",
  "compare_report": {
    ...same structure as report...
  }
}

#### Example: Get Profit and Loss Report
GET /api/reports/profit-and-loss/?time=This%20Month&basis=Accrual
Authorization: Bearer <access_token>

Response:
{
  "period": "This Month",
  "basis": "Accrual",
  "start_date": "2025-08-01",
  "end_date": "2025-08-31",
  "report": {
    "operating_income": 15000.0,
    "cost_of_goods_sold": 8000.0,
    "gross_profit": 7000.0,
    "operating_expense": 0.0,
    "operating_profit": 7000.0,
    "non_operating_income": 0.0,
    "non_operating_expense": 0.0,
    "net_profit_loss": 7000.0,
    "payments_received": 12000.0,
    "invoice_breakdown": [ ... ],
    "bill_breakdown": [ ... ]
  },
  "compare_with": "Last Month",
  "compare_report": {
    ...same structure as report...
  }
}

#### summary_only parameter
- If `summary_only=true` is passed, the response omits invoice_breakdown and bill_breakdown for performance.

#### Example (summary_only=true)
{
  "period": "This Month",
  "basis": "Accrual",
  "start_date": "2025-08-01",
  "end_date": "2025-08-31",
  "report": {
    "operating_income": 15000.0,
    "cost_of_goods_sold": 8000.0,
    "gross_profit": 7000.0,
    "operating_expense": 0.0,
    "operating_profit": 7000.0,
    "non_operating_income": 0.0,
    "non_operating_expense": 0.0,
    "net_profit_loss": 7000.0,
    "payments_received": 12000.0,
    "invoice_breakdown": null,
    "bill_breakdown": null
  }
}

#### Error Cases
- 400: Missing required query parameters
- 401: Unauthorized

#### Notes
- The report is always up to date with all CRUD changes to Invoices, Bills, and Payments.
- For future: This endpoint can be extended for Balance Sheet and other financial reports.
