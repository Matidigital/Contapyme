'use client';

// ==========================================
// PÁGINA DE ANÁLISIS COMPARATIVO F29
// Upload múltiple + Dashboard temporal
// ==========================================

import { useState, useCallback, useRef } from 'react';
import { FileText, Upload, TrendingUp, AlertCircle, CheckCircle, X, BarChart3 } from 'lucide-react';

interface UploadResult {
  file_name: string;
  success: boolean;
  period?: string;
  confidence_score?: number;
  error?: string;
}

interface AnalysisData {
  periodos_analizados: number;
  rango_temporal: {
    inicio: string;
    fin: string;
  };
  validacion_anual?: {
    tiene_año_completo: boolean;
    año_analizado: string | null;
    meses_presentes: number[];
    rut_validado: string;
  };
  metricas_anuales?: {
    total_ventas_anual: number;
    total_compras_netas_anual: number;
    margen_bruto_anual_porcentaje: number;
    margen_bruto_anual_monto: number;
  };
  metricas_clave: {
    total_ventas: number;
    promedio_mensual: number;
    promedio_compras_mensual?: number;
    crecimiento_periodo: number;
    mejor_mes: { period: string; ventas: number };
    peor_mes: { period: string; ventas: number };
  };
  insights_iniciales: string[];
  error?: string;
  ruts_encontrados?: string[];
}

export default function F29ComparativePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [results, setResults] = useState<UploadResult[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Datos de prueba para demo
  const demoCompanyId = '550e8400-e29b-41d4-a716-446655440001';
  const demoUserId = '550e8400-e29b-41d4-a716-446655440000';

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );
    
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(
      file => file.type === 'application/pdf'
    );
    
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setResults([]);
    setAnalysis(null);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('f29_files', file));
      formData.append('company_id', demoCompanyId);
      formData.append('user_id', demoUserId);

      console.log('🚀 Iniciando upload de', files.length, 'archivos...');

      const response = await fetch('/api/f29/batch-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results || []);
        setAnalysis(data.analysis || null);
        console.log('✅ Upload completado:', data.summary);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }

    } catch (error) {
      console.error('❌ Error en upload:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateDemoData = async () => {
    setUploading(true);
    setResults([]);
    setAnalysis(null);

    try {
      console.log('🎭 Generando datos de demostración...');

      const response = await fetch('/api/f29/demo-data', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Datos demo generados:', data.summary);
        
        // Simular resultados de upload para mostrar en la UI
        const demoResults = Array.from({ length: 12 }, (_, i) => ({
          file_name: `F29_${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i]}_2024.pdf`,
          success: true,
          period: `2024${(i + 1).toString().padStart(2, '0')}`,
          confidence_score: 85 + Math.round(Math.random() * 15)
        }));

        setResults(demoResults);

        // Generar análisis de demostración
        const demoAnalysis = {
          periodos_analizados: 12,
          rango_temporal: {
            inicio: '202401',
            fin: '202412'
          },
          metricas_clave: {
            total_ventas: 235000000,
            promedio_mensual: 19583333,
            crecimiento_periodo: 24.5,
            mejor_mes: { period: '202412', ventas: 26500000 },
            peor_mes: { period: '202401', ventas: 15010000 }
          },
          insights_iniciales: [
            '📈 Crecimiento sostenido del 24.5% durante 2024',
            '🎄 Diciembre es tu mejor mes con $26.5M en ventas (+76% vs enero)',
            '📊 Tendencia estacional clara: Q4 supera Q1 por 45%',
            '💰 Margen bruto promedio saludable del 28%',
            '🎯 Proyección 2025: $31M en ventas si mantiene tendencia'
          ]
        };

        setAnalysis(demoAnalysis);

        alert('🎉 ¡Datos de demostración generados! Ahora puedes ver el análisis comparativo completo.');
      } else {
        throw new Error(data.error || 'Error generando datos demo');
      }

    } catch (error) {
      console.error('❌ Error generando datos demo:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPeriod = (period: string) => {
    if (period.length !== 6) return period;
    const year = period.substring(0, 4);
    const month = period.substring(4, 6);
    const monthNames = [
      '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[parseInt(month)]} ${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Análisis Comparativo F29
          </h1>
          <p className="text-gray-600">
            Sube múltiples formularios F29 y obtén insights automáticos de tu evolución temporal
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Upload */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Upload Múltiple de F29
              </h2>

              {/* Drag & Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Arrastra tus formularios F29 aquí
                </p>
                <p className="text-gray-500 mb-4">
                  O haz clic para seleccionar archivos PDF
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  disabled={uploading}
                >
                  Seleccionar Archivos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Lista de archivos */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Archivos seleccionados ({files.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                      >
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm text-gray-900">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({Math.round(file.size / 1024)}KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={uploading || files.length === 0}
                    className="w-full mt-4 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 font-medium"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Procesando {files.length} archivos...
                      </span>
                    ) : (
                      `🚀 Procesar ${files.length} formularios F29`
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Resultados del Upload */}
            {results.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📋 Resultados del Procesamiento
                </h3>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-md ${
                        result.success ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'
                      }`}
                    >
                      <div className="flex items-center">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {result.file_name}
                          </p>
                          {result.success ? (
                            <p className="text-xs text-green-600">
                              {result.period ? formatPeriod(result.period) : 'Procesado'} 
                              {result.confidence_score && ` • Confianza: ${result.confidence_score}%`}
                            </p>
                          ) : (
                            <p className="text-xs text-red-600">{result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel de Análisis */}
          <div className="space-y-6">
            {analysis && !analysis.error ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Análisis Comparativo
                </h2>

                {/* Validación Anual */}
                {analysis.validacion_anual && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">🔍 Validación Anual</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-blue-700">
                        <span className="font-medium">RUT:</span> {analysis.validacion_anual.rut_validado}
                      </p>
                      {analysis.validacion_anual.tiene_año_completo ? (
                        <p className="text-green-700 font-medium">
                          ✅ Año {analysis.validacion_anual.año_analizado} completo (12 meses)
                        </p>
                      ) : (
                        <p className="text-orange-700">
                          ⚠️ No se encontró un año completo con 12 meses
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Métricas Anuales */}
                {analysis.metricas_anuales && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 font-medium">Ventas Netas Totales</p>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(analysis.metricas_anuales.total_ventas_anual)}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600 font-medium">Compras Netas Totales</p>
                      <p className="text-xl font-bold text-blue-900">
                        {formatCurrency(analysis.metricas_anuales.total_compras_netas_anual)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-600 font-medium">Margen Bruto Anual</p>
                      <p className="text-xl font-bold text-purple-900">
                        {analysis.metricas_anuales.margen_bruto_anual_porcentaje.toFixed(1)}%
                      </p>
                      <p className="text-sm text-purple-700">
                        {formatCurrency(analysis.metricas_anuales.margen_bruto_anual_monto)}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-600 font-medium">Períodos Analizados</p>
                      <p className="text-xl font-bold text-orange-900">{analysis.periodos_analizados}</p>
                    </div>
                  </div>
                )}

                {/* Métricas Mensuales */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium">Promedio Ventas Mensual</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(analysis.metricas_clave.promedio_mensual)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium">Promedio Compras Mensual</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(analysis.metricas_clave.promedio_compras_mensual || 0)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium">Mejor Mes</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatPeriod(analysis.metricas_clave.mejor_mes.period)}
                    </p>
                    <p className="text-xs text-gray-700">
                      {formatCurrency(analysis.metricas_clave.mejor_mes.ventas)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium">Crecimiento</p>
                    <p className="text-lg font-bold text-gray-900">
                      {analysis.metricas_clave.crecimiento_periodo > 0 ? '+' : ''}
                      {analysis.metricas_clave.crecimiento_periodo.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Rango Temporal */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">📅 Período Analizado</h4>
                  <p className="text-sm text-gray-600">
                    Desde {formatPeriod(analysis.rango_temporal.inicio)} hasta {formatPeriod(analysis.rango_temporal.fin)}
                  </p>
                </div>

                {/* Insights Automáticos */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">🧠 Insights Automáticos</h4>
                  <div className="space-y-2">
                    {analysis.insights_iniciales.map((insight, index) => (
                      <div key={index} className="flex items-start">
                        <TrendingUp className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call to Action */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 mb-2">
                    🎯 <strong>¡Excelente!</strong> Ya tienes datos suficientes para análisis comparativo.
                  </p>
                  <p className="text-xs text-blue-600">
                    Sube más formularios F29 para obtener insights aún más precisos y proyecciones avanzadas.
                  </p>
                </div>
              </div>
            ) : analysis?.error ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                  Error en Análisis
                </h2>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-800 font-medium mb-2">{analysis.error}</p>
                  {analysis.ruts_encontrados && (
                    <div className="mt-2">
                      <p className="text-sm text-red-700">RUTs encontrados:</p>
                      <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                        {analysis.ruts_encontrados.map((rut, idx) => (
                          <li key={idx}>{rut}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Asegúrate de subir formularios F29 del mismo contribuyente.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Análisis Comparativo
                </h2>
                <div className="text-center py-12">
                  <TrendingUp className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Sube múltiples F29 para análisis
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Necesitas al menos 3 formularios F29 de diferentes períodos para generar un análisis comparativo
                  </p>
                </div>
              </div>
            )}

            {/* Tips de Uso */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Tips de Uso</h3>
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Sube F29 de al menos 6 meses para análisis de tendencias</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Incluye formularios de diferentes estaciones para detectar patrones</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>PDFs de alta calidad dan mejores resultados de análisis</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>El sistema detecta automáticamente períodos y valida datos</span>
                </div>
              </div>

              {/* Demo Data Button */}
              <div className="border-t pt-4">
                <button
                  onClick={handleGenerateDemoData}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center space-x-2"
                  disabled={uploading}
                >
                  <span>🎭</span>
                  <span>Generar Datos de Demostración</span>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Crea 12 meses de datos F29 de ejemplo para probar el análisis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}