'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface IndicatorValue {
  code: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  format_type: string;
  decimal_places: number;
  source: 'real_data' | 'smart_simulation';
  change?: number;
}

interface IndicatorsDashboard {
  monetary: IndicatorValue[];
  currency: IndicatorValue[];
  crypto: IndicatorValue[];
  labor: IndicatorValue[];
}

export default function EconomicIndicatorsBanner() {
  const [indicators, setIndicators] = useState<IndicatorsDashboard>({
    monetary: [],
    currency: [],
    crypto: [],
    labor: []
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>('hybrid_system');

  // Combinar todos los indicadores en un array para rotar
  const allIndicators = [
    ...indicators.monetary,
    ...indicators.currency,
    ...indicators.crypto,
    ...indicators.labor
  ];

  // Cargar indicadores al montar
  useEffect(() => {
    fetchIndicators();
  }, []);

  // Rotar indicadores cada 3 segundos
  useEffect(() => {
    if (allIndicators.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allIndicators.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [allIndicators.length]);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/indicators/hybrid');
      const data = await response.json();

      if (response.ok) {
        setIndicators(data.indicators);
        setDataSource(data.source);
      }
    } catch (error) {
      console.error('Error fetching indicators:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (indicator: IndicatorValue): string => {
    const { value, format_type, decimal_places, unit } = indicator;
    
    if (format_type === 'currency') {
      if (unit === 'USD') {
        return `$${value.toLocaleString('en-US', { 
          minimumFractionDigits: decimal_places || 0,
          maximumFractionDigits: decimal_places || 0
        })} USD`;
      } else {
        return `$${value.toLocaleString('es-CL', { 
          minimumFractionDigits: decimal_places || 0,
          maximumFractionDigits: decimal_places || 0
        })}`;
      }
    } else if (format_type === 'percentage') {
      return `${value.toFixed(decimal_places || 2)}%`;
    } else {
      return value.toLocaleString('es-CL', { 
        minimumFractionDigits: decimal_places || 0,
        maximumFractionDigits: decimal_places || 0
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'monetary': return 'from-blue-500 to-indigo-600';
      case 'currency': return 'from-green-500 to-emerald-600';
      case 'crypto': return 'from-orange-500 to-yellow-600';
      case 'labor': return 'from-purple-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    const baseClass = "w-8 h-8 text-white";
    
    switch (category) {
      case 'monetary':
        return (
          <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'currency':
        return (
          <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L16.414 6.7a1 1 0 00-.707-.293H7a2 2 0 00-2 2v11a2 2 0 002 2zM6 10h12M6 14h12M6 18h5" />
          </svg>
        );
      case 'crypto':
        return (
          <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'labor':
        return (
          <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl mb-8 p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span className="text-white font-medium">Cargando indicadores económicos...</span>
        </div>
      </div>
    );
  }

  if (allIndicators.length === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl shadow-xl mb-8 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.348 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Sin indicadores disponibles</h3>
              <p className="text-gray-200 text-sm">No se pudieron cargar los datos económicos</p>
            </div>
          </div>
          <Link 
            href="/accounting/indicators"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all"
          >
            Ver Detalles
          </Link>
        </div>
      </div>
    );
  }

  const currentIndicator = allIndicators[currentIndex];
  const categoryColor = getCategoryColor(currentIndicator.category);

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
          <span>📊</span>
          <span>Indicadores Económicos en Tiempo Real</span>
        </h3>
        <Link 
          href="/accounting/indicators"
          className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1 transition-colors"
        >
          <span>Ver detalle</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Running Ticker Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-green-600/20 animate-pulse"></div>
        
        {/* Main Ticker Container */}
        <div className="relative overflow-hidden py-6">
          {/* Running Indicators */}
          <div className="flex animate-scroll-left space-x-8">
            {/* Duplicamos los indicadores para efecto continuo */}
            {[...allIndicators, ...allIndicators, ...allIndicators].map((indicator, index) => (
              <div 
                key={`${indicator.code}-${index}`}
                className="flex-shrink-0 flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20 min-w-[300px] hover:bg-white/20 transition-all duration-300 cursor-pointer"
                onClick={() => window.open('/accounting/indicators', '_blank')}
              >
                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${getCategoryColor(indicator.category)} rounded-xl flex items-center justify-center shadow-lg`}>
                  {getCategoryIcon(indicator.category)}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-white font-bold text-sm">{indicator.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      indicator.source === 'real_data' 
                        ? 'bg-green-500/30 text-green-200 border border-green-400/30' 
                        : 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                    }`}>
                      {indicator.source === 'real_data' ? 'REAL' : 'SMART'}
                    </span>
                  </div>
                  
                  <div className="text-white text-xl font-black">
                    {formatValue(indicator)}
                  </div>
                  
                  <div className="text-white/60 text-xs">
                    Actualizado hoy
                  </div>
                </div>

                {/* Trend Arrow */}
                <div className="flex flex-col items-center">
                  {indicator.change !== undefined ? (
                    <div className={`flex items-center space-x-1 ${
                      indicator.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span className="text-lg">
                        {indicator.change >= 0 ? '↗' : '↘'}
                      </span>
                      <span className="text-sm font-bold">
                        {Math.abs(indicator.change).toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">•</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient Overlays for smooth edges */}
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-10"></div>
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10"></div>
        
        {/* Bottom Info Bar */}
        <div className="bg-black/30 backdrop-blur-sm px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-white/70">
            <span>🔄 Actualización automática</span>
            <span>•</span>
            <span>📅 {new Date().toLocaleDateString('es-CL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
          <div className="text-white/70">
            <span className={`inline-flex items-center space-x-1 ${
              dataSource === 'real_data' ? 'text-green-400' : 'text-blue-400'
            }`}>
              <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
              <span>
                {dataSource === 'real_data' ? 'Datos oficiales' : 'Simulación inteligente'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {allIndicators.slice(0, 4).map((indicator, index) => (
          <Link
            key={indicator.code}
            href="/accounting/indicators"
            className={`bg-gradient-to-br ${getCategoryColor(indicator.category)} p-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white text-opacity-90 text-xs font-medium truncate">
                  {indicator.name}
                </p>
                <p className="text-white font-bold text-sm">
                  {formatValue(indicator)}
                </p>
              </div>
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-md flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}