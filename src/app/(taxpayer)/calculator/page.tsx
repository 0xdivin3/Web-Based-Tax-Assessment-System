// src/app/(taxpayer)/calculator/page.tsx
"use client";
import { useState } from "react";
import { Input, Card } from "@/components/ui";
import { computeTax, formatNaira, NIGERIA_TAX_BANDS } from "@/lib/tax-calculator";

export default function CalculatorPage() {
  const [gross, setGross] = useState("");
  const [other, setOther] = useState("");
  const [deductions, setDeductions] = useState("");

  const result = gross
    ? computeTax({
        grossIncome:     parseFloat(gross) || 0,
        otherIncome:     parseFloat(other) || 0,
        otherDeductions: parseFloat(deductions) || 0,
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Calculator</h1>
        <p className="text-gray-500 text-sm mt-1">
          Estimate your Personal Income Tax under the CITA/PITA framework.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <Input label="Annual Gross Income (₦)" type="number" value={gross} onChange={(e) => setGross(e.target.value)} placeholder="e.g. 3600000"/>
        <Input label="Other Income (₦)" type="number" value={other} onChange={(e) => setOther(e.target.value)} placeholder="0"/>
        <Input label="Additional Deductions (₦)" type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} placeholder="0"/>
      </Card>

      {result && (
        <>
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Results</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: "Total Income",       value: result.totalIncome,      highlight: false },
                { label: "Total Deductions",   value: result.totalDeductions,  highlight: false },
                { label: "Taxable Income",     value: result.taxableIncome,    highlight: false },
                { label: "Tax Liability",      value: result.taxLiability,     highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className={`flex justify-between p-3 rounded-lg ${highlight ? "bg-green-50" : "bg-gray-50"}`}>
                  <span className={highlight ? "font-semibold text-green-800" : "text-gray-600"}>{label}</span>
                  <span className={highlight ? "font-bold text-green-800" : "font-medium text-gray-900"}>{formatNaira(value)}</span>
                </div>
              ))}
              <p className="text-xs text-right text-gray-400">
                Effective rate: {(result.effectiveRate * 100).toFixed(1)}%
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Band Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b">
                    <th className="pb-2">Rate</th>
                    <th className="pb-2">Taxable Amount</th>
                    <th className="pb-2 text-right">Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {result.breakdown.map((b, i) => (
                    <tr key={i}>
                      <td className="py-2 text-gray-500">{b.band}</td>
                      <td className="py-2">{formatNaira(b.amount)}</td>
                      <td className="py-2 text-right font-medium">{formatNaira(b.tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Tax bands reference */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Nigeria 2024 Tax Bands</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-2">Annual Income Band</th>
                <th className="pb-2 text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              <tr><td className="py-2">First ₦300,000</td><td className="py-2 text-right">7%</td></tr>
              <tr><td className="py-2">Next ₦300,000</td><td className="py-2 text-right">11%</td></tr>
              <tr><td className="py-2">Next ₦500,000</td><td className="py-2 text-right">15%</td></tr>
              <tr><td className="py-2">Next ₦500,000</td><td className="py-2 text-right">19%</td></tr>
              <tr><td className="py-2">Next ₦1,600,000</td><td className="py-2 text-right">21%</td></tr>
              <tr><td className="py-2">Balance above ₦3,200,000</td><td className="py-2 text-right">24%</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
