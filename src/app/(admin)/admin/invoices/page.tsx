// src/app/(admin)/admin/invoices/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Select } from "@/components/ui";
import { formatNaira } from "@/lib/tax-calculator";
import { formatDate } from "@/lib/utils";
import { Receipt } from "lucide-react";

type InvoiceRow = {
  id: string; invoiceNo: string; customerName: string; subtotal: number;
  vatAmount: number; total: number; status: string; issueDate: string;
  user: { firstName: string; lastName: string; tin: string | null };
};

const statusColor: Record<string, string> = {
  DRAFT:  "bg-gray-100 text-gray-600",
  ISSUED: "bg-blue-100 text-blue-700",
  PAID:   "bg-green-100 text-green-700",
  VOID:   "bg-red-100 text-red-700",
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/invoices?status=${filter}`)
      .then((r) => r.json())
      .then((d) => { setInvoices(d.invoices ?? []); setLoading(false); });
  }, [filter]);

  const totalVat = invoices.reduce((s, i) => s + i.vatAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt size={22} className="text-gray-500" />
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        </div>
        <Select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          options={[
            { value: "ALL",    label: "All" },
            { value: "DRAFT",  label: "Draft" },
            { value: "ISSUED", label: "Issued" },
            { value: "PAID",   label: "Paid" },
            { value: "VOID",   label: "Void" },
          ]}
          className="w-40"
        />
      </div>

      <Card className="p-5">
        <p className="text-sm text-gray-500">Total VAT Collected (visible invoices)</p>
        <p className="text-2xl font-bold text-green-700 mt-1">{formatNaira(totalVat)}</p>
      </Card>

      <Card>
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3">Invoice No.</th>
                  <th className="px-5 py-3">Issued By</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Subtotal</th>
                  <th className="px-5 py-3">VAT</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{inv.invoiceNo}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{inv.user.firstName} {inv.user.lastName}</p>
                      <p className="text-xs text-gray-400 font-mono">{inv.user.tin}</p>
                    </td>
                    <td className="px-5 py-3">{inv.customerName}</td>
                    <td className="px-5 py-3">{formatNaira(inv.subtotal)}</td>
                    <td className="px-5 py-3 text-gray-500">{formatNaira(inv.vatAmount)}</td>
                    <td className="px-5 py-3 font-semibold">{formatNaira(inv.total)}</td>
                    <td className="px-5 py-3">
                      <Badge className={statusColor[inv.status] ?? "bg-gray-100 text-gray-600"}>{inv.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{formatDate(inv.issueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
