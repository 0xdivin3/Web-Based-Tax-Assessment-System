// src/app/(taxpayer)/certificate/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { formatNaira } from "@/lib/tax-calculator";
import { Award, Download } from "lucide-react";

export default async function CertificatePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;

  const returns = await prisma.taxReturn.findMany({
    where: { userId, certificate: { isNot: null } },
    include: { certificate: true },
    orderBy: { taxYear: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Clearance Certificates</h1>
        <p className="text-gray-500 text-sm mt-1">
          Download your tax clearance certificates for approved returns.
        </p>
      </div>

      {returns.length === 0 ? (
        <Card className="p-10 text-center">
          <Award size={36} className="mx-auto mb-3 text-gray-300"/>
          <p className="font-medium text-gray-500">No certificates available</p>
          <p className="text-sm text-gray-400 mt-1">
            Certificates are issued once your return is approved and payment confirmed.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 bg-green-50 rounded-xl text-green-700">
                    <Award size={22}/>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {r.taxYear} Tax Clearance Certificate
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {r.taxType.replace("_", " ")}
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-gray-400">
                      <p>Certificate No: <span className="font-mono text-gray-600">{r.certificate?.certificateNo}</span></p>
                      <p>Issued: {r.certificate ? formatDate(r.certificate.issuedAt) : "—"}</p>
                      <p>Valid until: {r.certificate ? formatDate(r.certificate.validUntil) : "—"}</p>
                      <p>Tax paid: {formatNaira(r.taxLiability)}</p>
                    </div>
                  </div>
                </div>
                <a
                  href={`/api/certificate/${r.id}/download`}
                  className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800"
                >
                  <Download size={14}/>
                  Download PDF
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
