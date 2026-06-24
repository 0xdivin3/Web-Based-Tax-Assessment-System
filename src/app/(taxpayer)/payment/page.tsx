// src/app/(taxpayer)/payment/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatNaira } from "@/lib/tax-calculator";
import { formatDate, statusColor } from "@/lib/utils";
import Link from "next/link";
import { CreditCard, CheckCircle } from "lucide-react";

export default async function PaymentPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const returns = await prisma.taxReturn.findMany({
    where: { userId, status: "APPROVED" },
    include: { payment: true },
    orderBy: { taxYear: "desc" },
  });

  const unpaid = returns.filter((r) => !r.payment || r.payment.status !== "PAID");
  const paid   = returns.filter((r) => r.payment?.status === "PAID");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">Pay outstanding tax liabilities securely.</p>
      </div>

      {/* Outstanding */}
      {unpaid.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Outstanding Payments</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {unpaid.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.taxYear} — {r.taxType.replace("_", " ")}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Approved: {r.reviewedAt ? formatDate(r.reviewedAt) : "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-orange-600">{formatNaira(r.taxDue)}</span>
                  <Link
                    href={`/payment/${r.id}`}
                    className="px-3 py-1.5 bg-green-700 text-white text-xs rounded-lg hover:bg-green-800"
                  >
                    Pay Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {unpaid.length === 0 && (
        <Card className="p-8 text-center">
          <CheckCircle size={36} className="mx-auto mb-3 text-green-500"/>
          <p className="font-medium text-gray-900">No outstanding payments</p>
          <p className="text-sm text-gray-500 mt-1">All your approved returns have been paid.</p>
        </Card>
      )}

      {/* Payment history */}
      {paid.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Payment History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {paid.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.taxYear} — {r.taxType.replace("_", " ")}</p>
                  <p className="text-xs text-gray-400">{r.payment?.paidAt ? formatDate(r.payment.paidAt) : "—"}</p>
                  <p className="text-xs text-gray-300">{r.payment?.reference}</p>
                </div>
                <div className="text-right">
                  <Badge className={statusColor("PAID")}>Paid</Badge>
                  <p className="text-sm font-medium text-gray-700 mt-1">{formatNaira(r.payment?.amount ?? 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment instructions */}
      <Card className="p-5 bg-blue-50 border-blue-100">
        <div className="flex gap-3">
          <CreditCard size={20} className="text-blue-600 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-medium text-blue-900">Payment Channels</p>
            <ul className="mt-2 space-y-1 text-xs text-blue-700">
              <li>• Remita (recommended) — get a Remita Retrieval Reference (RRR)</li>
              <li>• Bank transfer to designated Taxign accounts</li>
              <li>• Online payment via Paystack</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
