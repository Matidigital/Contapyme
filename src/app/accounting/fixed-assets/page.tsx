'use client';

import { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { FixedAsset, FixedAssetReport } from '@/types';
import AddFixedAssetForm from '@/components/fixed-assets/AddFixedAssetForm';
import EditFixedAssetForm from '@/components/fixed-assets/EditFixedAssetForm';

interface FixedAssetsPageProps {}

export default function FixedAssetsPage({}: FixedAssetsPageProps) {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [report, setReport] = useState<FixedAssetReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null);

  // Cargar datos iniciales
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar activos fijos
      const assetsParams = new URLSearchParams();
      if (selectedStatus !== 'all') assetsParams.append('status', selectedStatus);
      
      // IMPORTANTE: El reporte siempre debe mostrar TODOS los activos,
      // independientemente del filtro aplicado en la vista
      const [assetsRes, reportRes] = await Promise.all([
        fetch(`/api/fixed-assets?${assetsParams.toString()}`),
        fetch('/api/fixed-assets/reports?type=summary') // Sin filtros para el reporte
      ]);

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        setAssets(assetsData.assets || []);
      }

      if (reportRes.ok) {
        const reportData = await reportRes.json();
        console.log('Report data received:', reportData);
        setReport(reportData.report || null);
      } else {
        console.error('Failed to load report:', reportRes.status);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  // Manejar éxito en creación de activo
  const handleAssetCreated = async () => {
    // Pequeña demora para asegurar que la DB se actualizó
    await new Promise(resolve => setTimeout(resolve, 500));
    await fetchData(); // Recargar datos
    console.log('✅ Nuevo activo creado, datos actualizados');
  };

  // Manejar éxito en edición de activo
  const handleAssetUpdated = async () => {
    // Pequeña demora para asegurar que la DB se actualizó
    await new Promise(resolve => setTimeout(resolve, 500));
    await fetchData(); // Recargar datos
    setSelectedAsset(null);
    setShowEditForm(false);
    console.log('✅ Activo actualizado, datos refrescados');
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
  const filteredAssets = assets.filter(asset => {
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

  // Calcular valor libro actual (aproximado)
  const calculateBookValue = (asset: FixedAsset) => {
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
      
      return bookValue;
    } catch (error) {
      console.error('Error calculating book value for asset:', asset.name, error);
      return asset.purchase_value; // Fallback al valor de compra
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/accounting" className="text-gray-600 hover:text-gray-900 mr-4">
                ← Volver a Contabilidad
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Package className="mr-2 h-6 w-6" />
                Activos Fijos
              </h1>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
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
              >
                Exportar CSV
              </Button>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddForm(true)}
              >
                Nuevo Activo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Tarjetas de Resumen */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-200 rounded-lg w-10 h-10"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : report ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{report.total_assets}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Valor Compra Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(report?.total_purchase_value || 0)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Valor Libro Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(report?.total_book_value || 0)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Depreciación Mensual</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(report?.monthly_depreciation || 0)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    No se pudieron cargar las estadísticas
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Las métricas de activos fijos no están disponibles en este momento.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros y Búsqueda */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Búsqueda */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, marca o número de serie..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>


                {/* Filtro por estado */}
                <div className="lg:w-40">
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activo</option>
                    <option value="disposed">Dado de baja</option>
                    <option value="fully_depreciated">Totalmente depreciado</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Lista de Activos Fijos */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Activos Fijos ({filteredAssets.length})
              </h2>
              
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Compra
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Libro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vida Útil
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAssets.map((asset) => {
                        const bookValue = calculateBookValue(asset);
                        
                        return (
                          <tr key={asset.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {asset.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {asset.serial_number && `S/N: ${asset.serial_number}`}
                                    {asset.brand && ` • ${asset.brand}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(asset.purchase_value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(bookValue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {asset.useful_life_years} años
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                asset.status === 'active' ? 'bg-green-100 text-green-800' :
                                asset.status === 'disposed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {asset.status === 'active' ? 'Activo' :
                                 asset.status === 'disposed' ? 'Dado de baja' :
                                 'Totalmente depreciado'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <Link href={`/accounting/fixed-assets/${asset.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={<FileText className="w-4 h-4" />}
                                  >
                                    Ver
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  leftIcon={<Edit2 className="w-4 h-4" />}
                                  onClick={() => openEditModal(asset)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  leftIcon={<Trash2 className="w-4 h-4" />}
                                  onClick={async () => {
                                    if (confirm(`¿Estás seguro de eliminar el activo "${asset.name}"?`)) {
                                      try {
                                        const response = await fetch(`/api/fixed-assets/${asset.id}`, {
                                          method: 'DELETE'
                                        });
                                        
                                        if (response.ok) {
                                          // Forzar recarga completa de datos
                                          await fetchData();
                                          console.log('✅ Activo eliminado, datos actualizados');
                                        } else {
                                          const errorData = await response.json();
                                          alert(errorData.error || 'Error al eliminar activo');
                                        }
                                      } catch (error) {
                                        console.error('Error deleting asset:', error);
                                        alert('Error al eliminar activo');
                                      }
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
            </div>
          </Card>

          {/* Activos próximos a depreciación completa */}
          {report && report.assets_near_full_depreciation.length > 0 && (
            <Card className="mt-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                  Activos Próximos a Depreciación Completa
                </h3>
                <div className="space-y-3">
                  {report.assets_near_full_depreciation.slice(0, 5).map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{asset.name}</p>
                        <p className="text-sm text-gray-600">Activo Fijo</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">
                          90%+ depreciado
                        </p>
                        <p className="text-sm text-gray-500">
                          Valor libro: {formatCurrency(calculateBookValue(asset))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Agregar Activo */}
      <AddFixedAssetForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={handleAssetCreated}
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