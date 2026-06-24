// src/app/(taxpayer)/invoices/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { formatNaira } from "@/lib/tax-calculator";
import { formatDate, statusColor } from "@/lib/utils";
import Link from "next/link";
import { Receipt, Plus } from "lucide-react";

const invoiceStatusColor: Record<string, string> = {
  DRAFT:  "bg-gray-100 text-gray-600",
  ISSUED: "bg-blue-100 text-blue-700",
  PAID:   "bg-green-100 text-green-700",
  VOID:   "bg-red-100 text-red-700",
};

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">E-Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">
            Generate and manage invoices for your transactions, with VAT calculated automatically.
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800"
        >
          <Plus size={16} />
          New Invoice
        </Link>
      </div>

      <Card>
        {invoices.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Receipt size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">No invoices yet.</p>
            <Link href="/invoices/new" className="text-sm text-green-700 hover:underline mt-1 inline-block">
              Create your first invoice →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3">Invoice No.</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Subtotal</th>
                  <th className="px-5 py-3">VAT</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Issued</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{inv.invoiceNo}</td>
                    <td className="px-5 py-3 font-medium">{inv.customerName}</td>
                    <td className="px-5 py-3">{formatNaira(inv.subtotal)}</td>
                    <td className="px-5 py-3 text-gray-500">{formatNaira(inv.vatAmount)}</td>
                    <td className="px-5 py-3 font-semibold">{formatNaira(inv.total)}</td>
                    <td className="px-5 py-3">
                      <Badge className={invoiceStatusColor[inv.status] ?? statusColor(inv.status)}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{formatDate(inv.issueDate)}</td>
                    <td className="px-5 py-3">
                      <a
                        href={`/api/invoices/${inv.id}/download`}
                        target="_blank"
                        className="text-xs text-green-700 hover:underline"
                      >
                        View / Print
                      </a>
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
