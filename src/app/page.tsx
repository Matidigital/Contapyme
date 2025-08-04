import Link from 'next/link'
import { Header } from '@/components/layout'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import EconomicIndicatorsBanner from '@/components/EconomicIndicatorsBanner'
import { CompanyProvider, useCompanyData } from '@/contexts/CompanyContext'

// Componente para mostrar empresa demo
function DemoCompanyShowcase() {
  const { 
    getDisplayName, 
    rut, 
    giro, 
    isDemoMode 
  } = useCompanyData();

  return (
    <div className="mb-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Explora con Empresa Demo</h2>
        <p className="text-gray-600">Prueba todas las funcionalidades con datos realistas</p>
      </div>
      
      <Card className="max-w-4xl mx-auto border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {getDisplayName().charAt(0)}
                </span>
              </div>
              <div>
                <CardTitle className="text-xl">{getDisplayName()}</CardTitle>
                <CardDescription className="text-base">
                  RUT: {rut} • {giro}
                </CardDescription>
              </div>
            </div>
            {isDemoMode && (
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  🎯 Modo Demo Activo
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">F29 Análisis</h3>
              <p className="text-sm text-gray-600 mb-3">Análisis automático de formularios fiscales con IA</p>
              <Link href="/accounting/f29-analysis">
                <Button variant="primary" size="sm" className="w-full">
                  Probar Análisis
                </Button>
              </Link>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Análisis Comparativo</h3>
              <p className="text-sm text-gray-600 mb-3">Compara períodos y obtén insights automáticos</p>
              <Link href="/accounting/f29-comparative">
                <Button variant="success" size="sm" className="w-full">
                  Ver Comparativo
                </Button>
              </Link>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dashboard Ejecutivo</h3>
              <p className="text-sm text-gray-600 mb-3">Vista completa de tu empresa desde un solo lugar</p>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="w-full">
                  Ir al Dashboard
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 text-green-500 mt-0.5">
                ✅
              </div>
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Funcionalidades Completamente Disponibles</p>
                <p>
                  Todas las funcionalidades están activas con datos demo realistas. 
                  Explora libremente - no hay límites en modo demostración.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Inicio"
        subtitle="Bienvenido a ContaPyme"
        actions={
          <div className="flex space-x-2">
            <Link href="/design-system">
              <Button variant="outline" size="sm">Sistema de Diseño</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="primary" size="sm">🏢 Dashboard Empresarial</Button>
            </Link>
          </div>
        }
      />

      <main className="max-w-6xl mx-auto py-12 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              ContaPyme
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sistema Contable Integral para PyMEs chilenas con análisis automático de formularios F29
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button variant="primary" size="lg">
                🏢 Acceder al Dashboard Empresarial
              </Button>
            </Link>
            <Link href="/accounting">
              <Button variant="success" size="lg">
                📊 Explorar Funcionalidades
              </Button>
            </Link>
          </div>

          {/* Info Banner */}
          <Card variant="flat" className="bg-blue-50 border border-blue-200 max-w-3xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm">💡</span>
                </div>
                <div className="text-left">
                  <p className="text-blue-900 font-medium mb-1">Modo Demo Activo</p>
                  <p className="text-blue-700 text-sm">
                    Explora todas las funcionalidades sin registrarte. 
                    Sistema completamente funcional con análisis F29 automático.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card hover={true} variant="elevated">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-xl mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <CardTitle>Dashboard Integral</CardTitle>
              <CardDescription>
                Vista completa de la salud financiera de tu empresa con métricas en tiempo real
              </CardDescription>
            </CardHeader>
          </Card>

          <Card hover={true} variant="elevated">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-xl mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <CardTitle>Análisis F29 Automático</CardTitle>
              <CardDescription>
                Sube tu formulario F29 y obtén análisis detallado con 85-95% de confiabilidad
              </CardDescription>
            </CardHeader>
          </Card>

          <Card hover={true} variant="elevated">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-xl mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <CardTitle>Análisis Comparativo</CardTitle>
              <CardDescription>
                Compara múltiples períodos y obtén insights automáticos de tendencias y estacionalidad
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Economic Indicators - Strategic Position */}
        <div className="mb-12">
          <EconomicIndicatorsBanner />
        </div>

        {/* Demo Company Showcase - Temporalmente comentado para build */}
        {/* <CompanyProvider demoMode={true}>
          <DemoCompanyShowcase />
        </CompanyProvider> */}

        {/* Featured Module */}
        <Card variant="bordered" className="border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-xl">Módulo Contabilidad</CardTitle>
                <CardDescription className="text-base">
                  ✅ Completamente funcional con análisis F29 automático
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Funcionalidades Principales:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Análisis individual de formularios F29
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Análisis comparativo temporal (hasta 24 períodos)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Detección automática de códigos fiscales
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Validación matemática de consistencia
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Insights automáticos en español
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Estadísticas del Sistema:</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">Confiabilidad</span>
                    <span className="text-sm font-bold text-blue-600">85-95%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-900">Estrategias de Parsing</span>
                    <span className="text-sm font-bold text-green-600">4 métodos</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-900">Estado del Sistema</span>
                    <span className="text-sm font-bold text-purple-600">100% Funcional</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/accounting/f29-analysis">
                <Button variant="primary">📄 Análisis F29 Individual</Button>
              </Link>
              <Link href="/accounting/f29-comparative">
                <Button variant="success">📊 Análisis Comparativo</Button>
              </Link>
              <Link href="/accounting">
                <Button variant="outline">Ver Módulo Completo</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}