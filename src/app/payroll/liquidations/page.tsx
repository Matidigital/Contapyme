'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PayrollHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Calculator, Plus, FileText, Users, TrendingUp, Calendar, Filter, Search, Download, Eye, DollarSign, ArrowRight, Activity } from 'lucide-react';

interface LiquidationSummary {
  id: string;
  employee_name: string;
  employee_rut: string;
  period_year: number;
  period_month: number;
  days_worked: number;
  base_salary: number;
  legal_gratification_art50: number;
  bonuses: number;
  overtime_amount: number;
  net_salary: number;
  total_gross_income: number;
  total_deductions: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LiquidationStats {
  total_liquidations: number;
  current_month_total: number;
  pending_count: number;
  approved_count: number;
}

export default function LiquidationsPage() {
  const searchParams = useSearchParams();
  const [liquidations, setLiquidations] = useState<LiquidationSummary[]>([]);
  const [stats, setStats] = useState<LiquidationStats>({
    total_liquidations: 0,
    current_month_total: 0,
    pending_count: 0,
    approved_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRut, setFilterRut] = useState('');
  const [availableRuts, setAvailableRuts] = useState<string[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const COMPANY_ID = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

  useEffect(() => {
    fetchLiquidations();
    
    // ✅ REFRESH AUTOMÁTICO: Detectar si se guardó una liquidación
    const saved = searchParams?.get('saved');
    if (saved === 'true') {
      setSavedMessage('✅ Liquidación guardada exitosamente');
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setSavedMessage(null), 5000);
    }
  }, [searchParams]);

  const fetchLiquidations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/payroll/liquidations?company_id=${COMPANY_ID}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success) {
        // Deduplicar liquidaciones: mantener solo la más reciente por RUT
        const liquidationsMap = new Map<string, LiquidationSummary>();
        
        // Ordenar por fecha (más reciente primero)
        const sortedLiquidations = (data.data || []).sort((a: LiquidationSummary, b: LiquidationSummary) => {
          // Primero comparar por año y mes
          const periodA = a.period_year * 100 + a.period_month;
          const periodB = b.period_year * 100 + b.period_month;
          if (periodA !== periodB) return periodB - periodA;
          
          // Si el período es el mismo, comparar por fecha de actualización
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
        
        // Mantener solo la liquidación más reciente por RUT
        sortedLiquidations.forEach((liquidation: LiquidationSummary) => {
          const key = liquidation.employee_rut;
          // Solo procesar si tiene RUT válido
          if (key && !liquidationsMap.has(key)) {
            liquidationsMap.set(key, liquidation);
          }
        });
        
        const deduplicatedLiquidations = Array.from(liquidationsMap.values());
        
        // Extraer RUTs y períodos únicos para los filtros
        const uniqueRuts = [...new Set(sortedLiquidations
          .filter((l: LiquidationSummary) => l.employee_rut)
          .map((l: LiquidationSummary) => l.employee_rut))];
        const uniquePeriods = [...new Set(sortedLiquidations.map((l: LiquidationSummary) => 
          `${l.period_year}-${l.period_month.toString().padStart(2, '0')}`
        ))].sort().reverse();
        
        setAvailableRuts(uniqueRuts);
        setAvailablePeriods(uniquePeriods);
        setLiquidations(deduplicatedLiquidations);
        calculateStats(deduplicatedLiquidations);
      } else {
        setError(data.error || 'Error al cargar liquidaciones');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching liquidations:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (liquidationsData: LiquidationSummary[]) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const currentMonthLiquidations = liquidationsData.filter(
      liq => liq.period_month === currentMonth && liq.period_year === currentYear
    );

    const currentMonthTotal = currentMonthLiquidations.reduce(
      (sum, liq) => sum + liq.net_salary, 0
    );

    const pendingCount = liquidationsData.filter(liq => liq.status === 'draft').length;
    const approvedCount = liquidationsData.filter(liq => liq.status === 'approved').length;

    setStats({
      total_liquidations: liquidationsData.length,
      current_month_total: currentMonthTotal,
      pending_count: pendingCount,
      approved_count: approvedCount
    });
  };

  // Función para limpiar caracteres especiales malformados
  const cleanText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã±/g, 'ñ')
      .replace(/Ã/g, 'Á')
      .replace(/Ã/g, 'É')
      .replace(/Ã/g, 'Í')
      .replace(/Ã/g, 'Ó')
      .replace(/Ã/g, 'Ú')
      .replace(/Ã/g, 'Ñ')
      .replace(/�/g, 'é')
      .trim();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPeriod = (year: number, month: number) => {
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', class: 'bg-gray-100 text-gray-800' },
      approved: { label: 'Aprobada', class: 'bg-green-100 text-green-800' },
      paid: { label: 'Pagada', class: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const filteredLiquidations = liquidations.filter(liquidation => {
    const matchesSearch = searchTerm === '' || 
      liquidation.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      liquidation.employee_rut.includes(searchTerm);
    
    const matchesStatus = filterStatus === '' || liquidation.status === filterStatus;
    
    const matchesPeriod = filterPeriod === '' || 
      `${liquidation.period_year}-${liquidation.period_month.toString().padStart(2, '0')}` === filterPeriod;
    
    const matchesRut = filterRut === '' || liquidation.employee_rut === filterRut;
    
    return matchesSearch && matchesStatus && matchesPeriod && matchesRut;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <PayrollHeader 
          title="Liquidaciones de Sueldo"
          subtitle="Cargando liquidaciones..."
          showBackButton
        />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando liquidaciones...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <PayrollHeader 
        title="Liquidaciones de Sueldo"
        subtitle="Gestión y seguimiento de liquidaciones"
        showBackButton
      />

      {/* Hero Section con métricas destacadas */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Título y acciones principales */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Panel de Liquidaciones
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Gestión completa de liquidaciones de sueldo para tu empresa
              </p>
            </div>
            
            {/* Acciones principales - responsive */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button className="group relative px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 text-white font-medium">
                <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Exportar Lote</span>
              </button>
              <Link href="/payroll/liquidations/generate">
                <button className="w-full sm:w-auto group relative px-4 py-2.5 rounded-xl bg-green-500/80 hover:bg-green-500 border border-green-400/50 hover:border-green-400 backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 text-white font-medium">
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Nueva Liquidación</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Stats Cards mejoradas para mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-bold truncate">{stats.total_liquidations}</div>
                  <div className="text-xs text-blue-100 truncate">Total Liquidaciones</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg sm:text-xl font-bold truncate">
                    {formatCurrency(stats.current_month_total).replace('$', '$').slice(0, 8)}
                    {formatCurrency(stats.current_month_total).length > 8 && '...'}
                  </div>
                  <div className="text-xs text-green-100 truncate">Mes Actual</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-yellow-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-bold truncate">{stats.pending_count}</div>
                  <div className="text-xs text-yellow-100 truncate">Pendientes</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-bold truncate">{stats.approved_count}</div>
                  <div className="text-xs text-purple-100 truncate">Aprobadas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* ✅ MENSAJE DE ÉXITO AL GUARDAR LIQUIDACIÓN */}
        {savedMessage && (
          <div className="mb-6 bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-green-800 font-medium">{savedMessage}</p>
              <p className="text-green-700 text-sm">La liquidación aparecerá en la lista a continuación</p>
            </div>
          </div>
        )}

        {/* ✅ BOTÓN GENERAR LIBRO DE REMUNERACIONES */}
        <div className="mb-6 bg-purple-50/80 backdrop-blur-sm border border-purple-200 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">Libro de Remuneraciones</h3>
              <p className="text-purple-700 text-sm">Después de validar las liquidaciones del mes, genera el libro oficial</p>
            </div>
            <Link href="/payroll/libro-remuneraciones">
              <button className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 transform hover:scale-105">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Generar Libro</span>
              </button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200">
            <div className="flex items-center text-red-700">
              <FileText className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Filtros modernos y responsivos */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 mb-6">
          <div className="flex flex-col gap-4">
            {/* Búsqueda principal */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            
            {/* Filtros en fila para desktop, columnas para mobile */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Todos los períodos</option>
                {availablePeriods.map(period => {
                  const [year, month] = period.split('-');
                  const monthNames = [
                    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                  ];
                  return (
                    <option key={period} value={period}>
                      {monthNames[parseInt(month) - 1]} {year}
                    </option>
                  );
                })}
              </select>

              <select
                value={filterRut}
                onChange={(e) => setFilterRut(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Todos los empleados</option>
                {availableRuts.map(rut => {
                  const employee = liquidations.find(l => l.employee_rut === rut);
                  return (
                    <option key={rut} value={rut}>
                      {employee ? `${cleanText(employee.employee_name)} - ${rut}` : rut}
                    </option>
                  );
                })}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="approved">Aprobada</option>
                <option value="paid">Pagada</option>
              </select>

              <button 
                onClick={() => {
                  setFilterPeriod('');
                  setFilterRut('');
                  setFilterStatus('');
                  setSearchTerm('');
                }}
                className="sm:w-auto px-4 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-blue-200 hover:border-blue-300 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-blue-700 font-medium">
                <Filter className="h-4 w-4" />
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de liquidaciones modernizada */}
        {filteredLiquidations.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-white/20 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calculator className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {liquidations.length === 0 ? 'No hay liquidaciones registradas' : 'No se encontraron liquidaciones'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {liquidations.length === 0 
                ? 'Comience generando su primera liquidación de sueldo para gestionar los pagos de su equipo'
                : 'Intente ajustar los filtros de búsqueda para encontrar las liquidaciones que busca'
              }
            </p>
            <Link href="/payroll/liquidations/generate">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105">
                <Plus className="h-4 w-4" />
                Generar Primera Liquidación
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLiquidations.map((liquidation) => (
              <div key={liquidation.id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/80 transition-all duration-200 group">
                {/* Vista mobile-first */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Info principal del empleado */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {cleanText(liquidation.employee_name)}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600">
                        <span className="truncate">RUT: {liquidation.employee_rut}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{formatPeriod(liquidation.period_year, liquidation.period_month)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Métricas y acciones */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    {/* Métricas financieras - responsive */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 sm:flex sm:gap-4 gap-3">
                      <div className="text-center sm:text-right">
                        <div className="text-xs text-gray-500 mb-1">Sueldo Base</div>
                        <div className="font-bold text-gray-700 text-sm sm:text-base truncate">
                          {formatCurrency(liquidation.base_salary)}
                        </div>
                      </div>
                      {liquidation.legal_gratification_art50 > 0 && (
                        <div className="text-center sm:text-right">
                          <div className="text-xs text-gray-500 mb-1">Grat. Art.50</div>
                          <div className="font-bold text-purple-600 text-sm sm:text-base truncate">
                            {formatCurrency(liquidation.legal_gratification_art50)}
                          </div>
                        </div>
                      )}
                      <div className="text-center sm:text-right">
                        <div className="text-xs text-gray-500 mb-1">Total Haberes</div>
                        <div className="font-bold text-green-600 text-sm sm:text-base truncate">
                          {formatCurrency(liquidation.total_gross_income)}
                        </div>
                      </div>
                      <div className="text-center sm:text-right">
                        <div className="text-xs text-gray-500 mb-1">Descuentos</div>
                        <div className="font-bold text-red-600 text-sm sm:text-base truncate">
                          {formatCurrency(liquidation.total_deductions)}
                        </div>
                      </div>
                      <div className="text-center sm:text-right col-span-2 sm:col-span-1">
                        <div className="text-xs text-gray-500 mb-1">Líquido a Pagar</div>
                        <div className="font-bold text-blue-600 text-base sm:text-lg">
                          {formatCurrency(liquidation.net_salary)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Status y acciones */}
                    <div className="flex flex-col sm:items-end gap-3">
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        {getStatusBadge(liquidation.status)}
                      </div>
                      
                      <Link href={`/payroll/liquidations/${liquidation.id}`} className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto group/btn relative px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                          <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          <span>Ver Liquidación</span>
                          <ArrowRight className="w-3 h-3 opacity-50 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Acciones Rápidas modernizadas */}
        <div className="mt-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Acciones Rápidas</h3>
              <p className="text-gray-600">Herramientas esenciales para gestión eficiente de liquidaciones</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/payroll/liquidations/generate" className="group">
                <div className="p-6 bg-gradient-to-br from-blue-50/80 to-blue-100/80 rounded-xl border border-blue-200/50 hover:border-blue-300 transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Calculator className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">Generar Liquidación</h4>
                      <p className="text-sm text-gray-600">Crear nueva liquidación individual con cálculos automáticos</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <div className="group opacity-60">
                <div className="p-6 bg-gradient-to-br from-green-50/80 to-green-100/80 rounded-xl border border-green-200/50 transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">Lote Masivo</h4>
                      <p className="text-sm text-gray-600">Generar múltiples liquidaciones simultáneamente</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs text-gray-500 rounded-full">Próximamente</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Link href="/payroll/settings" className="group">
                <div className="p-6 bg-gradient-to-br from-purple-50/80 to-purple-100/80 rounded-xl border border-purple-200/50 hover:border-purple-300 transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">Configuración</h4>
                      <p className="text-sm text-gray-600">AFP, Salud, Topes e Indicadores del sistema</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}