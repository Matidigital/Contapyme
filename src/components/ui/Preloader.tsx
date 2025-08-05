'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface PreloaderProps {
  onComplete: () => void
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<'loading' | 'celebration' | 'brandReveal' | 'finalMessage' | 'complete'>('loading')

  useEffect(() => {
    // Simulación de carga con progreso realista
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          // Secuencia extendida de finalización
          setStage('celebration')
          
          setTimeout(() => {
            setStage('brandReveal')
          }, 1500) // Celebración por 1.5s
          
          setTimeout(() => {
            setStage('finalMessage')
          }, 3500) // Brand reveal por 2s
          
          setTimeout(() => {
            setStage('complete')
            setTimeout(onComplete, 1000) // Mensaje final por 2s + transición
          }, 6000)
          
          return 100
        }
        // Progreso más rápido al inicio, más lento al final (realista)
        const increment = prev < 60 ? Math.random() * 15 + 10 : Math.random() * 5 + 2
        return Math.min(prev + increment, 100)
      })
    }, 150)

    return () => clearInterval(interval)
  }, [onComplete])

  if (stage === 'complete') return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 overflow-hidden">
      {/* Enhanced Particles Background */}
      <div className="absolute inset-0">
        {[...Array(stage === 'celebration' ? 50 : 20)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${
              stage === 'celebration' 
                ? 'w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 animate-bounce' 
                : 'w-1 h-1 bg-blue-400 animate-pulse'
            } opacity-60`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${stage === 'celebration' ? 0.5 + Math.random() * 1 : 2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Logo Container */}
        <div 
          className={`relative mb-8 transition-all duration-1000 ${
            stage === 'loading' 
              ? 'scale-90 opacity-60' 
              : stage === 'celebration'
              ? 'scale-125 opacity-100 animate-bounce'
              : stage === 'brandReveal'
              ? 'scale-150 opacity-100'
              : 'scale-110 opacity-100'
          }`}
        >
          {/* Enhanced Glow Effect */}
          <div className={`absolute inset-0 rounded-full blur-2xl scale-150 ${
            stage === 'celebration' 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 opacity-60 animate-pulse' 
              : stage === 'brandReveal'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 opacity-50'
              : 'bg-blue-500 opacity-30 animate-pulse'
          }`} />
          
          {/* Logo */}
          <div className={`relative w-32 h-32 mx-auto bg-white rounded-2xl p-6 shadow-2xl transition-all duration-1000 ${
            stage === 'brandReveal' ? 'shadow-blue-500/50 shadow-2xl' : ''
          }`}>
            <Image
              src="/images/logo.webp"
              alt="ContaPymePuq Logo"
              fill
              className="object-contain p-2"
              priority
            />
          </div>

          {/* Enhanced Premium Badge */}
          <div className={`absolute -top-2 -right-2 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg transition-all duration-500 ${
            stage === 'celebration' 
              ? 'bg-gradient-to-r from-yellow-300 to-orange-400 animate-pulse scale-110' 
              : stage === 'brandReveal'
              ? 'bg-gradient-to-r from-purple-400 to-blue-500 text-white scale-125'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500 animate-bounce'
          }`}>
            {stage === 'brandReveal' ? 'ENTERPRISE' : 'PRO'}
          </div>
        </div>

        {/* Dynamic Brand Text */}
        <div 
          className={`transition-all duration-1000 ${
            stage === 'loading' 
              ? 'translate-y-4 opacity-0' 
              : stage === 'celebration'
              ? 'translate-y-0 opacity-100 scale-110'
              : stage === 'brandReveal'
              ? 'translate-y-0 opacity-100 scale-125'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <h1 className={`font-bold mb-2 tracking-tight transition-all duration-1000 ${
            stage === 'brandReveal' 
              ? 'text-5xl md:text-6xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' 
              : 'text-4xl md:text-5xl text-white'
          }`}>
            ContaPyme
          </h1>
          <p className={`font-medium mb-8 transition-all duration-1000 ${
            stage === 'brandReveal' 
              ? 'text-2xl text-blue-200' 
              : 'text-xl text-blue-200'
          }`}>
            {stage === 'brandReveal' ? 'Plataforma Empresarial de Clase Mundial' : 'Soluciones Contables Empresariales'}
          </p>
        </div>

        {/* Enhanced Slogan Section */}
        <div 
          className={`mb-8 h-16 flex items-center justify-center transition-all duration-1000 ${
            stage === 'loading' 
              ? 'translate-y-4 opacity-0' 
              : 'translate-y-0 opacity-100'
          }`}
        >
          <div className={`text-center font-medium transition-all duration-1000 ${
            stage === 'celebration' 
              ? 'text-2xl text-yellow-300 animate-pulse' 
              : stage === 'brandReveal'
              ? 'text-xl text-purple-200'
              : stage === 'finalMessage'
              ? 'text-2xl text-green-300'
              : 'text-lg text-gray-300'
          }`}>
            {stage === 'loading' && (
              <>
                {progress < 30 && "🚀 Potenciando tu crecimiento empresarial"}
                {progress >= 30 && progress < 60 && "📊 Decisiones inteligentes con datos reales"}
                {progress >= 60 && progress < 90 && "⚡ Automatización que transforma tu negocio"}
                {progress >= 90 && "🎯 Listo para impulsar tu éxito"}
              </>
            )}
            {stage === 'celebration' && "🎉 ¡Sistema Cargado Exitosamente!"}
            {stage === 'brandReveal' && "La Evolución de la Contabilidad Empresarial"}
            {stage === 'finalMessage' && "✨ Bienvenido al Futuro de tu Empresa"}
          </div>
        </div>

        {/* Progress Bar - Solo durante loading */}
        {stage === 'loading' && (
          <div className="w-80 mx-auto transition-all duration-1000 delay-700 translate-y-0 opacity-100">
            <div className="relative">
              {/* Background */}
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                {/* Progress Fill */}
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
                </div>
              </div>
              
              {/* Progress Text */}
              <div className="mt-3 flex justify-between text-sm text-gray-400">
                <span>Iniciando sistema...</span>
                <span className="font-mono">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        <div 
          className={`mt-6 text-sm transition-all duration-500 ${
            stage === 'loading' 
              ? 'opacity-100 text-gray-500' 
              : stage === 'celebration'
              ? 'opacity-100 text-yellow-300'
              : stage === 'brandReveal'
              ? 'opacity-100 text-purple-300'
              : stage === 'finalMessage'
              ? 'opacity-100 text-green-300'
              : 'opacity-0'
          }`}
        >
          {stage === 'loading' && (
            <>
              {progress < 25 && "Cargando módulos contables..."}
              {progress >= 25 && progress < 50 && "Configurando análisis F29..."}
              {progress >= 50 && progress < 75 && "Sincronizando indicadores económicos..."}
              {progress >= 75 && progress < 95 && "Optimizando rendimiento..."}
              {progress >= 95 && "¡Casi listo!"}
            </>
          )}
          {stage === 'celebration' && "🎊 Todos los sistemas operativos • Rendimiento optimizado"}
          {stage === 'brandReveal' && "🏆 Tecnología de vanguardia • Seguridad empresarial"}
          {stage === 'finalMessage' && "🚀 Preparado para transformar tu gestión contable"}
        </div>

        {/* Success Indicators - Solo en celebration y después */}
        {(stage === 'celebration' || stage === 'brandReveal' || stage === 'finalMessage') && (
          <div className="mt-8 flex justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-300">Seguro</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-300">Rápido</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-purple-300">Confiable</span>
            </div>
          </div>
        )}
      </div>

      {/* Full Screen Flash Effects */}
      {stage === 'celebration' && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse opacity-10" />
      )}
      
      {stage === 'brandReveal' && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse opacity-10" />
      )}

      {stage === 'finalMessage' && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 animate-pulse opacity-5" />
      )}

      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}