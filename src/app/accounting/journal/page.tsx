'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  FileText,
  Settings,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';

// Tipos TypeScript
interface JournalEntry {
  id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  reference?: string;
  entry_type: 'manual' | 'f29' | 'rcv' | 'fixed_asset' | 'automatic';
  source_type?: string;
  source_period?: string;
  status: 'draft' | 'approved' | 'posted' | 'cancelled';
  total_debit: number;
  total_credit: number;
  lines_count?: number;
  created_at: string;
  journal_entry_lines?: JournalEntryLine[];
}

interface JournalEntryLine {
  id: string;
  account_code: string;
  account_name: string;
  line_number: number;
  debit_amount: number;
  credit_amount: number;
  line_description?: string;
  reference?: string;
  cost_center?: string;
}

interface Statistics {
  total_entries: number;
  total_debit: number;
  total_credit: number;
  entries_by_type: Record<string, number>;
  entries_by_status: Record<string, number>;
  monthly_trend: Array<{
    month: string;
    entries: number;
    total_amount: number;
  }>;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showGenerators, setShowGenerators] = useState(false);

  // Cargar asientos del libro diario
  const loadEntries = useCallback(async (page = 1, append = false) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        include_lines: 'false'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'all') params.append('entry_type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`/api/accounting/journal?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        const newEntries = result.data.entries || [];
        setEntries(prev => append ? [...prev, ...newEntries] : newEntries);
        setStatistics(result.data.statistics);
        setHasMore(result.data.pagination.has_more);
        
        if (!append) {
          setCurrentPage(1);
        }
      } else {
        console.error('Error cargando asientos:', result.error);
      }
    } catch (error) {
      console.error('Error cargando libro diario:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, selectedStatus, dateFrom, dateTo]);

  // Cargar más asientos (paginación)
  const loadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadEntries(nextPage, true);
  };

  // Generar asientos automáticos desde F29
  const generateFromF29 = async () => {
    try {
      console.log('🤖 Iniciando generación desde F29...');
      // TODO: Modal para seleccionar F29 específico
      // Por ahora usar ejemplo hardcodeado
      
      const response = await fetch('/api/accounting/journal/generate-from-f29', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          f29_id: 'demo-f29-id', // TODO: obtener de selección
          entry_date: new Date().toISOString().split('T')[0],
          auto_approve: false
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ ${result.data.summary.entries_generated} asientos generados desde F29`);
        loadEntries(); // Recargar lista
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generando desde F29:', error);
      alert('Error generando asientos desde F29');
    }
  };

  // Generar asientos de depreciación
  const generateDepreciation = async () => {
    try {
      console.log('🏭 Iniciando generación de depreciación...');
      
      const currentPeriod = new Date().toISOString().substring(0, 7).replace('-', ''); // YYYYMM
      
      const response = await fetch('/api/accounting/journal/generate-from-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: currentPeriod,
          entry_date: new Date().toISOString().split('T')[0],
          auto_approve: false
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ ${result.data.summary.entries_generated} asientos de depreciación generados`);
        loadEntries(); // Recargar lista
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generando depreciación:', error);
      alert('Error generando asientos de depreciación');
    }
  };

  // Exportar libro diario
  const exportJournal = async (format = 'csv', detailed = true) => {
    try {
      const params = new URLSearchParams({
        format,
        include_details: detailed.toString()
      });

      if (selectedType !== 'all') params.append('entry_type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`/api/accounting/journal/export?${params.toString()}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `libro_diario_${detailed ? 'detallado' : 'resumen'}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error exportando libro diario');
      }
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error exportando libro diario');
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Utilidades de formato
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'posted': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'f29': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'fixed_asset': return <Settings className="w-4 h-4 text-purple-600" />;
      case 'rcv': return <BarChart3 className="w-4 h-4 text-green-600" />;
      case 'automatic': return <Zap className="w-4 h-4 text-yellow-600" />;
      default: return <Edit2 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      draft: 'Borrador',
      approved: 'Aprobado',
      posted: 'Contabilizado',
      cancelled: 'Anulado'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getTypeText = (type: string) => {
    const typeMap = {
      manual: 'Manual',
      f29: 'F29',
      rcv: 'RCV',
      fixed_asset: 'Activo Fijo',
      automatic: 'Automático'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000" />
      </div>

      <Header 
        title="Libro Diario"
        subtitle="Registro cronológico de todos los asientos contables con integración automática"
        showBackButton={true}
        backHref="/accounting"
        variant="premium"
        actions={
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 rounded-full text-xs font-medium text-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Integración Automática • F29 • RCV • Activos</span>
            </div>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setShowGenerators(!showGenerators)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Generar Automático
            </Button>
          </div>
        }
      />

      <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 space-y-8">
        
        {/* Estadísticas principales */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Asientos</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total_entries}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Debe</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(statistics.total_debit)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Haber</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(statistics.total_credit)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <ArrowDownRight className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-2 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Balance</p>
                    <p className={`text-2xl font-bold ${
                      Math.abs(statistics.total_debit - statistics.total_credit) < 0.01 
                        ? 'text-green-900' 
                        : 'text-red-900'
                    }`}>
                      {Math.abs(statistics.total_debit - statistics.total_credit) < 0.01 
                        ? '✓ Balanceado' 
                        : 'Desbalanceado'
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Panel de generadores automáticos */}
        {showGenerators && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-green-600" />
                <span>Generadores Automáticos</span>
              </CardTitle>
              <CardDescription>
                Genera asientos contables automáticamente desde otros módulos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={generateFromF29}
                  className="p-6 h-auto flex-col space-y-2 border-blue-200 hover:bg-blue-50"
                >
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="text-center">
                    <p className="font-semibold">Desde F29</p>
                    <p className="text-xs text-gray-600">IVA, Ventas, PPM</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={generateDepreciation}
                  className="p-6 h-auto flex-col space-y-2 border-purple-200 hover:bg-purple-50"
                >
                  <Settings className="w-8 h-8 text-purple-600" />
                  <div className="text-center">
                    <p className="font-semibold">Depreciación</p>
                    <p className="text-xs text-gray-600">Activos Fijos</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  disabled
                  className="p-6 h-auto flex-col space-y-2 border-gray-200 opacity-50"
                >
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                  <div className="text-center">
                    <p className="font-semibold">Desde RCV</p>
                    <p className="text-xs text-gray-600">Próximamente</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controles y filtros */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Búsqueda */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por descripción, referencia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtros rápidos */}
              <div className="flex items-center space-x-3">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="manual">Manual</option>
                  <option value="f29">F29</option>
                  <option value="fixed_asset">Activo Fijo</option>
                  <option value="rcv">RCV</option>
                  <option value="automatic">Automático</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="draft">Borrador</option>
                  <option value="approved">Aprobado</option>
                  <option value="posted">Contabilizado</option>
                  <option value="cancelled">Anulado</option>
                </select>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtros</span>
                </Button>
              </div>

              {/* Acciones */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => exportJournal('csv', true)}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => loadEntries()}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </Button>

                <Button
                  variant="primary"
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Asiento</span>
                </Button>
              </div>
            </div>

            {/* Filtros avanzados */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha desde
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha hasta
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                        setSearchTerm('');
                        setSelectedType('all');
                        setSelectedStatus('all');
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabla de asientos */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-200">
          <CardHeader>
            <CardTitle>Asientos Contables</CardTitle>
            <CardDescription>
              {entries.length} asientos encontrados
              {(selectedType !== 'all' || selectedStatus !== 'all' || dateFrom || dateTo || searchTerm) && 
                ' (con filtros aplicados)'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && entries.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                <span>Cargando asientos...</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay asientos contables
                </h3>
                <p className="text-gray-600 mb-6">
                  Comienza creando tu primer asiento manual o genera automáticamente desde F29
                </p>
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primer Asiento
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(entry.entry_type)}
                          <span className="font-semibold text-gray-900">
                            #{entry.entry_number}
                          </span>
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-900">{entry.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{formatDate(entry.entry_date)}</span>
                            {entry.reference && <span>Ref: {entry.reference}</span>}
                            <span>{getTypeText(entry.entry_type)}</span>
                            {entry.source_period && <span>Período: {entry.source_period}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Debe</p>
                          <p className="font-semibold text-green-900">
                            {formatCurrency(entry.total_debit)}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Haber</p>
                          <p className="font-semibold text-purple-900">
                            {formatCurrency(entry.total_credit)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          {getStatusIcon(entry.status)}
                          <span className="text-sm font-medium">
                            {getStatusText(entry.status)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {entry.status === 'draft' && (
                            <>
                              <Button variant="ghost" size="sm">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Cargar más */}
                {hasMore && (
                  <div className="text-center py-6">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={loading}
                      className="px-8"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Cargando...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Cargar Más Asientos
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">⚡</span>
              <span>Acciones Rápidas</span>
            </CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones más utilizadas del libro diario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => exportJournal('csv', true)}
                className="border-green-200 hover:bg-green-50 hover:border-green-300 group"
              >
                <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Exportar Detallado
              </Button>
              
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => exportJournal('csv', false)}
                className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 group"
              >
                <FileText className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Exportar Resumen
              </Button>
              
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => window.open('/accounting/f29-analysis', '_blank')}
                className="border-purple-200 hover:bg-purple-50 hover:border-purple-300 group"
              >
                <TrendingUp className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Análisis F29
              </Button>
              
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => window.location.href = '/accounting'}
                className="border-orange-200 hover:bg-orange-50 hover:border-orange-300 group"
              >
                <CheckCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Volver a Contabilidad
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}