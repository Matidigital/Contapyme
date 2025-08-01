'use client'

import Link from 'next/link'

export default function F29AnalysisPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/accounting" className="text-gray-600 hover:text-gray-900 mr-4">
                ← Volver a Contabilidad
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Análisis F29</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Análisis F29 - Próximamente</h2>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🚀 Funcionalidad en Desarrollo</h3>
            <p className="text-gray-700 mb-4">
              El módulo de análisis automático de formularios F29 está siendo optimizado para el despliegue en producción.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4">
                <div className="font-semibold text-green-600 mb-2">✅ Completado</div>
                <ul className="text-left space-y-1 text-gray-600">
                  <li>• Parser F29 con 4 estrategias</li>
                  <li>• Validador automático</li>
                  <li>• Extracción de códigos SII</li>
                  <li>• Cálculos tributarios</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="font-semibold text-amber-600 mb-2">🔧 En Proceso</div>
                <ul className="text-left space-y-1 text-gray-600">
                  <li>• Optimización PDF.js</li>
                  <li>• Compatibilidad servidor</li>
                  <li>• Interfaz de usuario</li>
                  <li>• Exportación de resultados</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">💡 Mientras tanto...</h4>
            <p className="text-blue-800">
              Puedes explorar el resto del sistema contable y probar las otras funcionalidades disponibles.
            </p>
          </div>

          <div className="space-y-4">
            <Link 
              href="/accounting"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Volver al Módulo Contable
            </Link>
            
            <div className="text-sm text-gray-500">
              <p>Estimado de implementación: próxima actualización</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}