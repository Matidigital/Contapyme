'use client';

// ==========================================
// PÁGINA DE ANÁLISIS COMPARATIVO F29
// Versión Modernizada - Eliminadas redundancias
// ==========================================

import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { FileText, Upload, TrendingUp, AlertCircle, CheckCircle, X, BarChart3, Zap, Brain } from 'lucide-react';

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
      setFiles(prev => [...prev, ...droppedFiles].slice(0, 24)); // Máximo 24
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(
      file => file.type === 'application/pdf'
    );
    
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles].slice(0, 24)); // Máximo 24
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
      const response = await fetch('/api/f29/demo-data', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Simular resultados para mostrar en la UI
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000" />
      </div>
      
      <Header 
        title="Análisis Comparativo F29"
        subtitle="Único sistema en Chile para comparar múltiples períodos F29 automáticamente"
        showBackButton={true}
        backHref="/accounting"
        variant="premium"
        actions={
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full text-xs font-medium text-purple-800">
              <Brain className="w-3 h-3" />
              <span>Único en Chile</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('/accounting/f29-analysis', '_blank')}
              className="border-blue-200 hover:bg-blue-50 hover:border-blue-300"
            >
              <FileText className="w-4 h-4 mr-1" />
              Análisis Individual
            </Button>
          </div>
        }
      />

      <div className="relative z-10 max-w-6xl mx-auto py-8 px-4 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 rounded-full text-sm font-medium mb-6">
            <span className="mr-2">🏆</span>
            Funcionalidad Única en Chile • Hasta 24 Períodos • IA Avanzada
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Ve 2 años de tu negocio
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> en un vistazo</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sube múltiples formularios F29 y obtén insights estratégicos, tendencias estacionales y proyecciones de crecimiento automáticamente.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-100 hover:border-purple-200 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <span>Cargar Múltiples F29</span>
            </CardTitle>
            <CardDescription>
              Arrastra hasta 24 formularios F29 para generar análisis comparativo completo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-blue-50 scale-[1.02]' 
                    : 'border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Arrastra múltiples F29 aquí
                </h4>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  o selecciona archivos. Primer sistema en Chile para análisis comparativo automático.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    variant="primary"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-3"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Seleccionar Archivos F29
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    onClick={handleGenerateDemoData}
                    className="border-orange-200 hover:bg-orange-50 hover:border-orange-300 px-8 py-3"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Ver Demo con Datos Reales
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Hasta 24 archivos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Solo PDFs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Único en Chile</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">
                    {files.length} archivo{files.length !== 1 ? 's' : ''} seleccionado{files.length !== 1 ? 's' : ''}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-purple-200 hover:bg-purple-50"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Agregar Más
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-600 flex-shrink-0 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleUpload}
                    loading={uploading}
                    disabled={uploading || files.length === 0}
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Procesando con IA...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Generar Análisis Comparativo
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerateDemoData}
                    disabled={uploading}
                    className="border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Demo con Datos Reales
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Procesamiento Completado</span>
              </CardTitle>
              <CardDescription>
                {results.filter(r => r.success).length} de {results.length} archivos procesados exitosamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      result.success 
                        ? 'bg-green-50 border-green-400' 
                        : 'bg-red-50 border-red-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.file_name}
                        </p>
                        {result.success ? (
                          <p className="text-xs text-green-600">
                            {result.period ? formatPeriod(result.period) : 'Procesado'} 
                            {result.confidence_score && ` • ${result.confidence_score}%`}
                          </p>
                        ) : (
                          <p className="text-xs text-red-600">{result.error}</p>
                        )}
                      </div>
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && (
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span>Análisis Comparativo Completo</span>
              </CardTitle>
              <CardDescription>
                {analysis.periodos_analizados} períodos analizados • {analysis.rango_temporal.inicio.substring(0,4)} - {analysis.rango_temporal.fin.substring(0,4)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Métricas Principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">Ventas Totales</h4>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatCurrency(analysis.metricas_clave.total_ventas)}
                  </p>
                  <p className="text-sm text-blue-600">Promedio mensual: {formatCurrency(analysis.metricas_clave.promedio_mensual)}</p>
                </div>

                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h4 className="text-sm font-medium text-green-700 mb-2">Crecimiento</h4>
                  <p className="text-3xl font-bold text-green-900">
                    +{analysis.metricas_clave.crecimiento_periodo}%
                  </p>
                  <p className="text-sm text-green-600">Durante el período analizado</p>
                </div>

                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <h4 className="text-sm font-medium text-purple-700 mb-2">Mejor Mes</h4>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatPeriod(analysis.metricas_clave.mejor_mes.period)}
                  </p>
                  <p className="text-sm text-purple-600">
                    {formatCurrency(analysis.metricas_clave.mejor_mes.ventas)}
                  </p>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Insights Estratégicos</h3>
                <div className="space-y-3">
                  {analysis.insights_iniciales.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="primary"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={() => window.open('/accounting/f29-analysis', '_blank')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Análisis Individual
                </Button>
                <Button 
                  variant="outline"
                  className="border-green-200 hover:bg-green-50 hover:border-green-300"
                  onClick={() => window.location.href = '/accounting'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Volver a Contabilidad
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
  );
}