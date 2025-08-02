'use client';

import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { FileText, Upload, AlertCircle, CheckCircle, X, TrendingUp, Download, BarChart3, Eye } from 'lucide-react';

interface UploadResult {
  file_name: string;
  success: boolean;
  period?: string;
  confidence_score?: number;
  error?: string;
  data?: any;
}

interface F29Results {
  rut: string;
  periodo: string;
  codigo538: number; // Débito Fiscal
  codigo511: number; // Crédito Fiscal
  codigo062: number; // PPM
  codigo077: number; // Remanente
  codigo563: number; // Ventas Netas
  codigo151: number; // Honorarios Retenidos
  comprasNetas: number;
  ivaDeterminado: number;
  totalAPagar: number;
  margenBruto: number;
  confidence: number;
  method: string;
}

export default function F29AnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<F29Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
      setResult(null); // Limpiar resultados anteriores
      setShowDetailedAnalysis(false); // Cerrar análisis detallado
    } else {
      setError('Por favor, selecciona un archivo PDF válido');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setResult(null); // Limpiar resultados anteriores
      setShowDetailedAnalysis(false); // Cerrar análisis detallado
    } else {
      setError('Por favor, selecciona un archivo PDF válido');
    }
    // Limpiar el valor del input para permitir reseleccionar el mismo archivo
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setShowDetailedAnalysis(false);
    // Limpiar el input de archivo para permitir seleccionar el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalysis = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('🚀 Iniciando análisis de F29:', file.name);

      const response = await fetch('/api/test-f29', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('📊 Respuesta de API:', data);

      if (data.success && data.data) {
        setResult(data.data);
        console.log('✅ Datos extraídos:', data.data);
      } else {
        setError(data.error || 'Error al procesar el archivo');
        console.error('❌ Error en análisis:', data.error);
      }
    } catch (err) {
      console.error('Error en análisis F29:', err);
      setError('Error de conexión. Inténtalo nuevamente.');
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return 'Alta Confianza';
    if (confidence >= 70) return 'Confianza Media';
    return 'Baja Confianza';
  };

  // Función para exportar resultados a CSV
  const handleExportResults = () => {
    if (!result) return;

    const csvData = [
      ['Campo', 'Valor', 'Código'],
      ['RUT', result.rut, ''],
      ['Período', result.periodo, ''],
      ['Ventas Netas', result.codigo563.toString(), '563'],
      ['Débito Fiscal', result.codigo538.toString(), '538'],
      ['Crédito Fiscal', result.codigo511.toString(), '511'],
      ['PPM', result.codigo062.toString(), '062'],
      ['Remanente', result.codigo077.toString(), '077'],
      ...(result.codigo151 > 0 ? [['Honorarios Retenidos', result.codigo151.toString(), '151']] : []),
      ['Compras Netas (Calculado)', result.comprasNetas.toString(), 'Calc'],
      ['IVA Determinado', result.ivaDeterminado.toString(), 'Calc'],
      ['Margen Bruto', result.margenBruto.toString(), 'Calc'],
      ['Total a Pagar', result.totalAPagar.toString(), 'Calc'],
      ['Confianza (%)', result.confidence.toString(), ''],
      ['Método', result.method, '']
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `F29_${result.periodo}_${result.rut.replace(/\./g, '').replace('-', '')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Función para mostrar/ocultar análisis detallado
  const toggleDetailedAnalysis = () => {
    setShowDetailedAnalysis(!showDetailedAnalysis);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Análisis F29 Individual"
        subtitle="Analiza un formulario F29 y obtén métricas detalladas"
        showBackButton={true}
        backHref="/accounting"
        actions={
          <Button variant="outline" size="sm" onClick={() => window.open('/accounting/f29-comparative', '_blank')}>
            📊 Análisis Comparativo
          </Button>
        }
      />

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Cargar Formulario F29</span>
            </CardTitle>
            <CardDescription>
              Sube un archivo PDF de tu formulario F29 para análisis automático
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Arrastra tu F29 aquí
                </h4>
                <p className="text-gray-600 mb-4">
                  o haz clic para seleccionar archivo
                </p>
                <Button 
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar Archivo PDF
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Solo archivos PDF • Máximo 10MB
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <Button
                    variant="primary"
                    onClick={handleAnalysis}
                    loading={uploading}
                    disabled={uploading}
                    fullWidth
                  >
                    {uploading ? 'Analizando...' : 'Iniciar Análisis'}
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Análisis Completado</span>
                </div>
                <span className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                  {getConfidenceLabel(result.confidence)} ({result.confidence}%)
                </span>
              </CardTitle>
              <CardDescription>
                Período: {result.periodo} • RUT: {result.rut} • Método: {result.method}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Ventas */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Ventas Netas</h4>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(result.codigo563)}
                  </p>
                  <p className="text-xs text-blue-600">Código 563</p>
                </div>

                {/* Compras */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="text-sm font-medium text-green-700 mb-1">Compras Netas</h4>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(result.comprasNetas)}
                  </p>
                  <p className="text-xs text-green-600">Calculado automáticamente</p>
                </div>

                {/* IVA */}
                <div className={`rounded-lg p-4 border ${
                  result.ivaDeterminado < 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`text-sm font-medium mb-1 ${
                    result.ivaDeterminado < 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    IVA Determinado
                  </h4>
                  <p className={`text-2xl font-bold ${
                    result.ivaDeterminado < 0 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {formatCurrency(result.ivaDeterminado)}
                  </p>
                  <p className={`text-xs ${
                    result.ivaDeterminado < 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.ivaDeterminado < 0 ? 'A favor del contribuyente' : 'A pagar'}
                  </p>
                </div>

                {/* Débito Fiscal */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="text-sm font-medium text-purple-700 mb-1">Débito Fiscal</h4>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(result.codigo538)}
                  </p>
                  <p className="text-xs text-purple-600">Código 538</p>
                </div>

                {/* Crédito Fiscal */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h4 className="text-sm font-medium text-orange-700 mb-1">Crédito Fiscal</h4>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(result.codigo511)}
                  </p>
                  <p className="text-xs text-orange-600">Código 511</p>
                </div>

                {/* PPM */}
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <h4 className="text-sm font-medium text-indigo-700 mb-1">PPM</h4>
                  <p className="text-2xl font-bold text-indigo-900">
                    {formatCurrency(result.codigo062)}
                  </p>
                  <p className="text-xs text-indigo-600">Código 062</p>
                </div>

                {/* Remanente */}
                <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                  <h4 className="text-sm font-medium text-teal-700 mb-1">Remanente Crédito</h4>
                  <p className="text-2xl font-bold text-teal-900">
                    {formatCurrency(result.codigo077)}
                  </p>
                  <p className="text-xs text-teal-600">Código 077</p>
                </div>

                {/* Honorarios Retenidos - Solo mostrar si existe */}
                {result.codigo151 > 0 && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="text-sm font-medium text-amber-700 mb-1">Honorarios Retenidos</h4>
                    <p className="text-2xl font-bold text-amber-900">
                      {formatCurrency(result.codigo151)}
                    </p>
                    <p className="text-xs text-amber-600">Código 151</p>
                  </div>
                )}

                {/* Total a Pagar */}
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Total a Pagar</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(result.totalAPagar)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {result.ivaDeterminado > 0 
                      ? `IVA + PPM${result.codigo151 > 0 ? ' + Honorarios' : ''}`
                      : `Solo PPM${result.codigo151 > 0 ? ' + Honorarios' : ''} (IVA negativo)`}
                  </p>
                </div>
              </div>

              {/* Sección de Margen Bruto */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Análisis de Margen</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Ventas Netas</p>
                    <p className="text-xl font-bold text-blue-900">{formatCurrency(result.codigo563)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">(-) Compras Netas</p>
                    <p className="text-xl font-bold text-red-900">{formatCurrency(result.comprasNetas)}</p>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-1">(=) Margen Bruto</p>
                    <p className="text-xl font-bold text-green-900">{formatCurrency(result.margenBruto)}</p>
                    <p className="text-xs text-gray-500">
                      {result.codigo563 > 0 ? `${((result.margenBruto / result.codigo563) * 100).toFixed(1)}% de las ventas` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportResults}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar Resultados
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleDetailedAnalysis}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {showDetailedAnalysis ? 'Ocultar Detalle' : 'Ver Análisis Detallado'}
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => window.open('/accounting/f29-comparative', '_blank')}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Análisis Comparativo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Análisis Detallado */}
        {result && showDetailedAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Análisis Detallado F29</span>
              </CardTitle>
              <CardDescription>
                Métricas avanzadas, ratios financieros y recomendaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Métricas Calculadas */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Métricas Calculadas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-700 font-medium">Margen Bruto (%)</p>
                      <p className="text-xl font-bold text-blue-900">
                        {result.codigo563 > 0 ? `${((result.margenBruto / result.codigo563) * 100).toFixed(2)}%` : 'N/A'}
                      </p>
                      <p className="text-xs text-blue-600">
                        {result.margenBruto > 0 ? 'Positivo' : 'Negativo'}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-700 font-medium">Efectividad IVA</p>
                      <p className="text-xl font-bold text-green-900">
                        {result.codigo563 > 0 ? `${((result.codigo538 / result.codigo563) * 100).toFixed(2)}%` : 'N/A'}
                      </p>
                      <p className="text-xs text-green-600">Débito/Ventas</p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-700 font-medium">Ratio Crédito/Débito</p>
                      <p className="text-xl font-bold text-purple-900">
                        {result.codigo538 > 0 ? `${(result.codigo511 / result.codigo538).toFixed(2)}` : 'N/A'}
                      </p>
                      <p className="text-xs text-purple-600">
                        {result.codigo511 > result.codigo538 ? 'Mayor crédito' : 'Mayor débito'}
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm text-orange-700 font-medium">Carga Tributaria</p>
                      <p className="text-xl font-bold text-orange-900">
                        {result.codigo563 > 0 ? `${((result.totalAPagar / result.codigo563) * 100).toFixed(2)}%` : 'N/A'}
                      </p>
                      <p className="text-xs text-orange-600">Total/Ventas</p>
                    </div>
                  </div>
                </div>

                {/* Análisis de Tendencias */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Análisis de Ratios</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Situación Fiscal</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Estado IVA:</span>
                            <span className={`font-medium ${result.ivaDeterminado < 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.ivaDeterminado < 0 ? 'A favor' : 'A pagar'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>PPM mensual:</span>
                            <span className="font-medium">{formatCurrency(result.codigo062)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Remanente disponible:</span>
                            <span className="font-medium">{formatCurrency(result.codigo077)}</span>
                          </div>
                          {result.codigo151 > 0 && (
                            <div className="flex justify-between">
                              <span>Honorarios retenidos:</span>
                              <span className="font-medium">{formatCurrency(result.codigo151)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Análisis Operacional</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Ventas del período:</span>
                            <span className="font-medium">{formatCurrency(result.codigo563)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Compras estimadas:</span>
                            <span className="font-medium">{formatCurrency(result.comprasNetas)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Resultado bruto:</span>
                            <span className={`font-medium ${result.margenBruto > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(result.margenBruto)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recomendaciones */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Recomendaciones</h3>
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="space-y-3">
                      {result.ivaDeterminado < 0 && (
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                          <p className="text-sm text-gray-700">
                            <strong>IVA a favor:</strong> Tienes crédito fiscal disponible de {formatCurrency(Math.abs(result.ivaDeterminado))}. 
                            Puedes solicitar devolución o utilizarlo en períodos futuros.
                          </p>
                        </div>
                      )}
                      
                      {result.margenBruto < 0 && (
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                          <p className="text-sm text-gray-700">
                            <strong>Margen negativo:</strong> Tus compras superan las ventas. 
                            Revisa tu estrategia de precios y optimiza costos.
                          </p>
                        </div>
                      )}
                      
                      {result.codigo563 > 0 && result.codigo538 / result.codigo563 > 0.19 && (
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                          <p className="text-sm text-gray-700">
                            <strong>Alta carga de IVA:</strong> Tu débito fiscal representa más del 19% de las ventas. 
                            Verifica que todas las compras estén siendo consideradas.
                          </p>
                        </div>
                      )}
                      
                      {result.codigo151 > 0 && (
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                          <p className="text-sm text-gray-700">
                            <strong>Honorarios retenidos:</strong> Se detectaron {formatCurrency(result.codigo151)} en retenciones. 
                            Puedes usar este monto como crédito en tu declaración anual.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información Técnica */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Información Técnica</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Método de extracción</p>
                        <p className="text-gray-600">{result.method}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Nivel de confianza</p>
                        <p className={`font-medium ${getConfidenceColor(result.confidence)}`}>
                          {result.confidence}% - {getConfidenceLabel(result.confidence)}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Archivo procesado</p>
                        <p className="text-gray-600 truncate">{file?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => window.open('/accounting/f29-comparative', '_blank')}
              >
                📊 Análisis Comparativo
              </Button>
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => window.open('/accounting/f29-guide', '_blank')}
              >
                📚 Guía de Optimización
              </Button>
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => window.location.href = '/accounting'}
              >
                🏠 Volver a Contabilidad
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}