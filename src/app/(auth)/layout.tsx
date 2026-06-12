// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* FIRS brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex gap-1 mb-3">
            <div className="w-5 h-8 bg-green-700 rounded-sm"/>
            <div className="w-5 h-8 bg-white border border-gray-200 rounded-sm"/>
            <div className="w-5 h-8 bg-green-700 rounded-sm"/>
          </div>
          <h1 className="font-bold text-gray-900 text-lg">FIRS Tax Assessment Portal</h1>
          <p className="text-gray-500 text-sm">Federal Inland Revenue Service of Nigeria</p>
        </div>
        {children}
      </div>
    </div>
  );
}
