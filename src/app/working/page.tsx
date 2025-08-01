import Link from 'next/link'

export default function WorkingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          🎉 ¡Funcionando!
        </h1>
        
        <p className="text-gray-600 mb-6">
          ContaPyme se ha desplegado correctamente en tu máquina local
        </p>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="font-semibold text-green-800">✅ Next.js</div>
            <div className="text-green-600">v14.2.30</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="font-semibold text-blue-800">✅ React</div>
            <div className="text-blue-600">v18</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="font-semibold text-purple-800">✅ Tailwind</div>
            <div className="text-purple-600">Activo</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="font-semibold text-yellow-800">⏳ Supabase</div>
            <div className="text-yellow-600">Pendiente</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link 
            href="/"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            🏠 Ir a la página principal
          </Link>
          
          <div className="bg-gray-50 border rounded-lg p-4 text-left">
            <div className="text-sm font-semibold text-gray-700 mb-2">Siguiente paso:</div>
            <div className="text-xs text-gray-600">
              Configurar Supabase para activar todas las funcionalidades del sistema contable
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
          <div>Puerto: <strong>localhost:3002</strong></div>
          <div>Estado: <span className="text-green-600 font-semibold">✅ Activo</span></div>
        </div>
      </div>
    </div>
  )
}