// src/app/(admin)/reports/page.tsx
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { formatNaira } from "@/lib/tax-calculator";

export default async function ReportsPage() {
  const [returns, taxTypes] = await Promise.all([
    prisma.taxReturn.groupBy({
      by: ["taxYear"],
      where: { status: "APPROVED" },
      _sum: { taxLiability: true },
      _count: { id: true },
      orderBy: { taxYear: "asc" },
    }),
    prisma.taxReturn.groupBy({
      by: ["taxType"],
      where: { status: "APPROVED" },
      _sum: { taxLiability: true },
      _count: { id: true },
    }),
  ]);

  const totalRevenue = returns.reduce((s, r) => s + (r._sum.taxLiability ?? 0), 0);
  const totalReturns = returns.reduce((s, r) => s + r._count.id, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Revenue Reports</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm text-gray-500">Total Revenue Collected</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{formatNaira(totalRevenue)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500">Total Approved Returns</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalReturns}</p>
        </Card>
      </div>

      {/* Revenue by year */}
      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Revenue by Year</h2>
        {returns.length === 0 ? (
          <p className="text-sm text-gray-400">No approved returns yet.</p>
        ) : (
          <div className="space-y-3">
            {returns.map((r) => {
              const pct = totalRevenue > 0 ? ((r._sum.taxLiability ?? 0) / totalRevenue) * 100 : 0;
              return (
                <div key={r.taxYear}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{r.taxYear}</span>
                    <span className="text-gray-500">
                      {r._count.id} returns — {formatNaira(r._sum.taxLiability ?? 0)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Revenue by tax type */}
      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Revenue by Tax Type</h2>
        {taxTypes.length === 0 ? (
          <p className="text-sm text-gray-400">No data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b">
                  <th className="pb-2">Tax Type</th>
                  <th className="pb-2">Returns</th>
                  <th className="pb-2 text-right">Revenue</th>
                  <th className="pb-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {taxTypes.map((t) => (
                  <tr key={t.taxType}>
                    <td className="py-2">{t.taxType.replace("_", " ")}</td>
                    <td className="py-2 text-gray-500">{t._count.id}</td>
                    <td className="py-2 text-right font-medium">{formatNaira(t._sum.taxLiability ?? 0)}</td>
                    <td className="py-2 text-right text-gray-400">
                      {totalRevenue > 0
                        ? `${(((t._sum.taxLiability ?? 0) / totalRevenue) * 100).toFixed(1)}%`
                        : "—"}
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
