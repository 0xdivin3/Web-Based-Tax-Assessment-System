// src/app/(taxpayer)/file-return/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card } from "@/components/ui";
import { computeTax, formatNaira } from "@/lib/tax-calculator";

const TAX_YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { value: String(y), label: String(y) };
});

const TAX_TYPES = [
  { value: "PERSONAL_INCOME", label: "Personal Income Tax" },
  { value: "COMPANY_INCOME",  label: "Company Income Tax" },
  { value: "VAT",             label: "Value Added Tax" },
  { value: "WITHHOLDING",     label: "Withholding Tax" },
  { value: "CAPITAL_GAINS",   label: "Capital Gains Tax" },
];

export default function FileReturnPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    taxYear: String(new Date().getFullYear() - 1),
    taxType: "PERSONAL_INCOME",
    grossIncome: "",
    otherIncome: "",
    otherDeductions: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const computed = form.grossIncome
    ? computeTax({
        grossIncome:     parseFloat(form.grossIncome) || 0,
        otherIncome:     parseFloat(form.otherIncome) || 0,
        otherDeductions: parseFloat(form.otherDeductions) || 0,
      })
    : null;

  async function handleSubmit(action: "SAVE_DRAFT" | "SUBMIT") {
    setLoading(true);
    setError("");
    const res = await fetch("/api/tax-returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taxYear:         parseInt(form.taxYear),
        taxType:         form.taxType,
        grossIncome:     parseFloat(form.grossIncome) || 0,
        otherIncome:     parseFloat(form.otherIncome) || 0,
        otherDeductions: parseFloat(form.otherDeductions) || 0,
        action,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to save return.");
      setLoading(false);
      return;
    }
    router.push(action === "SUBMIT" ? "/history" : "/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">File Tax Return</h1>
        <p className="text-gray-500 text-sm mt-1">Step {step} of 2</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-green-600" : "bg-gray-200"}`}/>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
      )}

      {step === 1 && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Return Details</h2>
          <Select id="taxYear" label="Tax Year" value={form.taxYear} onChange={set("taxYear")} options={TAX_YEARS}/>
          <Select id="taxType" label="Tax Type" value={form.taxType} onChange={set("taxType")} options={TAX_TYPES}/>
          <Input id="grossIncome" label="Gross Annual Income (₦)" type="number" min="0" value={form.grossIncome} onChange={set("grossIncome")} placeholder="3600000" hint="Your total income before any deductions"/>
          <Input id="otherIncome" label="Other Income (₦)" type="number" min="0" value={form.otherIncome} onChange={set("otherIncome")} placeholder="0" hint="Rental income, dividends, etc."/>
          <Input id="otherDeductions" label="Additional Deductions (₦)" type="number" min="0" value={form.otherDeductions} onChange={set("otherDeductions")} placeholder="0" hint="Life assurance, NHF contributions, etc."/>
          <Button onClick={() => setStep(2)} disabled={!form.grossIncome} className="w-full" size="lg">
            Calculate Tax →
          </Button>
        </Card>
      )}

      {step === 2 && computed && (
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tax Computation Summary</h2>
            <div className="space-y-2 text-sm">
              {[
                ["Gross Income",        computed.grossIncome],
                ["Other Income",        computed.otherIncome],
                ["Total Income",        computed.totalIncome],
                ["Personal Relief",     -computed.personalRelief],
                ["Pension Relief (8%)", -computed.pensionRelief],
                ["Other Deductions",    -computed.otherDeductions],
                ["Taxable Income",      computed.taxableIncome],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-600">{label}</span>
                  <span className={`font-medium ${Number(value) < 0 ? "text-red-600" : "text-gray-900"}`}>
                    {formatNaira(Math.abs(Number(value)))}
                    {Number(value) < 0 ? " (deduction)" : ""}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-2 mt-2 bg-green-50 px-3 rounded-lg">
                <span className="font-semibold text-green-800">Tax Liability</span>
                <span className="font-bold text-green-800 text-lg">{formatNaira(computed.taxLiability)}</span>
              </div>
              <p className="text-xs text-gray-400 text-right">
                Effective rate: {(computed.effectiveRate * 100).toFixed(1)}%
              </p>
            </div>
          </Card>

          {/* Tax band breakdown */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Band Breakdown</h3>
            <div className="space-y-2">
              {computed.breakdown.map((b, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-500">{b.band} on {formatNaira(b.amount)}</span>
                  <span className="font-medium text-gray-900">{formatNaira(b.tax)}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1" size="lg">
              ← Back
            </Button>
            <Button variant="secondary" onClick={() => handleSubmit("SAVE_DRAFT")} loading={loading} className="flex-1" size="lg">
              Save Draft
            </Button>
            <Button onClick={() => handleSubmit("SUBMIT")} loading={loading} className="flex-1" size="lg">
              Submit Return
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
