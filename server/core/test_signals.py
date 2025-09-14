
from django.test import TestCase
from unittest.mock import MagicMock
from server.core import signals


class AdjustItemStockTest(TestCase):

    def test_adjust_item_stock_increments(self):
        item = MagicMock(track_inventory=True, current_stock=10)
        signals.adjust_item_stock(item, 5)
        self.assertEqual(item.current_stock, 15)
        item.save.assert_called_with(update_fields=["current_stock"])

    def test_adjust_item_stock_no_track(self):
        item = MagicMock(track_inventory=False, current_stock=10)
        signals.adjust_item_stock(item, 5)
        # Should not change or call save
        self.assertEqual(item.current_stock, 10)
        item.save.assert_not_called()
