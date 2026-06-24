// src/app/api/invoices/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/tax-calculator";

// Printable HTML invoice (browser print-to-PDF), same approach as the certificate route.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { items: true, user: true },
  });

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const isOwner = invoice.userId === session.user.id;
  const isAdmin = (session.user as any).role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const issuer = invoice.user;

  const rowsHtml = invoice.items
    .map(
      (item) => `
    <tr>
      <td class="cell">${item.description}</td>
      <td class="cell num">${item.quantity}</td>
      <td class="cell num">${formatNaira(item.unitPrice)}</td>
      <td class="cell num">${formatNaira(item.lineTotal)}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice — ${invoice.invoiceNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, sans-serif; background: #fff; color: #111; padding: 60px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #008751; padding-bottom: 20px; margin-bottom: 30px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo-mark { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #008751; border-radius: 10px; color: #fff; font-weight: 700; font-size: 18px; }
    h1 { font-size: 20px; font-weight: 700; color: #008751; }
    .meta { text-align: right; font-size: 13px; color: #555; }
    .meta .inv-no { font-family: monospace; color: #111; font-weight: 600; margin-top: 4px; }
    .parties { display: flex; justify-content: space-between; margin: 30px 0; gap: 40px; }
    .party h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
    .party p { font-size: 13px; color: #222; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    thead th { text-align: left; font-size: 11px; text-transform: uppercase; color: #888; padding: 10px 12px; border-bottom: 2px solid #e5e7eb; }
    .cell { padding: 12px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
    .num { text-align: right; }
    .totals { margin-top: 20px; margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #555; }
    .totals-row.grand { border-top: 2px solid #111; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; color: #111; }
    .status { display: inline-block; margin-top: 24px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status.issued { background: #dbeafe; color: #1d4ed8; }
    .status.paid { background: #dcfce7; color: #15803d; }
    .status.void { background: #fee2e2; color: #b91c1c; }
    .status.draft { background: #f3f4f6; color: #555; }
    .notes { margin-top: 30px; font-size: 12px; color: #777; }
    .footer { margin-top: 50px; font-size: 11px; color: #aaa; text-align: center; }
    @media print { body { padding: 40px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="logo-mark">T</div>
      <div>
        <h1>Taxign</h1>
        <p style="font-size:12px;color:#777;">E-Invoice</p>
      </div>
    </div>
    <div class="meta">
      <div>Invoice No.</div>
      <div class="inv-no">${invoice.invoiceNo}</div>
      <div style="margin-top:8px;">Issue Date: ${new Date(invoice.issueDate).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}</div>
      ${invoice.dueDate ? `<div>Due: ${new Date(invoice.dueDate).toLocaleDateString("en-NG", { day: "2-digit", month: "long", year: "numeric" })}</div>` : ""}
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h4>From</h4>
      <p><strong>${issuer.firstName} ${issuer.lastName}</strong></p>
      <p>${issuer.email}</p>
      ${issuer.tin ? `<p>TIN: ${issuer.tin}</p>` : ""}
    </div>
    <div class="party">
      <h4>Bill To</h4>
      <p><strong>${invoice.customerName}</strong></p>
      ${invoice.customerEmail ? `<p>${invoice.customerEmail}</p>` : ""}
      ${invoice.customerTin ? `<p>TIN: ${invoice.customerTin}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Qty</th>
        <th class="num">Unit Price</th>
        <th class="num">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>${formatNaira(invoice.subtotal)}</span></div>
    <div class="totals-row"><span>VAT (${(invoice.vatRate * 100).toFixed(1)}%)</span><span>${formatNaira(invoice.vatAmount)}</span></div>
    <div class="totals-row grand"><span>Total</span><span>${formatNaira(invoice.total)}</span></div>
  </div>

  <span class="status ${invoice.status.toLowerCase()}">${invoice.status}</span>

  ${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ""}

  <div class="footer">Generated by Taxign — Web-based Tax Assessment System</div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNo}.html"`,
    },
  });
}
