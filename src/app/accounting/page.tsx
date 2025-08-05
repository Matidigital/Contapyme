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
              <Link href="/explore" className="text-gray-600 hover:text-gray-900 mr-4">
                ← Volver a Explorar
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

          {/* Analysis Tools Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Herramientas de Análisis</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* F29 Analysis */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-6 text-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Análisis F29</h3>
                      <p className="text-indigo-100 text-sm">Situación fiscal con IA</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Link href="/accounting/f29-analysis" className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center space-x-2 transition-all text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Análisis Individual</span>
                    </Link>
                    <Link href="/accounting/f29-comparative" className="w-full bg-white bg-opacity-10 hover:bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center space-x-2 transition-all text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Análisis Comparativo</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* RCV Analysis */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-6 text-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-4 0H3m2 0h6M7 3h10M9 7h6m-6 4h6m-6 4h6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Análisis RCV</h3>
                      <p className="text-emerald-100 text-sm">Proveedores principales</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Link href="/accounting/rcv-analysis" className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center space-x-2 transition-all text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Analizar RCV</span>
                    </Link>
                    <div className="w-full bg-white bg-opacity-10 text-white px-4 py-2 rounded-lg text-sm text-center opacity-60">
                      Gráficos y reportes
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Assets */}
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-6 text-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Activos Fijos</h3>
                      <p className="text-orange-100 text-sm">Gestión y depreciación</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Link href="/accounting/fixed-assets" className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center justify-center space-x-2 transition-all text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span>Gestionar Activos</span>
                    </Link>
                    <div className="w-full bg-white bg-opacity-10 text-white px-4 py-2 rounded-lg text-sm text-center opacity-60">
                      Dashboard ejecutivo
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* F29 Demo Section */}
          <div className="mb-8">

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/accounting/configuration" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Configuración</h3>
              <p className="text-sm text-gray-600">Plan de cuentas IFRS y configuraciones</p>
            </Link>

            <Link href="/accounting/indicators" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-2 border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Indicadores Contables</h3>
              <p className="text-sm text-gray-600">UF, UTM, divisas, criptomonedas en tiempo real</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Nuevo
                </span>
              </div>
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
          </div>

        </div>
      </div>
    </div>
  )
}