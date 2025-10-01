"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

const ITEMS_API = "https://web-production-6baf3.up.railway.app/api/items/";
const ITEM_DETAIL_API = (id: number) =>
  `https://web-production-6baf3.up.railway.app/api/items/${id}`;

type Item = {
  id: number;
  name: string;
  unit: string;
  hsn_code: string;
  reorder_point: number | null;
  sales_description: string | null;
  available_qty: number;
  selling_price: number;
  purchase_price: number;
};

export default function InventoryAdjustmentPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [newSellingPrice, setNewSellingPrice] = useState<number | "">("");
  const [newPurchasePrice, setNewPurchasePrice] = useState<number | "">("");
  const [updatedBy, setUpdatedBy] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [addQty, setAddQty] = useState<string | number>("");
  const convertToNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};



  // Fetch items list and map API fields to frontend model
  useEffect(() => {
    fetchWithAuth(ITEMS_API)
      .then((res) => res.json())
      .then((data) => {
        const mappedItems = data.results.map((item: any) => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
          sales_description: item.sales_description,
          reorder_point: item.reorder_point,
          hsn_code: item.hsn_code,
          available_qty: Number(item.opening_stock),
          selling_price: Number(item.sales_selling_price),
          purchase_price: Number(item.purchase_cost_price),
        }));
        setItems(mappedItems);
      });
  }, []);

  // Fetch selected item details and map
  useEffect(() => {
    if (selectedId) {
      fetchWithAuth(ITEM_DETAIL_API(selectedId))
        .then((res) => res.json())
        .then((item: any) => {
          const mappedItem: Item = {
            id: item.id,
            name: item.name,
            unit: item.unit,
            sales_description: item.sales_description,
            reorder_point: item.reorder_point,
            hsn_code: item.hsn_code,
            available_qty: convertToNumber(item.opening_stock),
            selling_price: convertToNumber(item.sales_selling_price),
            purchase_price: convertToNumber(item.purchase_cost_price),
          };
          setSelected(mappedItem);
        });
    } else {
      setSelected(null);
    }
  }, [selectedId]);

  const handleSubmit = async () => {
    if (!selected) return;

    setLoading(true);


    const qtyToAdd = addQty === "" ? 0 : Number(addQty);
    const payload: Record<string, any> = {
      add_qty: qtyToAdd,
      updated_by: updatedBy,
    };

    if (newSellingPrice !== "") payload.selling_price = newSellingPrice;
    if (newPurchasePrice !== "") payload.purchase_price = newPurchasePrice;


    setLoading(false);

    try {
          const payload = {
      adjusted_item: selectedId,                                 // must be number (item ID)
      added_restocked_quantity: addQty === "" ? 0 : Number(addQty),
      old_selling_price: selected ? convertToNumber(selected.selling_price) : 0,
      updated_selling_price: newSellingPrice === "" 
        ? (selected ? convertToNumber(selected.selling_price) : 0) 
        : Number(newSellingPrice),
      old_purchase_price: selected ? convertToNumber(selected.purchase_price) : 0,
      updated_purchase_price: newPurchasePrice === "" 
        ? (selected ? convertToNumber(selected.purchase_price) : 0) 
        : Number(newPurchasePrice),
    };


      const response = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/inventory-management/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          router.push("/books/items/inventory");
        }, 1200);
      } else {
        alert("Error updating inventory. Please try again.");
      }
    } catch (error) {
      setLoading(false);
      alert("Network error: " + error);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="p-6 bg-white shadow-md rounded-xl max-w-xxl mx-auto">
        <h2 className="mb-4 text-2xl font-semibold text-green-700">Inventory Adjustment</h2>

        {/* Item Selection */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-green-700">
            Select Item
          </label>
          <select
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">Choose an item</option>
            {items.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Show details only if item is selected */}
        {selected && (
          <div className="mb-6 p-4 rounded-lg bg-green-100">
            <div className="mb-4">
                <div className="text-xs font-semibold text-green-600">Product Description</div>
                <div className="text-green-900">{selected.sales_description}</div>
              </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <div className="text-xs font-semibold text-green-600">HSN Code</div>
                <div className="text-green-900">{selected.hsn_code}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-green-600">Unit</div>
                <div className="text-green-900">{selected.unit}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-green-600">Available Qty</div>
                <div className="text-green-900">{selected.available_qty}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-green-600">Reorder_point</div>
                <div className="text-green-900">{selected.reorder_point}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-green-600">Selling Price</div>
                <div className="text-green-900">{selected.selling_price}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-green-600">Purchase Price</div>
                <div className="text-green-900">{selected.purchase_price}</div>
              </div>
            </div>
          </div>
        )}

        {/* Adjustment Form */}
        {selected && (
          <>
            
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-green-700">Add Restocked Quantity</label>
              <input
              type="number"
              min={0}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              value={addQty}
              onChange={(e) => setAddQty(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Enter quantity to add"
            />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-green-700">
                Updated Selling Price
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                value={newSellingPrice}
                onChange={(e) =>
                  setNewSellingPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder={`Current: ${selected.selling_price}`}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-green-700">
                Updated Purchase Price
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                value={newPurchasePrice}
                onChange={(e) =>
                  setNewPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder={`Current: ${selected.purchase_price}`}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 text-sm font-medium text-green-700">Updated By</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                value={updatedBy}
                onChange={(e) => setUpdatedBy(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => router.push("/books/items/inventory")}
            className="px-4 py-2 border rounded-lg hover:bg-green-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              !selected ||
              (!addQty && newSellingPrice === "" && newPurchasePrice === "")
            }
            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            {loading ? "Updating..." : "Save Adjustment"}
          </button>
        </div>

        {success && (
          <div className="mt-4 text-green-700 font-semibold">
            Inventory updated successfully!
          </div>
        )}
      </div>
    </div>
  );
}
