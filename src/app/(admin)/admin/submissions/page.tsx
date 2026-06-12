// src/app/(admin)/submissions/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Button, Select } from "@/components/ui";
import { formatNaira } from "@/lib/tax-calculator";
import { formatDate, statusColor } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

type Submission = {
  id: string; taxYear: number; taxType: string; status: string;
  totalIncome: number; taxLiability: number; submittedAt: string | null;
  adminRemarks: string | null;
  user: { firstName: string; lastName: string; tin: string | null; email: string };
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("SUBMITTED");
  const [selected, setSelected] = useState<Submission | null>(null);
  const [remarks, setRemarks] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/submissions?status=${filter}`)
      .then((r) => r.json())
      .then((d) => { setSubmissions(d.submissions ?? []); setLoading(false); });
  }, [filter]);

  async function review(action: "APPROVE" | "QUERY" | "REJECT") {
    if (!selected) return;
    setActing(true);
    await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnId: selected.id, action, remarks }),
    });
    setSelected(null);
    setRemarks("");
    setActing(false);
    // Refresh
    fetch(`/api/admin/submissions?status=${filter}`)
      .then((r) => r.json())
      .then((d) => setSubmissions(d.submissions ?? []));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Submissions Review</h1>
        <Select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          options={[
            { value: "ALL",          label: "All" },
            { value: "SUBMITTED",    label: "Submitted" },
            { value: "UNDER_REVIEW", label: "Under Review" },
            { value: "APPROVED",     label: "Approved" },
            { value: "QUERIED",      label: "Queried" },
            { value: "REJECTED",     label: "Rejected" },
          ]}
          className="w-40"
        />
      </div>

      <Card>
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No submissions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3">Taxpayer</th>
                  <th className="px-5 py-3">TIN</th>
                  <th className="px-5 py-3">Year / Type</th>
                  <th className="px-5 py-3">Income</th>
                  <th className="px-5 py-3">Liability</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium">{s.user.firstName} {s.user.lastName}</p>
                      <p className="text-xs text-gray-400">{s.user.email}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">{s.user.tin}</td>
                    <td className="px-5 py-3">
                      <p>{s.taxYear}</p>
                      <p className="text-xs text-gray-400">{s.taxType.replace("_", " ")}</p>
                    </td>
                    <td className="px-5 py-3">{formatNaira(s.totalIncome)}</td>
                    <td className="px-5 py-3 font-semibold">{formatNaira(s.taxLiability)}</td>
                    <td className="px-5 py-3"><Badge className={statusColor(s.status)}>{s.status}</Badge></td>
                    <td className="px-5 py-3">
                      {(s.status === "SUBMITTED" || s.status === "UNDER_REVIEW") && (
                        <button
                          onClick={() => { setSelected(s); setRemarks(""); }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review modal (simple inline panel) */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Review Submission</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <p><span className="text-gray-500">Taxpayer:</span> {selected.user.firstName} {selected.user.lastName}</p>
              <p><span className="text-gray-500">Year:</span> {selected.taxYear}</p>
              <p><span className="text-gray-500">Tax Type:</span> {selected.taxType.replace("_", " ")}</p>
              <p><span className="text-gray-500">Liability:</span> <strong>{formatNaira(selected.taxLiability)}</strong></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Add remarks for the taxpayer..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => review("APPROVE")} loading={acting} size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle size={14} className="mr-1"/> Approve
              </Button>
              <Button onClick={() => review("QUERY")} loading={acting} size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600">
                <AlertCircle size={14} className="mr-1"/> Query
              </Button>
              <Button onClick={() => review("REJECT")} loading={acting} variant="danger" size="sm" className="flex-1">
                <XCircle size={14} className="mr-1"/> Reject
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setSelected(null)} className="w-full" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
