// src/app/api/certificate/[returnId]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/tax-calculator";

// Simple HTML-based certificate returned as HTML page (printable to PDF by browser)
// For a real PDF, integrate jsPDF server-side or use a PDF generation service.
export async function GET(
  req: NextRequest,
  { params }: { params: { returnId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const taxReturn = await prisma.taxReturn.findUnique({
    where: { id: params.returnId },
    include: {
      certificate: true,
      user: true,
    },
  });

  if (!taxReturn || !taxReturn.certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  // Ensure taxpayers can only download their own
  if (
    (session.user as any).role !== "ADMIN" &&
    taxReturn.userId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cert = taxReturn.certificate;
  const user = taxReturn.user;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Tax Clearance Certificate — ${cert.certificateNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, sans-serif; background: #fff; color: #111; padding: 60px; }
    .header { display: flex; align-items: center; gap: 16px; border-bottom: 4px solid #008751; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-mark { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #008751; border-radius: 10px; color: #fff; font-weight: 700; font-size: 20px; flex-shrink: 0; }
    h1 { font-size: 22px; font-weight: 700; color: #008751; }
    h2 { font-size: 13px; color: #555; margin-top: 2px; }
    .title { text-align: center; margin: 20px 0 30px; }
    .title h3 { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
    .cert-no { font-size: 13px; color: #777; margin-top: 6px; font-family: monospace; }
    .body-text { font-size: 14px; line-height: 1.8; margin-bottom: 24px; }
    .details { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 24px 0; }
    .detail-row { display: flex; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { width: 200px; padding: 10px 16px; background: #f9fafb; font-size: 12px; color: #555; font-weight: 600; }
    .detail-value { padding: 10px 16px; font-size: 13px; color: #111; }
    .validity { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin-top: 20px; font-size: 13px; color: #166534; }
    .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
    .signature { text-align: center; }
    .sig-line { width: 180px; border-top: 1px solid #333; margin-bottom: 6px; }
    .sig-label { font-size: 11px; color: #555; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(0,135,81,0.05); font-weight: 900; pointer-events: none; }
    @media print { body { padding: 40px; } .watermark { display: block; } }
  </style>
</head>
<body>
  <div class="watermark">TAXIGN</div>

  <div class="header">
    <div class="logo-mark">T</div>
    <div>
      <h1>Taxign</h1>
      <h2>Web-based Tax Assessment System</h2>
    </div>
  </div>

  <div class="title">
    <h3>Tax Clearance Certificate</h3>
    <div class="cert-no">Certificate No: ${cert.certificateNo}</div>
  </div>

  <p class="body-text">
    This is to certify that the taxpayer named below has fulfilled their tax obligations
    for the year stated below, as assessed and recorded on the Taxign platform.
  </p>

  <div class="details">
    <div class="detail-row">
      <div class="detail-label">Full Name</div>
      <div class="detail-value">${user.firstName} ${user.lastName}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Tax Identification No.</div>
      <div class="detail-value">${user.tin ?? "—"}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Email Address</div>
      <div class="detail-value">${user.email}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">State</div>
      <div class="detail-value">${user.state ?? "—"}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Tax Year</div>
      <div class="detail-value">${taxReturn.taxYear}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Tax Type</div>
      <div class="detail-value">${taxReturn.taxType.replace("_", " ")}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Total Income</div>
      <div class="detail-value">${formatNaira(taxReturn.totalIncome)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Tax Assessed</div>
      <div class="detail-value">${formatNaira(taxReturn.taxLiability)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Date Issued</div>
      <div class="detail-value">${new Date(cert.issuedAt).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}</div>
    </div>
  </div>

  <div class="validity">
    ✓ This certificate is valid until <strong>${new Date(cert.validUntil).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}</strong>.
    For verification, contact Taxign support via support@taxign.app.
  </div>

  <div class="footer">
    <div></div>
    <div class="signature">
      <div class="sig-line"></div>
      <div class="sig-label">Authorised Signatory</div>
      <div class="sig-label" style="margin-top:2px; font-weight:600;">Taxign</div>
    </div>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `inline; filename="certificate-${cert.certificateNo}.html"`,
    },
  });
}
