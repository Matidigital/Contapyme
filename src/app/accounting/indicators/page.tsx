'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IndicatorValue, IndicatorsDashboard } from '@/types';

export default function EconomicIndicatorsPage() {
  const [indicators, setIndicators] = useState<IndicatorsDashboard>({
    monetary: [],
    currency: [],
    crypto: [],
    labor: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  // Cargar indicadores al montar el componente
  useEffect(() => {
    fetchIndicators();
  }, []);

  const fetchIndicators = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/indicators');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar indicadores');
      }

      setIndicators(data.indicators);
      setLastUpdated(data.last_updated);
    } catch (err) {
      console.error('Error fetching indicators:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const updateIndicators = async () => {
    try {
      setUpdating(true);
      setError('');

      const response = await fetch('/api/indicators/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indicators: ['uf', 'utm', 'dolar', 'euro', 'bitcoin', 'ipc', 'tpm']
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar indicadores');
      }

      // Recargar indicadores después de actualizar
      await fetchIndicators();
      
      // Mostrar notificación de éxito
      alert(`✅ ${data.message}\n${data.results.length} indicadores actualizados correctamente`);
      
    } catch (err) {
      console.error('Error updating indicators:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setUpdating(false);
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'monetary':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'currency':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L16.414 6.7a1 1 0 00-.707-.293H7a2 2 0 00-2 2v11a2 2 0 002 2zM6 10h12M6 14h12M6 18h5" />
          </svg>
        );
      case 'crypto':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'labor':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'monetary': return 'Indicadores Monetarios';
      case 'currency': return 'Divisas';
      case 'crypto': return 'Criptomonedas';
      case 'labor': return 'Empleo y Salarios';
      default: return 'Otros Indicadores';
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

  const renderIndicatorCategory = (category: keyof IndicatorsDashboard, data: IndicatorValue[]) => {
    if (!data || data.length === 0) return null;

    return (
      <div key={category} className="mb-8">
        <div className={`bg-gradient-to-r ${getCategoryColor(category)} rounded-2xl shadow-lg overflow-hidden`}>
          <div className="px-6 py-4 text-white">
            <div className="flex items-center space-x-3">
              {getCategoryIcon(category)}
              <h3 className="text-lg font-bold">{getCategoryTitle(category)}</h3>
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                {data.length} indicadores
              </span>
            </div>
          </div>
          
          <div className="bg-white p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((indicator) => (
                <div 
                  key={indicator.code}
                  className="bg-gray-50 p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedIndicator(selectedIndicator === indicator.code ? null : indicator.code)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{indicator.name}</h4>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatValue(indicator)}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{formatDate(indicator.date)}</span>
                    {indicator.change !== undefined && (
                      <span className={indicator.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {indicator.change >= 0 ? '↗' : '↘'} {Math.abs(indicator.change).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {selectedIndicator === indicator.code && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">Código: {indicator.code}</p>
                      {indicator.unit && (
                        <p className="text-xs text-gray-600 mb-2">Unidad: {indicator.unit}</p>
                      )}
                      <button 
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Abrir modal de historial
                          alert(`Ver historial de ${indicator.name}`);
                        }}
                      >
                        Ver historial →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/accounting" className="text-gray-600 hover:text-gray-900 mr-4">
                  ← Volver a Contabilidad
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Indicadores Económicos</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando indicadores...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/accounting" className="text-gray-600 hover:text-gray-900 mr-4">
                ← Volver a Contabilidad
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Indicadores Económicos</h1>
            </div>
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  Actualizado: {formatDate(lastUpdated)}
                </span>
              )}
              <button
                onClick={updateIndicators}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center space-x-2"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Actualizar Datos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.348 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Indicadores por categoría */}
          {renderIndicatorCategory('monetary', indicators.monetary)}
          {renderIndicatorCategory('currency', indicators.currency)}
          {renderIndicatorCategory('crypto', indicators.crypto)}
          {renderIndicatorCategory('labor', indicators.labor)}

          {/* Info Footer */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 Fuentes de Datos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <strong>Indicadores Chilenos:</strong> mindicador.cl (Banco Central de Chile)
              </div>
              <div>
                <strong>Criptomonedas:</strong> CoinGecko API
              </div>
              <div>
                <strong>Actualización:</strong> Manual y automática programada
              </div>
              <div>
                <strong>Historial:</strong> Datos desde enero 2025
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}