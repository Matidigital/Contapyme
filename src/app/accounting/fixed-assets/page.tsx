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
import { FixedAsset, FixedAssetCategory, FixedAssetReport } from '@/types';
import AddFixedAssetForm from '@/components/fixed-assets/AddFixedAssetForm';

interface FixedAssetsPageProps {}

export default function FixedAssetsPage({}: FixedAssetsPageProps) {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [categories, setCategories] = useState<FixedAssetCategory[]>([]);
  const [report, setReport] = useState<FixedAssetReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Cargar datos iniciales
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar activos fijos
      const assetsParams = new URLSearchParams();
      if (selectedStatus !== 'all') assetsParams.append('status', selectedStatus);
      if (selectedCategory !== 'all') assetsParams.append('category', selectedCategory);
      
      const [assetsRes, categoriesRes, reportRes] = await Promise.all([
        fetch(`/api/fixed-assets?${assetsParams.toString()}`),
        fetch('/api/fixed-assets/categories'),
        fetch('/api/fixed-assets/reports?type=summary')
      ]);

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        setAssets(assetsData.assets || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }

      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setReport(reportData.report || null);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedCategory]);

  // Manejar éxito en creación de activo
  const handleAssetCreated = () => {
    fetchData(); // Recargar datos
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrar activos por búsqueda
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    const monthsSincePurchase = Math.floor(
      (new Date().getTime() - new Date(asset.start_depreciation_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const monthlyDepreciation = asset.depreciable_value / asset.useful_life_months;
    const accumulatedDepreciation = Math.min(
      monthsSincePurchase * monthlyDepreciation,
      asset.depreciable_value
    );
    return Math.max(asset.purchase_value - accumulatedDepreciation, asset.residual_value);
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
                onClick={() => {
                  // TODO: Implementar exportación
                  alert('Funcionalidad de exportación próximamente');
                }}
              >
                Exportar
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
          {report && (
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
                      {formatCurrency(report.total_purchase_value)}
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
                      {formatCurrency(report.total_book_value)}
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
                      {formatCurrency(report.monthly_depreciation)}
                    </p>
                  </div>
                </div>
              </Card>
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
                      placeholder="Buscar por nombre, categoría o número de serie..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filtro por categoría */}
                <div className="lg:w-48">
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">Todas las categorías</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
                    {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' 
                      ? 'No se encontraron activos con los filtros aplicados.'
                      : 'Comienza agregando tu primer activo fijo.'
                    }
                  </p>
                  {!searchTerm && selectedCategory === 'all' && selectedStatus === 'all' && (
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
                          Categoría
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {asset.category}
                              </span>
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
                                  onClick={() => {
                                    // TODO: Implementar modal de edición
                                    alert('Funcionalidad de edición próximamente');
                                  }}
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
                                          fetchData(); // Recargar datos
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
                        <p className="text-sm text-gray-600">{asset.category}</p>
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
    </div>
  );
}