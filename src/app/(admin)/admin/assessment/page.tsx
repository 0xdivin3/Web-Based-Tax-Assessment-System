// src/app/(admin)/assessment/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Button } from "@/components/ui";
import { formatNaira } from "@/lib/tax-calculator";
import { formatDate, statusColor } from "@/lib/utils";
import { ClipboardEdit } from "lucide-react";

type Return = {
  id: string; taxYear: number; taxType: string; status: string;
  taxableIncome: number; taxLiability: number; taxDue: number;
  adminRemarks: string | null;
  user: { firstName: string; lastName: string; tin: string | null };
};

export default function AssessmentPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Return | null>(null);
  const [newLiability, setNewLiability] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/submissions?status=SUBMITTED")
      .then((r) => r.json())
      .then((d) => { setReturns(d.submissions ?? []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  async function saveOverride() {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/admin/assessment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        returnId:    selected.id,
        taxLiability: parseFloat(newLiability),
        remarks,
      }),
    });
    setSaving(false);
    setSelected(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardEdit size={22} className="text-gray-500"/>
        <h1 className="text-2xl font-bold text-gray-900">Assessment Override</h1>
      </div>
      <p className="text-sm text-gray-500">
        Manually adjust tax assessments before approval. Use this when the declared income requires correction.
      </p>

      <Card>
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">Loading...</div>
        ) : returns.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No submitted returns pending assessment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3">Taxpayer</th>
                  <th className="px-5 py-3">Year</th>
                  <th className="px-5 py-3">Taxable Income</th>
                  <th className="px-5 py-3">Declared Liability</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium">{r.user.firstName} {r.user.lastName}</p>
                      <p className="text-xs text-gray-400 font-mono">{r.user.tin}</p>
                    </td>
                    <td className="px-5 py-3">{r.taxYear} — {r.taxType.replace("_", " ")}</td>
                    <td className="px-5 py-3">{formatNaira(r.taxableIncome)}</td>
                    <td className="px-5 py-3 font-semibold">{formatNaira(r.taxLiability)}</td>
                    <td className="px-5 py-3"><Badge className={statusColor(r.status)}>{r.status}</Badge></td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => { setSelected(r); setNewLiability(String(r.taxLiability)); setRemarks(r.adminRemarks ?? ""); }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Override Assessment</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <p><span className="text-gray-500">Taxpayer:</span> {selected.user.firstName} {selected.user.lastName}</p>
              <p><span className="text-gray-500">Year:</span> {selected.taxYear}</p>
              <p><span className="text-gray-500">Declared liability:</span> <strong>{formatNaira(selected.taxLiability)}</strong></p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Adjusted Tax Liability (₦)</label>
              <input
                type="number"
                value={newLiability}
                onChange={(e) => setNewLiability(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Reason for override</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Reason for adjustment..."
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={saveOverride} loading={saving} className="flex-1">Save Override</Button>
              <Button variant="secondary" onClick={() => setSelected(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
