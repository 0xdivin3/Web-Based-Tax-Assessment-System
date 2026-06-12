// src/app/(admin)/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatNaira } from "@/lib/tax-calculator";
import { formatDate, statusColor } from "@/lib/utils";
import { Users, FileStack, Clock, TrendingUp } from "lucide-react";

export default async function AdminDashboard() {
  const [
    totalTaxpayers,
    pendingReview,
    approvedReturns,
    recentSubmissions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TAXPAYER" } }),
    prisma.taxReturn.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.taxReturn.findMany({ where: { status: "APPROVED" } }),
    prisma.taxReturn.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      include: { user: { select: { firstName: true, lastName: true, tin: true } } },
      orderBy: { submittedAt: "desc" },
      take: 8,
    }),
  ]);

  const revenueCollected = approvedReturns.reduce((s, r) => s + r.taxLiability, 0);

  const stats = [
    { label: "Total Taxpayers",    value: totalTaxpayers,                    icon: Users,      color: "blue" },
    { label: "Pending Review",     value: pendingReview,                     icon: Clock,      color: "orange" },
    { label: "Approved Returns",   value: approvedReturns.length,            icon: FileStack,  color: "green" },
    { label: "Revenue Collected",  value: formatNaira(revenueCollected),     icon: TrendingUp, color: "purple" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{label}</p>
              <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600`}>
                <Icon size={16}/>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Pending Submissions</h2>
          <a href="/admin/submissions" className="text-sm text-blue-600 hover:underline">View all</a>
        </div>
        {recentSubmissions.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No pending submissions.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3">Taxpayer</th>
                  <th className="px-5 py-3">TIN</th>
                  <th className="px-5 py-3">Year</th>
                  <th className="px-5 py-3">Liability</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSubmissions.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{r.user.firstName} {r.user.lastName}</td>
                    <td className="px-5 py-3 font-mono text-gray-400 text-xs">{r.user.tin}</td>
                    <td className="px-5 py-3">{r.taxYear}</td>
                    <td className="px-5 py-3 font-medium">{formatNaira(r.taxLiability)}</td>
                    <td className="px-5 py-3"><Badge className={statusColor(r.status)}>{r.status}</Badge></td>
                    <td className="px-5 py-3 text-gray-400">{r.submittedAt ? formatDate(r.submittedAt) : "—"}</td>
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
