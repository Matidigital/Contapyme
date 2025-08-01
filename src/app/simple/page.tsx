export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg mx-auto text-center">
        <div className="mb-6">
          <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 ¡ContaPyme Funcionando!
          </h1>
          <p className="text-gray-600 mb-6">
            El proyecto se ha desplegado correctamente en local
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-semibold text-green-800">✅ Next.js 14</div>
            <div className="text-green-600">Funcionando</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-semibold text-blue-800">✅ React 18</div>
            <div className="text-blue-600">Funcionando</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="font-semibold text-purple-800">✅ Tailwind CSS</div>
            <div className="text-purple-600">Funcionando</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="font-semibold text-yellow-800">⏳ Supabase</div>
            <div className="text-yellow-600">Por configurar</div>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
            🚀 Proyecto Listo para Configurar Supabase
          </button>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <strong>Siguiente paso:</strong> Configurar Supabase para activar todas las funcionalidades del sistema contable
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Puerto: <strong>localhost:3002</strong> | 
            Estado: <span className="text-green-600 font-semibold">Activo</span>
          </p>
        </div>
      </div>
    </div>
  )
}