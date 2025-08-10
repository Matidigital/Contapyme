'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { FileText, Calendar, BarChart3, Download, Trash2, Filter, Search, Building2, TrendingUp, AlertCircle } from 'lucide-react';

interface RCVLedger {
  id: string;
  company_id: string;
  period_start: string;
  period_end: string;
  period_identifier: string;
  total_transactions: number;
  sum_transactions: number;
  subtract_transactions: number;
  total_exempt_amount: number;
  total_net_amount: number;
  total_calculated_amount: number;
  unique_suppliers?: number;
  unique_customers?: number;
  confidence_score: number;
  processing_method: string;
  file_name: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  documents?: any[];
}

interface RCVData {
  ledgers: RCVLedger[];
  documents: any[];
  summary: {
    total_ledgers: number;
    total_transactions: number;
    total_amount: number;
  };
}

export default function RCVHistoryPage() {
  const [purchaseData, setPurchaseData] = useState<RCVData | null>(null);
  const [salesData, setSalesData] = useState<RCVData | null>(null);
  const [activeTab, setActiveTab] = useState<'purchase' | 'sales'>('purchase');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLedger, setSelectedLedger] = useState<RCVLedger | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);

  const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce'; // TODO: Get from auth

  const loadRCVData = async (type: 'purchase' | 'sales') => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/rcv/${type}?company_id=${companyId}${selectedPeriod ? `&period=${selectedPeriod}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        if (type === 'purchase') {
          setPurchaseData(result.data);
        } else {
          setSalesData(result.data);
        }
      } else {
        throw new Error(result.error || 'Error al cargar datos RCV');
      }
    } catch (error) {
      console.error('Error cargando RCV:', error);
      setError(error instanceof Error ? error.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRCVData('purchase');
    loadRCVData('sales');
  }, [selectedPeriod]);

  const handleDeleteLedger = async (ledgerId: string, type: 'purchase' | 'sales') => {
    if (!confirm('¿Estás seguro de eliminar este registro RCV? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/rcv/${type}?ledger_id=${ledgerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar registro');
      }

      const result = await response.json();
      
      if (result.success) {
        // Recargar datos
        await loadRCVData(type);
        setSelectedLedger(null);
        setShowDocuments(false);
      } else {
        throw new Error(result.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error eliminando RCV:', error);
      alert('Error al eliminar el registro: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleViewDocuments = (ledger: RCVLedger) => {
    setSelectedLedger(ledger);
    setShowDocuments(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL');
  };

  const formatPeriod = (periodId: string) => {
    const [year, month] = periodId.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getCurrentData = (): RCVData | null => {
    return activeTab === 'purchase' ? purchaseData : salesData;
  };

  const filteredLedgers = getCurrentData()?.ledgers?.filter(ledger => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ledger.file_name.toLowerCase().includes(searchLower) ||
      ledger.period_identifier.includes(searchLower) ||
      formatPeriod(ledger.period_identifier).toLowerCase().includes(searchLower)
    );
  }) || [];

  // Obtener períodos únicos para el filtro
  const uniquePeriods = Array.from(
    new Set([
      ...(purchaseData?.ledgers?.map(l => l.period_identifier) || []),
      ...(salesData?.ledgers?.map(l => l.period_identifier) || [])
    ])
  ).sort().reverse();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Historial RCV Guardado"
        subtitle="Visualiza y gestiona tus registros de compras y ventas almacenados en base de datos"
        showBackButton={true}
        backHref="/accounting"
        actions={
          <Button variant="outline" size="sm" onClick={() => window.open('/accounting/rcv-analysis', '_blank')}>
            📄 Analizar Nuevo RCV
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Compras</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {purchaseData?.summary.total_ledgers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {salesData?.summary.total_ledgers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transacciones</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {((purchaseData?.summary.total_transactions || 0) + (salesData?.summary.total_transactions || 0)).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency((purchaseData?.summary.total_amount || 0) + (salesData?.summary.total_amount || 0))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Registros RCV Almacenados</span>
                </CardTitle>
                <CardDescription>
                  Historial completo de tus registros de compras y ventas procesados y almacenados
                </CardDescription>
              </div>
              
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los períodos</option>
                    {uniquePeriods.map(period => (
                      <option key={period} value={period}>
                        {formatPeriod(period)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por archivo o período..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mt-4">
              <button
                onClick={() => setActiveTab('purchase')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'purchase' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                📈 Compras ({purchaseData?.ledgers?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('sales')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'sales' 
                    ? 'bg-white text-green-600 shadow-sm' 
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                💰 Ventas ({salesData?.ledgers?.length || 0})
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando datos RCV...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            ) : filteredLedgers.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay registros RCV {activeTab === 'purchase' ? 'de compras' : 'de ventas'} guardados
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedPeriod 
                    ? 'No se encontraron registros que coincidan con los filtros aplicados' 
                    : 'Comienza subiendo tu primer archivo RCV para ver los datos almacenados aquí'}
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => window.open('/accounting/rcv-analysis', '_blank')}
                >
                  📄 Analizar RCV
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLedgers.map((ledger) => (
                  <div
                    key={ledger.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-3 h-3 rounded-full ${
                            activeTab === 'purchase' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {formatPeriod(ledger.period_identifier)}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ledger.confidence_score >= 90 
                              ? 'bg-green-100 text-green-800'
                              : ledger.confidence_score >= 70 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {ledger.confidence_score}% confianza
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Transacciones</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {ledger.total_transactions.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {activeTab === 'purchase' ? 'Proveedores' : 'Clientes'}
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              {(ledger.unique_suppliers || ledger.unique_customers || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Monto Neto</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatCurrency(ledger.total_net_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Monto Total</p>
                            <p className={`text-lg font-semibold ${
                              ledger.total_calculated_amount >= 0 ? 'text-gray-900' : 'text-red-600'
                            }`}>
                              {formatCurrency(ledger.total_calculated_amount)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          <span>📄 {ledger.file_name}</span>
                          <span>•</span>
                          <span>📅 {formatDate(ledger.created_at)}</span>
                          <span>•</span>
                          <span>📊 {ledger.processing_method}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocuments(ledger)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Ver Documentos ({ledger.documents?.length || ledger.total_transactions})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLedger(ledger.id, activeTab)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de documentos */}
        {showDocuments && selectedLedger && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Documentos - {formatPeriod(selectedLedger.period_identifier)}
                  </h3>
                  <button
                    onClick={() => {
                      setShowDocuments(false);
                      setSelectedLedger(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedLedger.total_transactions.toLocaleString()} transacciones • {selectedLedger.file_name}
                </p>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>📊 Resumen:</strong> Esta funcionalidad permite visualizar los documentos individuales que conforman cada registro RCV. 
                    Los detalles específicos de cada documento se cargan dinámicamente desde la base de datos cuando sea necesario.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Vista de documentos en desarrollo</h4>
                  <p className="text-gray-600">
                    Los documentos individuales están almacenados en la base de datos.
                    <br />Esta vista detallada se implementará según necesidades específicas del usuario.
                  </p>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    💾 Datos almacenados en Supabase • Consulta en tiempo real
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowDocuments(false);
                      setSelectedLedger(null);
                    }}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}