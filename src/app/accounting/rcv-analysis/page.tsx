'use client';

import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { FileText, Upload, AlertCircle, CheckCircle, X, BarChart3, Download, TrendingUp, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProveedorSummary {
  rutProveedor: string;
  razonSocial: string;
  totalTransacciones: number;
  transaccionesSuma: number;
  transaccionesResta: number;
  montoExentoTotal: number;
  montoNetoTotal: number;
  montoCalculado: number;
  porcentajeDelTotal: number;
}

interface RCVAnalysis {
  totalTransacciones: number;
  transaccionesSuma: number;
  transaccionesResta: number;
  montoExentoGlobal: number;
  montoNetoGlobal: number;
  montoCalculadoGlobal: number;
  proveedoresPrincipales: ProveedorSummary[];
  periodoInicio: string;
  periodoFin: string;
  confidence: number;
  method: string;
}

export default function RCVAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<RCVAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);
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
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.csv')) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
      setShowDetailed(false);
    } else {
      setError('Por favor, selecciona un archivo CSV válido');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
      setShowDetailed(false);
    } else {
      setError('Por favor, selecciona un archivo CSV válido');
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setShowDetailed(false);
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

      console.log('🚀 Iniciando análisis RCV:', file.name);

      const response = await fetch('/api/parse-rcv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('📊 Respuesta de API RCV:', data);

      if (data.success && data.data) {
        setResult(data.data);
        console.log('✅ RCV analizado:', data.data);
      } else {
        setError(data.error || 'Error al procesar el archivo RCV');
        console.error('❌ Error en análisis RCV:', data.error);
      }
    } catch (err) {
      console.error('Error en análisis RCV:', err);
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const [day, month, year] = dateStr.split('/');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Preparar datos para gráficos
  const chartData = result ? result.proveedoresPrincipales.slice(0, 10).map(p => ({
    name: p.razonSocial.length > 25 ? p.razonSocial.substring(0, 25) + '...' : p.razonSocial,
    fullName: p.razonSocial,
    monto: Math.abs(p.montoCalculado), // Usar valor absoluto para gráficos
    montoReal: p.montoCalculado, // Mantener valor real para tooltips
    transacciones: p.totalTransacciones,
    transaccionesSuma: p.transaccionesSuma,
    transaccionesResta: p.transaccionesResta,
    porcentaje: p.porcentajeDelTotal,
    tipo: p.montoCalculado >= 0 ? 'Compras' : 'Devoluciones'
  })) : [];

  // Colores para el gráfico
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'];

  // Función para exportar resultados
  const handleExportResults = () => {
    if (!result) return;

    const csvData = [
      ['RUT Proveedor', 'Razón Social', 'Total Trans.', 'Compras (33/34)', 'Devoluciones (61)', 'Monto Exento', 'Monto Neto', 'Monto Calculado', 'Porcentaje'],
      ...result.proveedoresPrincipales.map(p => [
        p.rutProveedor,
        p.razonSocial,
        p.totalTransacciones.toString(),
        p.transaccionesSuma.toString(),
        p.transaccionesResta.toString(),
        p.montoExentoTotal.toString(),
        p.montoNetoTotal.toString(),
        p.montoCalculado.toString(),
        p.porcentajeDelTotal.toFixed(2) + '%'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `RCV_Proveedores_${result.periodoInicio.replace(/\//g, '')}_${result.periodoFin.replace(/\//g, '')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Análisis RCV - Proveedores"
        subtitle="Analiza tu Registro de Compras y Ventas para identificar proveedores principales"
        showBackButton={true}
        backHref="/accounting"
        actions={
          <Button variant="outline" size="sm" onClick={() => window.open('/accounting/f29-analysis', '_blank')}>
            📊 Análisis F29
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Cargar Archivo RCV</span>
            </CardTitle>
            <CardDescription>
              Sube tu archivo CSV del Registro de Compras y Ventas del SII
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
                  Arrastra tu archivo RCV aquí
                </h4>
                <p className="text-gray-600 mb-4">
                  o haz clic para seleccionar archivo CSV
                </p>
                <Button 
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar Archivo CSV
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Solo archivos CSV • Máximo 10MB
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
                    {uploading ? 'Analizando RCV...' : 'Iniciar Análisis'}
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
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Transacciones</p>
                      <p className="text-2xl font-bold text-gray-900">{result.totalTransacciones.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
                      <p className="text-2xl font-bold text-gray-900">{result.proveedoresPrincipales.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monto Neto Calculado</p>
                      <p className={`text-2xl font-bold ${result.montoCalculadoGlobal >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {formatCurrency(result.montoCalculadoGlobal)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {result.transaccionesSuma} compras - {result.transaccionesResta} devoluciones
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Período</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatDate(result.periodoInicio)} - {formatDate(result.periodoFin)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Bar Chart - Top 10 Proveedores */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Proveedores por Monto</CardTitle>
                  <CardDescription>Ranking de proveedores principales por volumen de compras</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [formatCurrency(value), 'Monto Calculado']}
                          labelFormatter={(label) => {
                            const item = chartData.find(d => d.name === label);
                            return item ? `${item.fullName} (${item.tipo})` : label;
                          }}
                        />
                        <Bar dataKey="monto" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Pie Chart - Concentración */}
              <Card>
                <CardHeader>
                  <CardTitle>Concentración Top 10</CardTitle>
                  <CardDescription>Distribución porcentual de los principales proveedores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="porcentaje"
                          label={({ name, porcentaje }) => `${porcentaje.toFixed(1)}%`}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(2)}%`, 'Porcentaje']}
                          labelFormatter={(label) => {
                            const item = chartData.find(d => d.name === label);
                            return item?.fullName || label;
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
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
                onClick={() => setShowDetailed(!showDetailed)}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                {showDetailed ? 'Ocultar Detalle' : 'Ver Detalle Completo'}
              </Button>
            </div>

            {/* Detailed Table */}
            {showDetailed && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalle Completo de Proveedores</CardTitle>
                  <CardDescription>Lista completa de todos los proveedores analizados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">RUT</th>
                          <th className="text-left p-2">Razón Social</th>
                          <th className="text-center p-2">Total Trans.</th>
                          <th className="text-center p-2">Compras/Devoluc.</th>
                          <th className="text-right p-2">Monto Exento</th>
                          <th className="text-right p-2">Monto Neto</th>
                          <th className="text-right p-2">Monto Calculado</th>
                          <th className="text-center p-2">% del Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.proveedoresPrincipales.map((proveedor, index) => (
                          <tr key={proveedor.rutProveedor} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-mono text-sm">{proveedor.rutProveedor}</td>
                            <td className="p-2">{proveedor.razonSocial}</td>
                            <td className="p-2 text-center">{proveedor.totalTransacciones}</td>
                            <td className="p-2 text-center">
                              <span className="text-green-600 font-medium">{proveedor.transaccionesSuma}</span>
                              {proveedor.transaccionesResta > 0 && (
                                <span className="text-red-600 font-medium"> (-{proveedor.transaccionesResta})</span>
                              )}
                            </td>
                            <td className="p-2 text-right">{formatCurrency(proveedor.montoExentoTotal)}</td>
                            <td className="p-2 text-right">{formatCurrency(proveedor.montoNetoTotal)}</td>
                            <td className={`p-2 text-right font-semibold ${proveedor.montoCalculado >= 0 ? '' : 'text-red-600'}`}>
                              {formatCurrency(proveedor.montoCalculado)}
                            </td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${
                                proveedor.porcentajeDelTotal >= 10 ? 'bg-red-100 text-red-800' :
                                proveedor.porcentajeDelTotal >= 5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {proveedor.porcentajeDelTotal.toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}