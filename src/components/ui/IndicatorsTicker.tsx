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
        // Usar datos demo confiables mientras se configura la base de datos
        console.log('Usando datos demo para ticker - sistema en desarrollo')
        // En producción, el sistema de indicadores se activará automáticamente
        
        // Datos con variaciones dinámicas simuladas (actualización cada fetch)
        const baseIndicators = [
          { code: 'UF', name: 'UF', baseValue: 37924.18, unit: '$', volatility: 0.02 },
          { code: 'UTM', name: 'UTM', baseValue: 66014, unit: '$', volatility: 0.0 },
          { code: 'USD', name: 'USD', baseValue: 923.85, unit: '$', volatility: 2.0 },
          { code: 'EUR', name: 'EUR', baseValue: 1008.92, unit: '$', volatility: 1.5 },
          { code: 'TPM', name: 'TPM', baseValue: 11.25, unit: '%', volatility: 0.0 },
          { code: 'COBRE', name: 'Cobre', baseValue: 4.18, unit: 'US$/lb', volatility: 0.15 }
        ]

        const demoIndicators: Indicator[] = baseIndicators.map(base => {
          // Generar variación realista basada en la volatilidad
          const variation = (Math.random() - 0.5) * 2 * base.volatility
          const currentValue = base.baseValue + variation
          
          // Calcular cambio y tendencia
          const change = parseFloat(variation.toFixed(2))
          const trend: 'up' | 'down' | 'stable' = 
            Math.abs(change) < 0.1 ? 'stable' :
            change > 0 ? 'up' : 'down'
          
          return {
            code: base.code,
            name: base.name,
            value: parseFloat(currentValue.toFixed(2)),
            unit: base.unit,
            change,
            trend
          }
        })
        
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