// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Taxign brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-700 rounded-xl mb-3">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h1 className="font-bold text-gray-900 text-lg">Taxign</h1>
          <p className="text-gray-500 text-sm">Tax Assessment Portal</p>
        </div>
        {children}
      </div>
    </div>
  );
}
