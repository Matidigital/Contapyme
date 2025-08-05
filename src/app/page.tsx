'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, IndicatorsTicker } from '@/components/ui'
import Preloader from '@/components/ui/Preloader'
import { useUserIntention, type UserIntention } from '@/hooks/useUserIntention'
import { TrendingUp, Shield, Zap, Globe, ChevronRight, Play } from 'lucide-react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const { captureIntention, getIntentionConfig } = useUserIntention()

  const handleIntentionClick = (intention: UserIntention, context?: Record<string, any>) => {
    captureIntention({ intention, context })
  }

  if (isLoading) {
    return <Preloader onComplete={() => setIsLoading(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img 
                src="/images/logo.webp" 
                alt="ContaPymePuq" 
                className="h-20 w-auto drop-shadow-lg" 
              />
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/design-system">
                <Button variant="ghost" size="sm">Sistema</Button>
              </Link>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </nav>

      {/* Cinta de Indicadores Económicos */}
      <IndicatorsTicker />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <span className="mr-2">🚀</span>
                Plataforma Empresarial • Certificada • Segura
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Potencia tu empresa con
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> inteligencia contable</span>
              </h1>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
                La única plataforma que transforma tus formularios F29 en decisiones estratégicas. 
                Análisis automático, insights en tiempo real y crecimiento empresarial acelerado.
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {/* Analyze F29 - Primary Action */}
              <Link href="/accounting/f29-analysis">
                <Card 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50"
                  onClick={() => handleIntentionClick('analyze_f29', { source: 'hero_primary' })}
                >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">📄</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Analizar F29 Ahora</h3>
                  <p className="text-gray-600 mb-6">Sube tu formulario y obtén análisis automático en segundos</p>
                  <div className="flex items-center justify-center text-blue-600 font-semibold">
                    <Play className="w-4 h-4 mr-2" />
                    Comenzar Análisis
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
                </Card>
              </Link>

              {/* Manage Company */}
              <Link href="/accounting">
                <Card 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-green-200 hover:border-green-400 bg-gradient-to-br from-green-50 to-emerald-50"
                  onClick={() => handleIntentionClick('manage_company', { source: 'hero_secondary' })}
                >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">🏢</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Gestionar Empresa</h3>
                  <p className="text-gray-600 mb-6">Acceso completo a todos los módulos contables</p>
                  <div className="flex items-center justify-center text-green-600 font-semibold">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Dashboard
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
                </Card>
              </Link>

              {/* Explore Features */}
              <Link href="/explore">
                <Card 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-purple-200 hover:border-purple-400 bg-gradient-to-br from-purple-50 to-violet-50"
                  onClick={() => handleIntentionClick('explore_features', { source: 'hero_tertiary' })}
                >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Explorar Todo</h3>
                  <p className="text-gray-600 mb-6">Descubre todas las funcionalidades disponibles</p>
                  <div className="flex items-center justify-center text-purple-600 font-semibold">
                    <Globe className="w-4 h-4 mr-2" />
                    Ver Funciones
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-12 bg-white/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
                <div className="text-sm text-gray-600">Precisión en Análisis</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-sm text-gray-600">Disponibilidad</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">5+</div>
                <div className="text-sm text-gray-600">Módulos Integrados</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">Datos Seguros</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Overview */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Todo lo que necesitas para hacer crecer tu empresa
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Desde análisis automático hasta gestión completa de activos, 
                todo integrado en una plataforma empresarial de clase mundial.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* F29 Analysis */}
              <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl mb-4 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <span className="text-2xl">📊</span>
                  </div>
                  <CardTitle className="text-xl">Análisis F29 Automático</CardTitle>
                  <CardDescription>
                    Procesamiento inteligente con 95% de precisión. 4 algoritmos trabajando en paralelo.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Economic Indicators */}
              <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-xl mb-4 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <span className="text-2xl">💰</span>
                  </div>
                  <CardTitle className="text-xl">Indicadores en Tiempo Real</CardTitle>
                  <CardDescription>
                    UF, UTM, divisas y criptomonedas actualizadas automáticamente desde fuentes oficiales.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Fixed Assets */}
              <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl mb-4 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <span className="text-2xl">🏭</span>
                  </div>
                  <CardTitle className="text-xl">Gestión de Activos</CardTitle>
                  <CardDescription>
                    Control completo con depreciación automática y reportes ejecutivos integrados.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Comparative Analysis */}
              <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl mb-4 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <span className="text-2xl">📈</span>
                  </div>
                  <CardTitle className="text-xl">Análisis Comparativo</CardTitle>
                  <CardDescription>
                    Única funcionalidad en Chile. Compara hasta 24 períodos con insights automáticos.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* IFRS Accounting */}
              <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl mb-4 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <span className="text-2xl">📋</span>
                  </div>
                  <CardTitle className="text-xl">Plan de Cuentas IFRS</CardTitle>
                  <CardDescription>
                    Estándar internacional implementado y personalizable según las necesidades de tu empresa.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Security */}
              <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 rounded-xl mb-4 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <CardTitle className="text-xl">Seguridad Empresarial</CardTitle>
                  <CardDescription>
                    Encriptación de grado bancario y cumplimiento de normativas de protección de datos.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold text-white mb-6">
              ¿Listo para transformar tu gestión contable?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Únete a las empresas que ya están tomando decisiones más inteligentes con ContaPyme
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/accounting/f29-analysis">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4"
                  onClick={() => handleIntentionClick('analyze_f29', { source: 'cta_bottom' })}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Probar Análisis F29 Gratis
                </Button>
              </Link>
              <Link href="/explore">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4"
                  onClick={() => handleIntentionClick('explore_features', { source: 'cta_secondary' })}
                >
                  Ver Todas las Funcionalidades
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Custom animations */}
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