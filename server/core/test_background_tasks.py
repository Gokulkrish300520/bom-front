
from django.test import TestCase
from unittest.mock import patch, MagicMock
from datetime import date


class PreaggregateDailySummariesTest(TestCase):
    @patch('server.core.models.Invoice.objects')
    @patch('server.core.models.Bill.objects')
    @patch('server.core.models.Payment.objects')
    @patch('server.core.models.DailySummary.objects')
    def test_preaggregate_daily_summaries_runs(
        self,
        mock_daily_summary_objects,
        mock_payment_objects,
        mock_bill_objects,
        mock_invoice_objects,
    ):
        today = date.today()
        # Setup Invoice mock
        mock_invoice_objects.exists.return_value = True

        class InvoiceObj:
            pass
        invoice_obj = InvoiceObj()
        invoice_obj.invoice_date = today
        mock_invoice_objects.order_by.return_value.first.return_value = (
            invoice_obj
        )
        # Setup Bill mock
        mock_bill_objects.exists.return_value = True

        class BillObj:
            pass
        bill_obj = BillObj()
        bill_obj.bill_date = today
        mock_bill_objects.order_by.return_value.first.return_value = (
            bill_obj
        )
        # Setup Payment mock
        mock_payment_objects.exists.return_value = True

        class PaymentObj:
            pass
        payment_obj = PaymentObj()
        payment_obj.date = today
        mock_payment_objects.order_by.return_value.first.return_value = (
            payment_obj
        )
        # Setup aggregates with specific mocks for filter()
        invoice_filter_mock = MagicMock()
        invoice_filter_mock.aggregate.return_value = {
            'total': 100
        }
        mock_invoice_objects.filter.return_value = invoice_filter_mock
        bill_filter_mock = MagicMock()
        bill_filter_mock.aggregate.return_value = {
            'total': 200
        }
        mock_bill_objects.filter.return_value = bill_filter_mock
        payment_filter_mock = MagicMock()
        payment_filter_mock.aggregate.return_value = {
            'total': 300
        }
        mock_payment_objects.filter.return_value = payment_filter_mock
        # Setup update_or_create
        mock_daily_summary_objects.update_or_create.return_value = (
            MagicMock(), True
        )
        from server.core.background_tasks import (
            _preaggregate_daily_summaries
        )

        class DummyInvoice:
            pass

        class DummyBill:
            pass

        class DummyPayment:
            pass

        class DummySummary:
            pass
        DummyInvoice.objects = mock_invoice_objects
        DummyBill.objects = mock_bill_objects
        DummyPayment.objects = mock_payment_objects
        DummySummary.objects = mock_daily_summary_objects
        _preaggregate_daily_summaries(
            Invoice_=DummyInvoice,
            Bill_=DummyBill,
            Payment_=DummyPayment,
            DailySummary_=DummySummary,
        )
        self.assertTrue(
            mock_daily_summary_objects.update_or_create.called
        )
