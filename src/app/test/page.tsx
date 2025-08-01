export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡ContaPyme Funcionando! ✅
        </h1>
        <p className="text-gray-600 mb-4">
          Next.js 14 + Tailwind CSS están correctamente configurados
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>📦 Dependencias: OK</p>
          <p>🎨 Estilos: OK</p>
          <p>⚛️ React: OK</p>
        </div>
        <div className="mt-6">
          <a 
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-block"
          >
            Ir a la app principal
          </a>
        </div>
      </div>
    </div>
  )
}