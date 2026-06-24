// src/app/(taxpayer)/payment/[returnId]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Input, Select } from "@/components/ui";
import { formatNaira } from "@/lib/tax-calculator";
import { CheckCircle, Copy } from "lucide-react";

type ReturnDetail = {
  id: string;
  taxYear: number;
  taxType: string;
  taxDue: number;
  status: string;
  payment: { status: string; reference: string } | null;
};

const BANK_ACCOUNTS = [
  { bank: "Guaranty Trust Bank", accountName: "Taxign Collections", accountNo: "0123456789" },
  { bank: "Access Bank",         accountName: "Taxign Collections", accountNo: "0987654321" },
];

export default function PaymentDetailPage() {
  const { returnId } = useParams<{ returnId: string }>();
  const router = useRouter();

  const [taxReturn, setTaxReturn] = useState<ReturnDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    channel: "bank_transfer",
    bankName: BANK_ACCOUNTS[0].bank,
    reference: "",
  });

  useEffect(() => {
    fetch("/api/tax-returns")
      .then((r) => r.json())
      .then((all: ReturnDetail[]) => {
        const found = all.find((r) => r.id === returnId) ?? null;
        setTaxReturn(found);
        setLoading(false);
      });
  }, [returnId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.reference.trim()) {
      setError("Please enter your payment reference / teller number.");
      return;
    }
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taxReturnId: returnId,
        channel: form.channel,
        bankName: form.channel === "bank_transfer" ? form.bankName : undefined,
        reference: form.reference.trim(),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not submit payment.");
      setSubmitting(false);
      return;
    }
    setDone(true);
    setSubmitting(false);
  }

  function copyAccount(accountNo: string) {
    navigator.clipboard?.writeText(accountNo);
  }

  if (loading) {
    return <div className="max-w-xl mx-auto py-10 text-center text-gray-400 text-sm">Loading…</div>;
  }

  if (!taxReturn) {
    return (
      <div className="max-w-xl mx-auto py-10 text-center">
        <p className="text-gray-500 text-sm">Return not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/payment")}>
          Back to Payments
        </Button>
      </div>
    );
  }

  if (taxReturn.payment?.status === "PAID" || done) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <Card className="p-8 text-center">
          <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {done ? "Payment Submitted" : "Already Paid"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {done
              ? "Your payment reference has been recorded and is pending confirmation by an administrator."
              : "This return has already been marked as paid."}
          </p>
          <Button onClick={() => router.push("/payment")}>Back to Payments</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Make Payment</h1>
        <p className="text-gray-500 text-sm mt-1">
          {taxReturn.taxYear} — {taxReturn.taxType.replace("_", " ")}
        </p>
      </div>

      <Card className="p-5 bg-orange-50 border-orange-100">
        <p className="text-sm text-orange-700">Amount due</p>
        <p className="text-2xl font-bold text-orange-700">{formatNaira(taxReturn.taxDue)}</p>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Bank Transfer Details</h2>
        <p className="text-sm text-gray-500">
          Transfer the exact amount above to one of the accounts below, then enter your teller
          number or transaction reference to confirm.
        </p>
        <div className="space-y-3">
          {BANK_ACCOUNTS.map((acc) => (
            <div key={acc.accountNo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">{acc.bank}</p>
                <p className="text-xs text-gray-500">{acc.accountName}</p>
                <p className="text-sm font-mono text-gray-700 mt-1">{acc.accountNo}</p>
              </div>
              <button
                onClick={() => copyAccount(acc.accountNo)}
                className="p-2 text-gray-400 hover:text-gray-700"
                title="Copy account number"
              >
                <Copy size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Confirm Your Payment</h2>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            id="channel"
            label="Payment Method"
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value })}
            options={[
              { value: "bank_transfer", label: "Bank Transfer" },
              { value: "remita",        label: "Remita (RRR)" },
              { value: "paystack",      label: "Paystack" },
            ]}
          />

          {form.channel === "bank_transfer" && (
            <Select
              id="bankName"
              label="Bank Used"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              options={BANK_ACCOUNTS.map((a) => ({ value: a.bank, label: a.bank }))}
            />
          )}

          <Input
            id="reference"
            label={form.channel === "bank_transfer" ? "Teller / Transaction Reference" : "Payment Reference"}
            required
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            placeholder="e.g. TRX-2026-00045"
          />

          <Button type="submit" loading={submitting} className="w-full" size="lg">
            Submit Payment
          </Button>
        </form>
      </Card>
    </div>
  );
}
