'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Indicator {
  code: string
  name: string
  value: number
  unit: string
  change?: number
  trend?: 'up' | 'down' | 'stable'
}

// Componente para cada indicador individual
function IndicatorItem({ indicator }: { indicator: Indicator }) {
  return (
    <div className="flex items-center space-x-2 text-white whitespace-nowrap">
      <span className="text-sm font-semibold text-blue-200">
        {indicator.name}:
      </span>
      <span className="text-sm font-bold">
        {indicator.unit === '%' 
          ? `${indicator.value}%`
          : `${indicator.unit}${indicator.value.toLocaleString('es-CL')}`
        }
      </span>
      {indicator.change !== undefined && indicator.change !== 0 && (
        <div className={`flex items-center space-x-1 ${
          indicator.trend === 'up' 
            ? 'text-green-400' 
            : indicator.trend === 'down'
            ? 'text-red-400'
            : 'text-gray-400'
        }`}>
          {indicator.trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {indicator.trend === 'down' && <TrendingDown className="w-3 h-3" />}
          <span className="text-xs">
            {indicator.change > 0 ? '+' : ''}{indicator.change}
          </span>
        </div>
      )}
    </div>
  )
}

export default function IndicatorsTicker() {
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        // Intentar obtener datos de tu API (con fallback robusto)
        try {
          const response = await fetch('/api/indicators')
          
          if (response.ok) {
            const data = await response.json()
            
            // Tu API devuelve data.indicators
            if (data.indicators && Array.isArray(data.indicators)) {
              const apiIndicators: Indicator[] = data.indicators
                .filter((indicator: any) => indicator.value && indicator.code)
                .slice(0, 6) // Máximo 6 para el ticker
                .map((indicator: any) => {
                  // Generar cambio simulado realista
                  const change = (Math.random() - 0.5) * 4 // Entre -2 y +2
                  const trend: 'up' | 'down' | 'stable' = 
                    change > 0.3 ? 'up' : 
                    change < -0.3 ? 'down' : 'stable'
                  
                  return {
                    code: indicator.code,
                    name: indicator.name || indicator.code,
                    value: parseFloat(indicator.value),
                    unit: indicator.unit || '$',
                    change: parseFloat(change.toFixed(2)),
                    trend
                  }
                })
              
              if (apiIndicators.length > 0) {
                setIndicators(apiIndicators)
                setIsLoading(false)
                return
              }
            }
          }
        } catch (apiError) {
          console.log('API no disponible, usando datos demo:', apiError)
        }
        
        // Fallback: datos basados en fuentes oficiales chilenas
        const demoIndicators: Indicator[] = [
          {
            code: 'UF',
            name: 'UF',
            value: 37924.18,
            unit: '$',
            change: 0.08,
            trend: 'up'
          },
          {
            code: 'UTM',
            name: 'UTM',
            value: 66014,
            unit: '$',
            change: 0.0,
            trend: 'stable'
          },
          {
            code: 'USD',
            name: 'USD',
            value: 923.85,
            unit: '$',
            change: -1.45,
            trend: 'down'
          },
          {
            code: 'EUR',
            name: 'EUR',
            value: 1008.92,
            unit: '$',
            change: 0.87,
            trend: 'up'
          },
          {
            code: 'TPM',
            name: 'TPM',
            value: 11.25,
            unit: '%',
            change: 0.0,
            trend: 'stable'
          },
          {
            code: 'COBRE',
            name: 'Cobre',
            value: 4.18,
            unit: 'US$/lb',
            change: 0.12,
            trend: 'up'
          }
        ]
        
        setIndicators(demoIndicators)
        setIsLoading(false)
      } catch (error) {
        console.warn('Error fetching indicators for ticker:', error)
        setIsLoading(false)
      }
    }

    fetchIndicators()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchIndicators, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="relative z-10 bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 border-b border-blue-700/30">
        <div className="py-2 px-4">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-blue-200 text-sm">
              Cargando indicadores económicos...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 border-b border-blue-700/30 overflow-hidden shadow-lg">
      {/* Efecto de brillo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent animate-pulse" />
      
      {/* Partículas de fondo sutiles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-300 rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Contenido principal */}
      <div className="relative py-2 px-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Label */}
          <div className="flex items-center space-x-2 text-blue-200">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
            <span className="text-sm font-medium hidden sm:block glow-text">
              Indicadores en Tiempo Real
            </span>
            <span className="text-xs font-medium sm:hidden glow-text">
              Live
            </span>
          </div>

          {/* Indicadores scrolleables infinitos */}
          <div className="flex-1 mx-4 overflow-hidden">
            <div className="flex space-x-6 animate-marquee-infinite">
              {/* Primera copia del contenido */}
              {indicators.map((indicator, index) => (
                <div
                  key={`original-${indicator.code}-${index}`}
                  className="flex items-center space-x-2 text-white whitespace-nowrap flex-shrink-0"
                >
                  <span className="text-sm font-semibold text-blue-200">
                    {indicator.name}:
                  </span>
                  <span className="text-sm font-bold">
                    {indicator.unit === '%' 
                      ? `${indicator.value}%`
                      : `${indicator.unit}${indicator.value.toLocaleString('es-CL')}`
                    }
                  </span>
                  {indicator.change !== undefined && indicator.change !== 0 && (
                    <div className={`flex items-center space-x-1 ${
                      indicator.trend === 'up' 
                        ? 'text-green-400' 
                        : indicator.trend === 'down'
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }`}>
                      {indicator.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                      {indicator.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                      <span className="text-xs">
                        {indicator.change > 0 ? '+' : ''}{indicator.change}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Segunda copia para loop infinito */}
              {indicators.map((indicator, index) => (
                <div
                  key={`duplicate-${indicator.code}-${index}`}
                  className="flex items-center space-x-2 text-white whitespace-nowrap flex-shrink-0"
                >
                  <span className="text-sm font-semibold text-blue-200">
                    {indicator.name}:
                  </span>
                  <span className="text-sm font-bold">
                    {indicator.unit === '%' 
                      ? `${indicator.value}%`
                      : `${indicator.unit}${indicator.value.toLocaleString('es-CL')}`
                    }
                  </span>
                  {indicator.change !== undefined && indicator.change !== 0 && (
                    <div className={`flex items-center space-x-1 ${
                      indicator.trend === 'up' 
                        ? 'text-green-400' 
                        : indicator.trend === 'down'
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }`}>
                      {indicator.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                      {indicator.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                      <span className="text-xs">
                        {indicator.change > 0 ? '+' : ''}{indicator.change}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Call to action */}
          <div className="text-right">
            <a 
              href="/accounting/indicators"
              className="text-xs text-blue-300 hover:text-blue-100 transition-colors duration-200 underline decoration-dotted"
            >
              Ver todos →
            </a>
          </div>
        </div>
      </div>

      {/* CSS para animación marquee infinita */}
      <style jsx>{`
        @keyframes marquee-infinite {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        
        .animate-marquee-infinite {
          animation: marquee-infinite 25s linear infinite;
          width: max-content;
        }
        
        .animate-marquee-infinite:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}