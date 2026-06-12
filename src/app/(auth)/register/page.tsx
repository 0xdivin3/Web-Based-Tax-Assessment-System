// src/app/(auth)/register/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Select } from "@/components/ui";
import { nigerianStates } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tin, setTin] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "",
    state: "", lga: "", address: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    setTin(data.tin);
  }

  if (tin) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="inline-flex p-4 bg-green-50 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Registration Successful</h2>
        <p className="text-gray-500 text-sm mb-4">Your Tax Identification Number (TIN) is:</p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-2xl font-mono font-bold text-green-800 tracking-widest">{tin}</p>
        </div>
        <p className="text-xs text-gray-400 mb-6">Please save your TIN. You will need it for all tax transactions.</p>
        <Button onClick={() => router.push("/login")} className="w-full" size="lg">
          Proceed to Sign In
        </Button>
      </div>
    );
  }

  const states = nigerianStates().map((s) => ({ value: s, label: s }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input id="firstName" label="First name" required value={form.firstName} onChange={set("firstName")} placeholder="John"/>
          <Input id="lastName" label="Last name" required value={form.lastName} onChange={set("lastName")} placeholder="Doe"/>
        </div>
        <Input id="email" label="Email address" type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com"/>
        <Input id="phone" label="Phone number" type="tel" required value={form.phone} onChange={set("phone")} placeholder="08012345678"/>
        <Select
          id="state"
          label="State of residence"
          required
          value={form.state}
          onChange={set("state")}
          options={[{ value: "", label: "Select state" }, ...states]}
        />
        <Input id="lga" label="Local Government Area" required value={form.lga} onChange={set("lga")} placeholder="Your LGA"/>
        <Input id="address" label="Address" required value={form.address} onChange={set("address")} placeholder="12 Example Street"/>
        <Input id="password" label="Password" type="password" required value={form.password} onChange={set("password")} placeholder="Min. 8 characters"/>
        <Input id="confirmPassword" label="Confirm password" type="password" required value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="••••••••"/>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Register
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-green-700 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
