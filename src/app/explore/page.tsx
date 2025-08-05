'use client';

import Link from 'next/link'
import { Header } from '@/components/layout'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { Calculator, Users, ChevronRight, CheckCircle, Clock, ArrowLeft } from 'lucide-react'

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      {/* Animated Background Elements - Premium */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000" />
      </div>
      <Header 
        title="Explorar Funcionalidades"
        subtitle="Selecciona el módulo que deseas explorar"
        showBackButton
        variant="premium"
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section - Premium Style */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <span className="mr-2">🚀</span>
            Exploración Completa • Sin Límites • Sin Registro
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Descubre el poder de
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> ContaPyme Professional</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Accede a todas las funcionalidades con datos demo realistas. 
            Experimenta la diferencia de una plataforma contable de clase empresarial.
          </p>
        </div>

        {/* Module Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contabilidad Module */}
          <div className="group relative">
            <Link href="/accounting">
              <Card className="h-full hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-green-200 hover:border-green-400 group-hover:bg-gradient-to-br group-hover:from-green-50 group-hover:to-emerald-50 bg-white/80 backdrop-blur-sm">
                {/* Header with gradient */}
                <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                        <Calculator className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-white">Módulo de Contabilidad</CardTitle>
                        <CardDescription className="text-green-100 text-base">
                          Gestión financiera completa y análisis automático
                        </CardDescription>
                      </div>
                    </div>
                    <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="p-8">
                  {/* Status Badge */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      ✅ Completamente Funcional
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">📄</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Análisis F29 Automático</p>
                        <p className="text-sm text-gray-600">Sube formularios y obtén análisis detallado con 85-95% confiabilidad</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">📊</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Análisis Comparativo</p>
                        <p className="text-sm text-gray-600">Compara hasta 24 períodos con insights automáticos</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">🏢</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Plan de Cuentas IFRS</p>
                        <p className="text-sm text-gray-600">Gestión completa con importación/exportación</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">🏭</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Activos Fijos</p>
                        <p className="text-sm text-gray-600">CRUD completo con depreciación automática</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">📈</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Indicadores Económicos</p>
                        <p className="text-sm text-gray-600">UF, UTM, tipos de cambio en tiempo real</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="bg-green-50 rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">5</p>
                        <p className="text-sm text-green-700">Módulos Activos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">95%</p>
                        <p className="text-sm text-green-700">Confiabilidad</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="text-center">
                    <Button variant="success" size="lg" className="w-full group-hover:bg-green-600">
                      🚀 Explorar Módulo de Contabilidad
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Remuneraciones Module */}
          <div className="group relative">
            <Link href="/payroll">
              <Card className="h-full hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-blue-200 hover:border-blue-400 group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-indigo-50 bg-white/80 backdrop-blur-sm">
                {/* Header with gradient */}
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-white">Módulo de Remuneraciones</CardTitle>
                        <CardDescription className="text-blue-100 text-base">
                          Gestión integral de recursos humanos
                        </CardDescription>
                      </div>
                    </div>
                    <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="p-8">
                  {/* Status Badge */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <Clock className="w-4 h-4 mr-2" />
                      🔄 En Desarrollo Activo
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">👥</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Gestión de Empleados</p>
                        <p className="text-sm text-gray-600">Base implementada para agregar y gestionar empleados</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">📋</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500">Contratos y Nóminas</p>
                        <p className="text-sm text-gray-500">Próximamente disponible</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">⏰</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500">Control de Asistencia</p>
                        <p className="text-sm text-gray-500">En planificación</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">📊</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500">Reportes Previsionales</p>
                        <p className="text-sm text-gray-500">En desarrollo</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">💰</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500">Cálculo de Liquidaciones</p>
                        <p className="text-sm text-gray-500">Próximamente</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="bg-blue-50 rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">1</p>
                        <p className="text-sm text-blue-700">Módulo Base</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">25%</p>
                        <p className="text-sm text-blue-700">Progreso</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="text-center">
                    <Button variant="primary" size="lg" className="w-full group-hover:bg-blue-600">
                      👀 Ver Módulo de Remuneraciones
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Quick Stats - Premium Enhancement */}
        <Card variant="bordered" className="border-gray-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">Estado General del Sistema</CardTitle>
            <CardDescription className="text-center">
              Resumen de funcionalidades disponibles para explorar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-gray-600">Contabilidad Funcional</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">25%</p>
                <p className="text-sm text-gray-600">Remuneraciones</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-sm text-gray-600">Submódulos Activos</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">Demo</p>
                <p className="text-sm text-gray-600">Acceso Completo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Helper */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            ¿Quieres volver al inicio o configurar el sistema?
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Inicio
              </Button>
            </Link>
            <Link href="/accounting/configuration">
              <Button variant="ghost">
                ⚙️ Configuración Sistema
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Custom animations - Premium */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}