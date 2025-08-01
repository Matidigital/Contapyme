import Link from 'next/link'

export default function PayrollPage() {
  // Demo mode - no authentication required
  const userProfile = {
    name: 'Usuario Demo',
    email: 'demo@contapyme.com'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 mr-4">
                ← Volver al Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Módulo de Remuneraciones</h1>
            </div>
            <nav className="flex space-x-4">
              <span className="text-gray-600">{userProfile?.name}</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="px-8 py-12 text-white relative">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-4">Gestión de Remuneraciones</h2>
                <p className="text-blue-100 text-lg mb-6">
                  Administra nóminas, liquidaciones y todo el proceso de recursos humanos de tu empresa
                </p>
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                    <span className="text-sm font-medium">✨ Próximamente</span>
                  </div>
                </div>
              </div>
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <path fill="currentColor" d="M47.1,-78.5C59.9,-69.2,67.6,-53.4,75.8,-37.2C84,-21,92.7,-4.4,94.1,13.5C95.5,31.4,89.6,50.6,79.2,66.4C68.8,82.2,53.9,94.6,37.1,99.7C20.3,104.8,1.6,102.6,-18.1,97.8C-37.8,93,-58.5,85.6,-73.6,72.2C-88.7,58.8,-98.2,39.4,-102.1,18.7C-106,-2,-104.3,-23.9,-95.8,-42.2C-87.3,-60.5,-72,-75.2,-54.8,-82.9C-37.6,-90.6,-18.8,-91.3,-0.8,-89.9C17.2,-88.5,34.3,-87.8,47.1,-78.5Z" transform="translate(100 100)" />
                </svg>
              </div>
            </div>
          </div>

          {/* Coming Soon Features */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Funcionalidades que estarán disponibles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Empleados */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
                <div className="w-14 h-14 bg-blue-100 rounded-xl mb-4 flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Gestión de Empleados</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    Registro de empleados y contratos
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    Datos personales y laborales
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    Organigrama empresarial
                  </li>
                </ul>
              </div>

              {/* Nóminas */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
                <div className="w-14 h-14 bg-green-100 rounded-xl mb-4 flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Nóminas y Liquidaciones</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    Cálculo automático de sueldos
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    Liquidaciones de sueldo
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    Descuentos y bonificaciones
                  </li>
                </ul>
              </div>

              {/* Asistencia */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
                <div className="w-14 h-14 bg-purple-100 rounded-xl mb-4 flex items-center justify-center">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Control de Asistencia</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                    Registro de entrada y salida
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                    Control de horas trabajadas
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                    Gestión de vacaciones y permisos
                  </li>
                </ul>
              </div>

              {/* Reportes */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
                <div className="w-14 h-14 bg-yellow-100 rounded-xl mb-4 flex items-center justify-center">
                  <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Reportes Previsionales</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></div>
                    Libro de remuneraciones
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></div>
                    Certificados de renta
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></div>
                    Declaraciones previsionales
                  </li>
                </ul>
              </div>

              {/* Integración */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500">
                <div className="w-14 h-14 bg-red-100 rounded-xl mb-4 flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Integración Contable</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                    Conexión con contabilidad
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                    Asientos automáticos
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                    Centros de costo
                  </li>
                </ul>
              </div>

              {/* Dashboard */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-indigo-500">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl mb-4 flex items-center justify-center">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Dashboard RRHH</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></div>
                    Indicadores de RRHH
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></div>
                    Estadísticas de nómina
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></div>
                    Alertas y notificaciones
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">¡Próximamente disponible!</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Estamos trabajando en el módulo de remuneraciones para ofrecerte una solución completa 
              de gestión de recursos humanos integrada con tu sistema contable.
            </p>
            <div className="flex justify-center space-x-4">
              <Link 
                href="/accounting"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Ir a Contabilidad
              </Link>
              <Link 
                href="/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Volver al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}