import Link from 'next/link'

export default function AccountingPage() {
  // Demo mode - no authentication required
  const userProfile = {
    name: 'Usuario Demo',
    email: 'demo@contapyme.com',
    companies: [
      {
        id: 'demo-1',
        name: 'Empresa Demo S.A.',
        rut: '12.345.678-9'
      },
      {
        id: 'demo-2',
        name: 'Mi Pyme Ltda.',
        rut: '98.765.432-1'
      }
    ]
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
              <h1 className="text-2xl font-bold text-gray-900">Módulo de Contabilidad</h1>
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
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg mb-8">
            <div className="px-6 py-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Gestión Contable</h2>
              <p className="text-green-100">
                Administra toda la información financiera de tus empresas desde un solo lugar
              </p>
            </div>
          </div>

          {/* Companies Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Mis Empresas</h3>
              <Link 
                href="/companies/new"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                + Nueva Empresa
              </Link>
            </div>
            
            {userProfile?.companies && userProfile.companies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProfile.companies.map((company: any) => (
                  <div key={company.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                    <h4 className="font-semibold text-gray-900 text-lg mb-2">{company.name}</h4>
                    <p className="text-gray-600 mb-4">RUT: {company.rut}</p>
                    <Link 
                      href={`/companies/${company.id}`}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-center text-sm font-medium inline-block"
                    >
                      Ver Dashboard Contable
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-4 0H3m2 0h6M7 3h10M9 7h6m-6 4h6m-6 4h6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes empresas registradas</h3>
                <p className="text-gray-600 mb-6">
                  Crea tu primera empresa para comenzar a usar el sistema contable
                </p>
                <Link 
                  href="/companies/new"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
                >
                  Crear Primera Empresa
                </Link>
              </div>
            )}
          </div>

          {/* F29 Analysis Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-6 overflow-hidden">
              <div className="px-8 py-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Análisis Formulario F29</h3>
                    <p className="text-indigo-100">Sube tu formulario F29 y obtén análisis detallado de tu situación fiscal</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="max-w-4xl mx-auto">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Subir Formulario F29</h4>
                  <p className="text-gray-600 mb-4">
                    Arrastra y suelta tu archivo F29 aquí, o haz clic para seleccionar
                  </p>
                  <div className="space-y-2">
                    <Link href="/accounting/f29-analysis" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Iniciar Análisis F29</span>
                    </Link>
                    <p className="text-xs text-gray-500">
                      Formatos soportados: PDF, Excel (.xlsx, .xls), CSV
                    </p>
                  </div>
                </div>

                {/* Demo Analysis Results */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Análisis Automático Incluye:
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Validación de montos declarados</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Cálculo de impuestos adeudados</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Detección de inconsistencias</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Comparación período anterior</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Recomendaciones fiscales</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Vista Previa del Análisis:
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Ventas Totales</span>
                          <span className="text-sm font-bold text-green-600">$17.950.795</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Compras Totales</span>
                          <span className="text-sm font-bold text-blue-600">$12.850.000</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border-2 border-indigo-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Margen Bruto</span>
                          <span className="text-sm font-bold text-indigo-600">$5.100.795</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-center space-x-4">
                  <Link 
                    href="/accounting/f29-analysis"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
                  >
                    📄 Análisis F29 Individual
                  </Link>
                  <Link 
                    href="/accounting/f29-comparative"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
                  >
                    📊 Análisis Comparativo (NUEVO)
                  </Link>
                  <Link 
                    href="/accounting/f29-guide"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium inline-block"
                  >
                    📚 Guía F29
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/accounting/chart-of-accounts" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Plan de Cuentas</h3>
              <p className="text-sm text-gray-600">Estructura y organización de cuentas contables</p>
            </Link>

            <Link href="/accounting/transactions" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Transacciones</h3>
              <p className="text-sm text-gray-600">Registro de asientos contables y libro diario</p>
            </Link>

            <Link href="/accounting/reports" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Reportes</h3>
              <p className="text-sm text-gray-600">Balance general, estado de resultados y más</p>
            </Link>

            <Link href="/accounting/dashboard" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-sm text-gray-600">Vista integral de la salud financiera</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}