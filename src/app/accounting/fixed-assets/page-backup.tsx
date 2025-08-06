'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  Download,
  TrendingUp,
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Header } from '@/components/layout';
import { FixedAsset, FixedAssetReport } from '@/types';
import AddFixedAssetForm from '@/components/fixed-assets/AddFixedAssetForm';
import EditFixedAssetForm from '@/components/fixed-assets/EditFixedAssetForm';
import { useOptimisticAssets } from '@/hooks/useOptimisticAssets';
import { useRealtimeAssets } from '@/hooks/useRealtimeAssets';
import { useDepreciationWorker } from '@/hooks/useDepreciationWorker';

interface FixedAssetsPageProps {}

// Constantes de paginación
const ITEMS_PER_PAGE = 20;

export default function FixedAssetsPage({}: FixedAssetsPageProps) {
  const { 
    assets, 
    loading: assetsLoading, 
    createAssetOptimistic,
    updateAssetOptimistic,
    deleteAssetOptimistic,
    refreshAssets,
    setAssets
  } = useOptimisticAssets();

  // Web Worker para cálculos pesados
  const { 
    isWorkerReady, 
    workerError, 
    calculateAssetsReport: calculateReportWorker,
    calculateSingleDepreciation
  } = useDepreciationWorker();

  // Real-time subscriptions para sincronización automática
  const { isConnected, connectionError, lastUpdate } = useRealtimeAssets(
    // onAssetInserted - cuando otro usuario crea un activo
    (newAsset) => {
      console.log('🔄 Sincronizando nuevo activo desde otra sesión:', newAsset.name);
      setAssets(prev => {
        // Evitar duplicados
        if (prev.find(a => a.id === newAsset.id)) return prev;
        return [newAsset, ...prev];
      });
    },
    // onAssetUpdated - cuando otro usuario modifica un activo
    (updatedAsset) => {
      console.log('🔄 Sincronizando activo modificado desde otra sesión:', updatedAsset.name);
      setAssets(prev => prev.map(asset => 
        asset.id === updatedAsset.id ? updatedAsset : asset
      ));
    },
    // onAssetDeleted - cuando otro usuario elimina un activo
    (deletedAssetId) => {
      console.log('🔄 Sincronizando activo eliminado desde otra sesión:', deletedAssetId);
      setAssets(prev => prev.filter(asset => asset.id !== deletedAssetId));
    }
  );
  
  const [report, setReport] = useState<FixedAssetReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [showReportDetails, setShowReportDetails] = useState(false);

  // Cargar datos iniciales con Web Worker
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Refrescar activos usando optimistic hook
      await refreshAssets();
      
      // Si hay activos y Worker está disponible, calcular reporte con Worker
      if (assets.length > 0 && isWorkerReady) {
        console.log('🧮 Calculando reporte con Web Worker...');
        try {
          const workerReport = await calculateReportWorker(assets);
          setReport(workerReport);
          console.log('✅ Reporte calculado con Web Worker exitosamente');
        } catch (workerError) {
          console.warn('Worker falló, usando API tradicional:', workerError);
          // Fallback a API tradicional
          const reportRes = await fetch('/api/fixed-assets/reports?type=summary');
          if (reportRes.ok) {
            const reportData = await reportRes.json();
            setReport(reportData.report || null);
          }
        }
      } else {
        // Cargar reporte usando API tradicional
        const reportRes = await fetch('/api/fixed-assets/reports?type=summary');
        if (reportRes.ok) {
          const reportData = await reportRes.json();
          console.log('Report data received from API:', reportData);
          setReport(reportData.report || null);
        } else {
          console.error('Failed to load report:', reportRes.status);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshAssets, assets, isWorkerReady, calculateReportWorker]);

  // Manejar éxito en creación de activo (optimistic ya se encarga)
  const handleAssetCreated = () => {
    console.log('✅ Activo creado con optimistic update');
    // Solo refrescar reporte después de un momento
    setTimeout(() => {
      fetchData(); // Solo para actualizar el reporte
    }, 1000);
  };

  // Manejar éxito en edición de activo (optimistic ya se encarga)
  const handleAssetUpdated = () => {
    console.log('✅ Activo actualizado con optimistic update');
    setSelectedAsset(null);
    setShowEditForm(false);
    // Solo refrescar reporte después de un momento
    setTimeout(() => {
      fetchData(); // Solo para actualizar el reporte
    }, 800);
  };

  // Abrir modal de edición
  const openEditModal = (asset: FixedAsset) => {
    setSelectedAsset(asset);
    setShowEditForm(true);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debug: log de estados disponibles
  useEffect(() => {
    if (assets.length > 0) {
      const uniqueStatuses = [...new Set(assets.map(asset => asset.status))];
      console.log('Estados disponibles en activos:', uniqueStatuses);
      console.log('Estado seleccionado:', selectedStatus);
    }
  }, [assets, selectedStatus]);

  // Filtrar activos por búsqueda y estado
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // Filtro por texto de búsqueda
      const matchesSearch = !searchTerm || (
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.brand && asset.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.model && asset.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.category && asset.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      // Filtro por estado
      const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [assets, searchTerm, selectedStatus]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);
  
  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  // Memoizar cálculos de valor libro para todos los activos paginados
  const bookValues = useMemo(() => {
    const values = new Map<string, number>();
    
    paginatedAssets.forEach(asset => {
      try {
        const monthsSinceDepreciation = Math.max(0, Math.floor(
          (new Date().getTime() - new Date(asset.start_depreciation_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
        ));
        
        const depreciableValue = asset.purchase_value - (asset.residual_value || 0);
        const totalMonths = asset.useful_life_years * 12;
        const monthlyDepreciation = depreciableValue / totalMonths;
        
        const accumulatedDepreciation = Math.min(
          monthsSinceDepreciation * monthlyDepreciation,
          depreciableValue
        );
        
        const bookValue = Math.max(
          asset.purchase_value - accumulatedDepreciation, 
          asset.residual_value || 0
        );
        
        values.set(asset.id, bookValue);
      } catch (error) {
        console.error('Error calculating book value for asset:', asset.name, error);
        values.set(asset.id, asset.purchase_value);
      }
    });
    
    return values;
  }, [paginatedAssets]);

  // Obtener valor libro memoizado
  const getBookValue = (assetId: string): number => {
    return bookValues.get(assetId) || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando activos fijos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000" />
      </div>
      
      <Header 
        title="Gestión de Activos Fijos"
        subtitle="Control completo con depreciación automática y reportes ejecutivos"
        showBackButton={true}
        backHref="/accounting"
        variant="premium"
        actions={
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 rounded-full text-xs font-medium text-orange-800">
              <Package className="w-3 h-3" />
              <span>CRUD Completo</span>
            </div>
            <div className={`hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' 
                : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span>{isConnected ? 'Tiempo Real' : 'Desconectado'}</span>
            </div>
            <div className={`hidden xl:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
              isWorkerReady 
                ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800' 
                : workerError
                ? 'bg-gradient-to-r from-red-100 to-orange-100 text-red-800'
                : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isWorkerReady 
                  ? 'bg-blue-500 animate-pulse' 
                  : workerError 
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`}></div>
              <span>
                {isWorkerReady 
                  ? '⚡ Worker' 
                  : workerError 
                  ? '❌ Worker' 
                  : '⏳ Worker'
                }
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/fixed-assets/export?format=csv');
                  
                  if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `activos_fijos_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  } else {
                    const errorData = await response.json();
                    alert(errorData.error || 'Error al exportar activos fijos');
                  }
                } catch (error) {
                  console.error('Error exporting assets:', error);
                  alert('Error al exportar activos fijos');
                }
              }}
              className="border-green-200 hover:bg-green-50 hover:border-green-300"
            >
              <Download className="w-4 h-4 mr-1" />
              Exportar CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Activo
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Tarjetas de Resumen Modernizadas con Lazy Loading */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="bg-white/90 backdrop-blur-sm border-2 border-gray-100 p-6 animate-pulse">
                  <div className="flex items-center">
                    <div className="p-3 bg-gray-200 rounded-xl w-12 h-12"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-7 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : report && showReportDetails ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/90 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Package className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-700 mb-1">Total Activos</p>
                    <p className="text-3xl font-bold text-blue-900">{report.total_assets}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-2 border-green-100 hover:border-green-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-700 mb-1">Valor Compra Total</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(report?.total_purchase_value || 0)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-700 mb-1">Valor Libro Total</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(report?.total_book_value || 0)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-2 border-orange-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-orange-700 mb-1">Depreciación Mensual</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {formatCurrency(report?.monthly_depreciation || 0)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-blue-100 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-blue-800">
                        Resumen de Activos Fijos
                      </h3>
                      <p className="text-blue-600">
                        {filteredAssets.length} activos encontrados
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowReportDetails(true);
                      if (!report) fetchData();
                    }}
                    className="border-blue-200 hover:bg-blue-50"
                  >
                    Ver estadísticas detalladas
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filtros y Búsqueda Modernizados */}
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-gray-100 hover:border-gray-200 transition-colors mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <span>Filtros de Búsqueda</span>
              </CardTitle>
              <CardDescription>
                Encuentra activos específicos por nombre, marca, modelo o estado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Búsqueda */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, marca o número de serie..."
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-300 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filtro por estado */}
                <div className="lg:w-48">
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-300 transition-all duration-300 bg-white/80 backdrop-blur-sm font-medium"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">🔍 Todos los estados</option>
                    <option value="active">✅ Activo</option>
                    <option value="disposed">❌ Dado de baja</option>
                    <option value="fully_depreciated">📉 Totalmente depreciado</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Activos Fijos */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Activos Fijos ({filteredAssets.length})
                </h2>
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                  </div>
                )}
              </div>
              
              {filteredAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay activos fijos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || selectedStatus !== 'all' 
                      ? 'No se encontraron activos con los filtros aplicados.'
                      : 'Comienza agregando tu primer activo fijo.'
                    }
                  </p>
                  {!searchTerm && selectedStatus === 'all' && (
                    <div className="mt-6">
                      <Button
                        variant="primary"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowAddForm(true)}
                      >
                        Agregar Primer Activo
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-orange-50 to-red-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          🏢 Activo
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          💰 Valor Compra
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          📈 Valor Libro
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          ⏰ Vida Útil
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          🟢 Estado
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-orange-800 uppercase tracking-wider">
                          ⚙️ Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedAssets.map((asset) => {
                        const bookValue = getBookValue(asset.id);
                        
                        return (
                          <tr key={asset.id} className={`hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 ${
                            (asset as any).isOptimistic 
              ? (asset as any).isReverting 
                ? 'bg-red-50 opacity-60 animate-pulse' 
                : 'bg-blue-50 opacity-90'
              : ''
                          }`}>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {asset.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {asset.serial_number && `S/N: ${asset.serial_number}`}
                                    {asset.brand && ` • ${asset.brand}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm font-semibold text-green-900">
                                {formatCurrency(asset.purchase_value)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm font-semibold text-purple-900">
                                {formatCurrency(bookValue)}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-orange-700 font-medium">
                                {asset.useful_life_years} años
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                                asset.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                                asset.status === 'disposed' ? 'bg-red-100 text-red-800 border-red-200' :
                                'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}>
                                {asset.status === 'active' ? '✅ Activo' :
                                 asset.status === 'disposed' ? '❌ Dado de baja' :
                                 '📉 Totalmente depreciado'}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Link href={`/accounting/fixed-assets/${asset.id}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<FileText className="w-4 h-4" />}
                                    className="border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                                  >
                                    Ver
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<Edit2 className="w-4 h-4" />}
                                  onClick={() => openEditModal(asset)}
                                  className="border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<Trash2 className="w-4 h-4" />}
                                  className="border-red-200 hover:bg-red-50 hover:border-red-300"
                                  onClick={() => {
                                    if (confirm(`¿Estás seguro de eliminar el activo "${asset.name}"?`)) {
                                      deleteAssetOptimistic(
                                        asset.id,
                                        () => {
                                          console.log('✅ Activo eliminado con optimistic update');
                                          // Refrescar reporte después de eliminar
                                          setTimeout(() => fetchData(), 1000);
                                        },
                                        (error) => {
                                          alert(error || 'Error al eliminar activo');
                                        }
                                      );
                                    }
                                  }}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Controles de Paginación */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    
                    {/* Números de página */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        if (pageNum < 1 || pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "primary" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum 
                              ? "bg-orange-600 hover:bg-orange-700" 
                              : "border-gray-300"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="border-gray-300"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredAssets.length)} de {filteredAssets.length} activos
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas de Depreciación Modernizadas */}
          {report && report.assets_near_full_depreciation.length > 0 && (
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-orange-200 hover:border-orange-300 transition-colors mt-6">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <span>Alertas de Depreciación</span>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                    {report.assets_near_full_depreciation.length} activos
                  </span>
                </CardTitle>
                <CardDescription>
                  Activos próximos a depreciación completa (90%+) que requieren atención
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.assets_near_full_depreciation.slice(0, 5).map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{asset.name}</p>
                          <p className="text-sm text-orange-700">🚨 Requiere revisión contable</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">
                            90%+ depreciado
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          Valor libro: {formatCurrency(getBookValue(asset.id))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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

      {/* Modal Agregar Activo */}
      <AddFixedAssetForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={handleAssetCreated}
        createAssetOptimistic={createAssetOptimistic}
      />

      {/* Modal Editar Activo */}
      {selectedAsset && (
        <EditFixedAssetForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedAsset(null);
          }}
          onSuccess={handleAssetUpdated}
          asset={selectedAsset}
        />
      )}
    </div>
  );
}