// src/app/(taxpayer)/history/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatDate, statusColor } from "@/lib/utils";
import { formatNaira } from "@/lib/tax-calculator";
import { FileText } from "lucide-react";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const returns = await prisma.taxReturn.findMany({
    where: { userId },
    orderBy: [{ taxYear: "desc" }, { createdAt: "desc" }],
    include: { payment: true, certificate: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Filing History</h1>
        <p className="text-gray-500 text-sm mt-1">All your tax returns and their statuses.</p>
      </div>

      {returns.length === 0 ? (
        <Card className="p-10 text-center">
          <FileText size={36} className="mx-auto mb-3 text-gray-300"/>
          <p className="font-medium text-gray-500">No returns yet</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3">Year</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Income</th>
                  <th className="px-5 py-3">Tax Liability</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{r.taxYear}</td>
                    <td className="px-5 py-3 text-gray-500">{r.taxType.replace("_", " ")}</td>
                    <td className="px-5 py-3">{formatNaira(r.totalIncome)}</td>
                    <td className="px-5 py-3 font-medium">{formatNaira(r.taxLiability)}</td>
                    <td className="px-5 py-3">
                      <Badge className={statusColor(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {r.submittedAt ? formatDate(r.submittedAt) : "Draft"}
                    </td>
                    <td className="px-5 py-3">
                      {r.certificate ? (
                        <a href={`/api/certificate/${r.id}/download`} className="text-green-700 hover:underline text-xs">
                          Download
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Admin remarks for queried returns */}
      {returns.filter((r) => r.status === "QUERIED" && r.adminRemarks).map((r) => (
        <div key={r.id} className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <p className="text-sm font-medium text-orange-800">
            Your {r.taxYear} return has been queried
          </p>
          <p className="text-sm text-orange-700 mt-1">{r.adminRemarks}</p>
        </div>
      ))}
    </div>
  );
}
