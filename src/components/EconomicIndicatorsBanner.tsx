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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');

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

  // Auto-actualización inteligente
  useEffect(() => {
    const updateIntervals = {
      crypto: 2 * 60 * 1000,      // Crypto: cada 2 minutos (más volátil)
      currency: 5 * 60 * 1000,    // Divisas: cada 5 minutos
      monetary: 15 * 60 * 1000,   // UF/UTM: cada 15 minutos (menos volátil)
      labor: 60 * 60 * 1000       // Sueldo mínimo: cada 1 hora (muy estable)
    };

    // Actualización general cada 5 minutos
    const generalInterval = setInterval(() => {
      fetchIndicators(false); // Sin loading para actualizaciones de fondo
      console.log('🔄 Actualización automática general');
    }, 5 * 60 * 1000);

    // Actualización específica para crypto más frecuente
    const cryptoInterval = setInterval(() => {
      if (indicators.crypto.length > 0) {
        fetchIndicators(false);
        console.log('⚡ Actualización crypto automática');
      }
    }, updateIntervals.crypto);

    return () => {
      clearInterval(generalInterval);
      clearInterval(cryptoInterval);
    };
  }, [indicators.crypto.length]);

  // Rotar indicadores cada 3 segundos
  useEffect(() => {
    if (allIndicators.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % allIndicators.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [allIndicators.length]);

  const fetchIndicators = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setUpdateStatus('updating');
      
      const response = await fetch('/api/indicators/hybrid');
      const data = await response.json();

      if (response.ok) {
        setIndicators(data.indicators);
        setDataSource(data.source);
        setLastUpdate(new Date());
        setUpdateStatus('success');
        
        // Limpiar status después de 2 segundos
        setTimeout(() => setUpdateStatus('idle'), 2000);
      } else {
        setUpdateStatus('error');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error fetching indicators:', error);
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } finally {
      if (showLoading) setLoading(false);
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
      {/* Minimal Header */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500 font-medium">Indicadores Económicos</p>
      </div>

      {/* Minimal Ticker Strip */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative">        
        {/* Minimal Ticker Container */}
        <div className="relative overflow-hidden py-2">
          {/* Running Indicators - Minimal Design */}
          <div className="flex animate-scroll-left-fast space-x-8">
            {/* Duplicamos los indicadores para efecto continuo */}
            {[...allIndicators, ...allIndicators, ...allIndicators].map((indicator, index) => (
              <div 
                key={`${indicator.code}-${index}`}
                className="flex-shrink-0 flex items-center space-x-3 px-4 py-1 min-w-[200px] hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => window.open('/accounting/indicators', '_blank')}
              >
                {/* Minimal Content */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {indicator.code}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatValue(indicator)}
                  </span>
                  {indicator.change !== undefined && (
                    <span className={`text-xs ${
                      indicator.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {indicator.change >= 0 ? '↗' : '↘'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle edge fade */}
        <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
        
        {/* Minimal Status */}
        <div className="bg-gray-50 px-4 py-1 text-center">
          <span className="text-xs text-gray-400">
            Actualizado: {lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            {updateStatus === 'updating' && (
              <span className="ml-2 inline-flex items-center">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse mr-1"></div>
                actualizando
              </span>
            )}
          </span>
        </div>
      </div>

    </div>
  );
}