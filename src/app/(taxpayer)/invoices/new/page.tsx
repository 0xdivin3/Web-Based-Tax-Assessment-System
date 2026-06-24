// src/app/(taxpayer)/invoices/new/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input } from "@/components/ui";
import { computeInvoice, formatNaira, VAT_RATE } from "@/lib/tax-calculator";
import { Plus, Trash2 } from "lucide-react";

type Line = { description: string; quantity: string; unitPrice: string };

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [customer, setCustomer] = useState({
    customerName: "",
    customerEmail: "",
    customerTin: "",
    dueDate: "",
    notes: "",
  });

  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);

  function updateLine(index: number, field: keyof Line, value: string) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { description: "", quantity: "1", unitPrice: "" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const parsedLines = lines
    .filter((l) => l.description.trim() && l.unitPrice)
    .map((l) => ({
      description: l.description,
      quantity: parseFloat(l.quantity) || 0,
      unitPrice: parseFloat(l.unitPrice) || 0,
    }));

  const computed = parsedLines.length > 0 ? computeInvoice(parsedLines, VAT_RATE) : null;

  async function handleSubmit(action: "DRAFT" | "ISSUE") {
    if (!customer.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (parsedLines.length === 0) {
      setError("Add at least one line item with a description and unit price.");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...customer,
        customerEmail: customer.customerEmail || undefined,
        customerTin:   customer.customerTin || undefined,
        dueDate:       customer.dueDate || undefined,
        items: parsedLines,
        action,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not create invoice.");
      setLoading(false);
      return;
    }
    router.push("/invoices");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
        <p className="text-gray-500 text-sm mt-1">
          VAT ({(VAT_RATE * 100).toFixed(1)}%) is calculated automatically on the subtotal.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
      )}

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Customer Details</h2>
        <Input
          id="customerName"
          label="Customer / Business Name"
          required
          value={customer.customerName}
          onChange={(e) => setCustomer({ ...customer, customerName: e.target.value })}
          placeholder="e.g. Bright Star Logistics Ltd"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="customerEmail"
            label="Customer Email (optional)"
            type="email"
            value={customer.customerEmail}
            onChange={(e) => setCustomer({ ...customer, customerEmail: e.target.value })}
            placeholder="billing@customer.com"
          />
          <Input
            id="customerTin"
            label="Customer TIN (optional)"
            value={customer.customerTin}
            onChange={(e) => setCustomer({ ...customer, customerTin: e.target.value })}
            placeholder="0123456789"
          />
        </div>
        <Input
          id="dueDate"
          label="Due Date (optional)"
          type="date"
          value={customer.dueDate}
          onChange={(e) => setCustomer({ ...customer, dueDate: e.target.value })}
        />
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Line Items</h2>
          <button onClick={addLine} type="button" className="flex items-center gap-1 text-sm text-green-700 hover:underline">
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="Description"
                  value={line.description}
                  onChange={(e) => updateLine(i, "description", e.target.value)}
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  placeholder="Qty"
                  min="0"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, "quantity", e.target.value)}
                />
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  placeholder="Unit price"
                  min="0"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(i, "unitPrice", e.target.value)}
                />
              </div>
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={customer.notes}
            onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={2}
            placeholder="Payment terms, bank details, etc."
          />
        </div>
      </Card>

      {computed && (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatNaira(computed.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">VAT ({(computed.vatRate * 100).toFixed(1)}%)</span><span>{formatNaira(computed.vatAmount)}</span></div>
            <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold text-gray-900">
              <span>Total</span><span>{formatNaira(computed.total)}</span>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => handleSubmit("DRAFT")} loading={loading} className="flex-1" size="lg">
          Save as Draft
        </Button>
        <Button onClick={() => handleSubmit("ISSUE")} loading={loading} className="flex-1" size="lg">
          Issue Invoice
        </Button>
      </div>
    </div>
  );
}
