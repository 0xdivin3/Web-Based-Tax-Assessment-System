// src/app/(admin)/admin/payments/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Button, Select } from "@/components/ui";
import { formatNaira } from "@/lib/tax-calculator";
import { formatDate, statusColor } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

type PaymentRow = {
  id: string; amount: number; reference: string; status: string;
  channel: string | null; bankName: string | null; createdAt: string;
  user: { firstName: string; lastName: string; tin: string | null };
  taxReturn: { taxYear: number; taxType: string };
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PROCESSING");
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/payments?status=${filter}`)
      .then((r) => r.json())
      .then((d) => { setPayments(d.payments ?? []); setLoading(false); });
  };

  useEffect(() => { load(); }, [filter]);

  async function act(paymentId: string, action: "CONFIRM" | "REJECT") {
    setActingId(paymentId);
    await fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, action }),
    });
    setActingId(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payment Confirmations</h1>
        <Select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          options={[
            { value: "PROCESSING", label: "Pending Confirmation" },
            { value: "PAID",       label: "Confirmed" },
            { value: "FAILED",     label: "Rejected" },
            { value: "ALL",        label: "All" },
          ]}
          className="w-48"
        />
      </div>

      <Card>
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No payments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3">Taxpayer</th>
                  <th className="px-5 py-3">Year / Type</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium">{p.user.firstName} {p.user.lastName}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.user.tin}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p>{p.taxReturn.taxYear}</p>
                      <p className="text-xs text-gray-400">{p.taxReturn.taxType.replace("_", " ")}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold">{formatNaira(p.amount)}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {p.channel === "bank_transfer" ? (p.bankName ?? "Bank Transfer") : (p.channel ?? "—")}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{p.reference}</td>
                    <td className="px-5 py-3"><Badge className={statusColor(p.status)}>{p.status}</Badge></td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-3">
                      {p.status === "PROCESSING" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => act(p.id, "CONFIRM")}
                            loading={actingId === p.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle size={14} className="mr-1" /> Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => act(p.id, "REJECT")}
                            loading={actingId === p.id}
                          >
                            <XCircle size={14} className="mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </td>
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
