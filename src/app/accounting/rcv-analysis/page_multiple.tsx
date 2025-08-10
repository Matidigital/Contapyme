'use client';

import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { FileText, Upload, AlertCircle, CheckCircle, X, BarChart3, Download, TrendingUp, Building2, Trash2, Play } from 'lucide-react';
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

interface FileResult {
  file: File;
  result: RCVAnalysis | null;
  error: string | null;
  storageResult: any;
  uploading: boolean;
}

export default function RCVAnalysisMultiplePage() {
  const [files, setFiles] = useState<FileResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [rcvType, setRcvType] = useState<'purchase' | 'sales'>('purchase');
  const [storeInDB, setStoreInDB] = useState(true);
  const [globalUploading, setGlobalUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showDetailed, setShowDetailed] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce'; // TODO: Get from auth

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

    const droppedFiles = Array.from(e.dataTransfer.files);
    const csvFiles = droppedFiles.filter(file => file.name.toLowerCase().endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      alert('Por favor, selecciona archivos CSV válidos');
      return;
    }

    const newFileResults: FileResult[] = csvFiles.map(file => ({
      file,
      result: null,
      error: null,
      storageResult: null,
      uploading: false
    }));

    setFiles(prev => [...prev, ...newFileResults]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const csvFiles = selectedFiles.filter(file => file.name.toLowerCase().endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      alert('Por favor, selecciona archivos CSV válidos');
      return;
    }

    const newFileResults: FileResult[] = csvFiles.map(file => ({
      file,
      result: null,
      error: null,
      storageResult: null,
      uploading: false
    }));

    setFiles(prev => [...prev, ...newFileResults]);
    
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (activeTab >= index && activeTab > 0) {
      setActiveTab(prev => prev - 1);
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setActiveTab(0);
    setShowDetailed(null);
  };

  const processFile = async (fileIndex: number): Promise<void> => {
    const fileData = files[fileIndex];
    if (!fileData || fileData.uploading) return;

    // Marcar archivo como en proceso
    setFiles(prev => prev.map((f, i) => 
      i === fileIndex ? { ...f, uploading: true, error: null } : f
    ));

    try {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('company_id', companyId);
      formData.append('rcv_type', rcvType);
      formData.append('store_in_db', storeInDB.toString());

      console.log('🚀 Procesando archivo RCV:', {
        fileName: fileData.file.name,
        rcvType,
        storeInDB,
        companyId
      });

      const response = await fetch('/api/parse-rcv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data) {
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? {
            ...f,
            uploading: false,
            result: data.data,
            storageResult: data.storage,
            error: null
          } : f
        ));
        console.log(`✅ RCV ${fileData.file.name} procesado exitosamente`);
      } else {
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? {
            ...f,
            uploading: false,
            error: data.error || 'Error al procesar el archivo RCV'
          } : f
        ));
      }
    } catch (err) {
      console.error('Error procesando RCV:', err);
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? {
          ...f,
          uploading: false,
          error: 'Error de conexión. Inténtalo nuevamente.'
        } : f
      ));
    }
  };

  const handleBatchAnalysis = async () => {
    if (files.length === 0) return;

    setGlobalUploading(true);

    // Procesar archivos en lotes de 3 para no sobrecargar el servidor
    const batchSize = 3;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize && i + j < files.length; j++) {
        batch.push(processFile(i + j));
      }
      await Promise.all(batch);
      
      // Pequeña pausa entre lotes
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setGlobalUploading(false);
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

  // Obtener estadísticas globales
  const getGlobalStats = () => {
    const processed = files.filter(f => f.result && !f.error);
    const totalFiles = files.length;
    const totalProcessed = processed.length;
    const totalTransactions = processed.reduce((sum, f) => sum + (f.result?.totalTransacciones || 0), 0);
    const totalAmount = processed.reduce((sum, f) => sum + (f.result?.montoCalculadoGlobal || 0), 0);
    const totalSuppliers = processed.reduce((sum, f) => sum + (f.result?.proveedoresPrincipales.length || 0), 0);

    return {
      totalFiles,
      totalProcessed,
      totalTransactions,
      totalAmount,
      totalSuppliers,
      hasErrors: files.some(f => f.error),
      isProcessing: files.some(f => f.uploading) || globalUploading
    };
  };

  const currentFile = files[activeTab];
  const result = currentFile?.result;

  // Preparar datos para gráficos del archivo activo
  const chartData = result ? result.proveedoresPrincipales.slice(0, 10).map(p => ({
    name: p.razonSocial.length > 25 ? p.razonSocial.substring(0, 25) + '...' : p.razonSocial,
    fullName: p.razonSocial,
    monto: Math.abs(p.montoCalculado),
    montoReal: p.montoCalculado,
    transacciones: p.totalTransacciones,
    transaccionesSuma: p.transaccionesSuma,
    transaccionesResta: p.transaccionesResta,
    porcentaje: p.porcentajeDelTotal,
    tipo: p.montoCalculado >= 0 ? 'Compras' : 'Devoluciones'
  })) : [];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'];

  const handleExportResults = () => {
    if (!result || !currentFile) return;

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
      link.setAttribute('download', `RCV_${currentFile.file.name.replace('.csv', '')}_${result.periodoInicio.replace(/\//g, '')}_${result.periodoFin.replace(/\//g, '')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const stats = getGlobalStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Análisis RCV Múltiple"
        subtitle="Procesa múltiples registros de compras y ventas simultáneamente con análisis comparativo"
        showBackButton={true}
        backHref="/accounting"
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => window.open('/accounting/rcv-history', '_blank')}>
              📋 Ver Historial RCV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open('/accounting/f29-analysis', '_blank')}>
              📊 Análisis F29
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        
        {/* Stats Overview */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Archivos</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalFiles}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Procesados</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalProcessed}/{stats.totalFiles}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Transacciones</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.totalTransactions.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{rcvType === 'purchase' ? 'Proveedores' : 'Clientes'}</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.totalSuppliers.toLocaleString()}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Total</p>
                    <p className={`text-2xl font-bold ${stats.totalAmount >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      {formatCurrency(stats.totalAmount)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Cargar Archivos RCV Múltiples</span>
                </CardTitle>
                <CardDescription>
                  Arrastra y suelta múltiples archivos CSV del SII para procesarlos simultáneamente. Todos deben ser del mismo tipo (compras o ventas).
                </CardDescription>
              </div>
              {files.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllFiles}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpiar Todo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-6 ${
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
                Arrastra múltiples archivos RCV aquí
              </h4>
              <p className="text-gray-600 mb-4">
                o haz clic para seleccionar varios archivos CSV simultáneamente
              </p>
              <Button 
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
              >
                Seleccionar Archivos CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                Solo archivos CSV • Máximo 10MB por archivo • Sin límite de cantidad
              </p>
            </div>

            {/* Files List */}
            {files.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Tipo de RCV */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de RCV (aplicable a todos los archivos)
                    </label>
                    <select
                      value={rcvType}
                      onChange={(e) => setRcvType(e.target.value as 'purchase' | 'sales')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={globalUploading || files.some(f => f.uploading)}
                    >
                      <option value="purchase">📈 Registro de Compras</option>
                      <option value="sales">💰 Registro de Ventas</option>
                    </select>
                  </div>

                  {/* Almacenar en BD */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Almacenamiento
                    </label>
                    <div className="flex items-center space-x-3 mt-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={storeInDB}
                          onChange={(e) => setStoreInDB(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={globalUploading || files.some(f => f.uploading)}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          💾 Guardar todos en base de datos
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Files Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {files.map((fileData, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            fileData.uploading ? 'bg-yellow-500 animate-pulse' :
                            fileData.error ? 'bg-red-500' :
                            fileData.result ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {fileData.file.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={fileData.uploading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>

                      {fileData.uploading && (
                        <div className="text-xs text-yellow-600 mb-2">
                          🔄 Procesando...
                        </div>
                      )}

                      {fileData.error && (
                        <div className="text-xs text-red-600 mb-2">
                          ❌ {fileData.error}
                        </div>
                      )}

                      {fileData.result && !fileData.error && (
                        <div className="text-xs text-green-600 mb-2">
                          ✅ {fileData.result.totalTransacciones} transacciones
                          {fileData.storageResult && ' • Almacenado en BD'}
                        </div>
                      )}

                      {fileData.result && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab(index)}
                          fullWidth
                        >
                          Ver Análisis
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Process Button */}
                <div className="flex justify-center">
                  <Button
                    variant="primary"
                    onClick={handleBatchAnalysis}
                    disabled={globalUploading || files.some(f => f.uploading)}
                    loading={globalUploading}
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {globalUploading ? 'Procesando Archivos...' : `Procesar ${files.length} Archivo${files.length !== 1 ? 's' : ''} como ${rcvType === 'purchase' ? 'Compras' : 'Ventas'}`}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {files.some(f => f.result) && (
          <>
            {/* File Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados del Análisis</CardTitle>
                <CardDescription>Selecciona un archivo para ver su análisis detallado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {files.map((fileData, index) => (
                    fileData.result && (
                      <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === index
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {fileData.file.name.replace('.csv', '')}
                      </button>
                    )
                  ))}
                </div>

                {/* Current File Results */}
                {currentFile?.result && (
                  <div className="space-y-6">
                    {/* Summary Cards for Active File */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Transacciones</p>
                              <p className="text-2xl font-bold text-gray-900">{result!.totalTransacciones.toLocaleString()}</p>
                            </div>
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total {rcvType === 'purchase' ? 'Proveedores' : 'Clientes'}</p>
                              <p className="text-2xl font-bold text-gray-900">{result!.proveedoresPrincipales.length}</p>
                            </div>
                            <Building2 className="w-6 h-6 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Monto Neto Calculado</p>
                              <p className={`text-2xl font-bold ${result!.montoCalculadoGlobal >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                {formatCurrency(result!.montoCalculadoGlobal)}
                              </p>
                            </div>
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Período</p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatDate(result!.periodoInicio)} - {formatDate(result!.periodoFin)}
                              </p>
                            </div>
                            <BarChart3 className="w-6 h-6 text-orange-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {/* Bar Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Top 10 {rcvType === 'purchase' ? 'Proveedores' : 'Clientes'} por Monto</CardTitle>
                          <CardDescription>Ranking principal por volumen de {rcvType === 'purchase' ? 'compras' : 'ventas'}</CardDescription>
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

                      {/* Pie Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Concentración Top 10</CardTitle>
                          <CardDescription>Distribución porcentual de los principales {rcvType === 'purchase' ? 'proveedores' : 'clientes'}</CardDescription>
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
                        Exportar Archivo Actual
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowDetailed(showDetailed === activeTab ? null : activeTab)}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        {showDetailed === activeTab ? 'Ocultar Detalle' : 'Ver Detalle Completo'}
                      </Button>
                    </div>

                    {/* Detailed Table */}
                    {showDetailed === activeTab && result && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Detalle Completo - {currentFile.file.name}</CardTitle>
                          <CardDescription>Lista completa de todos los {rcvType === 'purchase' ? 'proveedores' : 'clientes'} analizados</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">RUT</th>
                                  <th className="text-left p-2">Razón Social</th>
                                  <th className="text-center p-2">Total Trans.</th>
                                  <th className="text-center p-2">{rcvType === 'purchase' ? 'Compras/Devoluc.' : 'Ventas/Devoluc.'}</th>
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
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}