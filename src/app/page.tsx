import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ContaPyme
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistema Contable Integral para PyMEs
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">¡Bienvenido!</h2>
            <p className="text-gray-700 mb-6">
              Tu plataforma para gestionar balances, proyecciones financieras y 
              unificar toda la información contable de tu empresa en un solo lugar.
            </p>
            
            {/* Action Buttons */}
            <div className="mb-8 space-y-3">
              <div className="space-x-4">
                <Link 
                  href="/demo"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
                >
                  🚀 Explorar Demo
                </Link>
                <Link 
                  href="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
                >
                  📊 Ir al Dashboard
                </Link>
                <Link 
                  href="/working"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
                >
                  ✅ Ver Estado
                </Link>
              </div>
              
              <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                <strong>💡 Modo Demo:</strong> Explora todas las funcionalidades sin registrarte. 
                Sistema completamente funcional para probar antes de implementar autenticación.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-blue-600">Dashboard</h3>
                <p className="text-sm text-gray-600">Vista integral de tus finanzas</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-green-600">Balances</h3>
                <p className="text-sm text-gray-600">Información contable en tiempo real</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-purple-600">Proyecciones</h3>
                <p className="text-sm text-gray-600">Análisis predictivo financiero</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}