// src/app/page.tsx
import Link from "next/link";
import { Shield, FileText, CreditCard, Award } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-green-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-white/15 rounded-lg">
              <span className="font-bold text-lg">T</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Taxign</p>
              <p className="text-xs text-green-200">Web-based Tax Assessment System</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-white hover:underline">Sign In</Link>
            <Link href="/register" className="px-4 py-2 text-sm bg-white text-green-800 rounded-lg font-medium hover:bg-green-50">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-green-800 text-white pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">File Your Taxes Online</h1>
          <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
            Assess, file, and pay your taxes securely from anywhere.
            Fast, transparent, and paperless.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="px-6 py-3 bg-white text-green-800 rounded-lg font-semibold hover:bg-green-50">
              Get Started
            </Link>
            <Link href="/login" className="px-6 py-3 border border-white/50 text-white rounded-lg hover:bg-white/10">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: Shield,   title: "Register",        desc: "Create an account and get your TIN instantly." },
            { icon: FileText, title: "File Return",      desc: "Fill in your income details. We compute the tax." },
            { icon: CreditCard,title: "Pay Online",     desc: "Pay securely via Remita or bank transfer." },
            { icon: Award,    title: "Get Certificate", desc: "Download your tax clearance certificate." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="inline-flex p-3 bg-green-50 text-green-700 rounded-xl mb-4">
                <Icon size={24}/>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 text-center py-8 text-sm">
        <p>© 2026 Taxign. All rights reserved.</p>
      </footer>
    </div>
  );
}
