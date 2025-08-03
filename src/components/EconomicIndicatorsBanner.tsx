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
      {/* Main Banner - Rotating Indicators */}
      <div className={`bg-gradient-to-r ${categoryColor} rounded-2xl shadow-xl overflow-hidden`}>
        <div className="relative p-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white transform translate-x-16 -translate-y-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white transform -translate-x-12 translate-y-8"></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            {/* Indicator Content */}
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center transform transition-all duration-500 hover:scale-110">
                {getCategoryIcon(currentIndicator.category)}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-white font-bold text-2xl transition-all duration-500">
                    {currentIndicator.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${ 
                    currentIndicator.source === 'real_data' 
                      ? 'bg-green-400 bg-opacity-20 text-green-100' 
                      : 'bg-blue-400 bg-opacity-20 text-blue-100'
                  }`}>
                    {currentIndicator.source === 'real_data' ? '🔄 Datos reales' : '🧠 Smart data'}
                  </span>
                </div>
                
                <div className="text-white text-4xl font-black tracking-tight transition-all duration-500">
                  {formatValue(currentIndicator)}
                </div>
                
                <div className="flex items-center space-x-4 text-white text-opacity-80 text-sm">
                  <span>Hoy, {new Date().toLocaleDateString('es-CL')}</span>
                  {currentIndicator.change !== undefined && (
                    <span className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                      currentIndicator.change >= 0 
                        ? 'bg-green-400 bg-opacity-20 text-green-100' 
                        : 'bg-red-400 bg-opacity-20 text-red-100'
                    }`}>
                      <span>{currentIndicator.change >= 0 ? '↗' : '↘'}</span>
                      <span>{Math.abs(currentIndicator.change).toFixed(2)}%</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <Link 
                href="/accounting/indicators"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 text-center whitespace-nowrap"
              >
                📊 Ver Todos
              </Link>
              <button 
                onClick={() => setCurrentIndex((prev) => (prev + 1) % allIndicators.length)}
                className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 text-center text-sm"
              >
                ⏭️ Siguiente
              </button>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {allIndicators.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white bg-opacity-40 hover:bg-opacity-60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {allIndicators.slice(0, 4).map((indicator, index) => (
          <div 
            key={indicator.code}
            className={`bg-gradient-to-br ${getCategoryColor(indicator.category)} p-4 rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
              index === currentIndex ? 'ring-2 ring-white ring-opacity-50 transform scale-105' : ''
            }`}
            onClick={() => setCurrentIndex(allIndicators.findIndex(ind => ind.code === indicator.code))}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-opacity-80 text-xs font-medium uppercase tracking-wide">
                  {indicator.name.length > 15 ? indicator.name.substring(0, 15) + '...' : indicator.name}
                </p>
                <p className="text-white font-bold text-lg">
                  {formatValue(indicator)}
                </p>
              </div>
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                {getCategoryIcon(indicator.category)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}