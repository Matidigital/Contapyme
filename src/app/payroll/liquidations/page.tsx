'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PayrollHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Calculator, Plus, FileText, Users, TrendingUp, Calendar, Filter, Search, Download } from 'lucide-react';

interface LiquidationSummary {
  id: string;
  employee_name: string;
  employee_rut: string;
  period_year: number;
  period_month: number;
  net_salary: number;
  total_gross_income: number;
  total_deductions: number;
  status: string;
  created_at: string;
}

interface LiquidationStats {
  total_liquidations: number;
  current_month_total: number;
  pending_count: number;
  approved_count: number;
}

export default function LiquidationsPage() {
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

  const COMPANY_ID = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

  useEffect(() => {
    fetchLiquidations();
  }, []);

  const fetchLiquidations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payroll/liquidations?company_id=${COMPANY_ID}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setLiquidations(data.data || []);
        calculateStats(data.data || []);
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
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PayrollHeader 
          title="Liquidaciones de Sueldo"
          subtitle="Cargando liquidaciones..."
          showBackButton
        />
        <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
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
    <div className="min-h-screen bg-gray-50">
      <PayrollHeader 
        title="Liquidaciones de Sueldo"
        subtitle="Gestión y seguimiento de liquidaciones"
        showBackButton
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Lote
            </Button>
            <Link href="/payroll/liquidations/generate">
              <Button variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Liquidación
              </Button>
            </Link>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center text-red-700">
                <FileText className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Liquidaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_liquidations}</p>
                  <p className="text-xs text-gray-500 mt-1">Históricas</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mes Actual</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.current_month_total)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total pagado</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending_count}</p>
                  <p className="text-xs text-gray-500 mt-1">Por aprobar</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approved_count}</p>
                  <p className="text-xs text-gray-500 mt-1">Listas para pago</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o RUT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los períodos</option>
                <option value="2025-01">Enero 2025</option>
                <option value="2024-12">Diciembre 2024</option>
                <option value="2024-11">Noviembre 2024</option>
                <option value="2024-10">Octubre 2024</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="approved">Aprobada</option>
                <option value="paid">Pagada</option>
              </select>

              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liquidations List */}
        {filteredLiquidations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {liquidations.length === 0 ? 'No hay liquidaciones registradas' : 'No se encontraron liquidaciones'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {liquidations.length === 0 
                    ? 'Comience generando su primera liquidación de sueldo'
                    : 'Intente ajustar los filtros de búsqueda'
                  }
                </p>
                <Link href="/payroll/liquidations/generate">
                  <Button variant="primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Generar Primera Liquidación
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLiquidations.map((liquidation) => (
              <Card key={liquidation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {liquidation.employee_name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>RUT: {liquidation.employee_rut}</span>
                          <span>•</span>
                          <span>{formatPeriod(liquidation.period_year, liquidation.period_month)}</span>
                          <span>•</span>
                          <span>Líquido: {formatCurrency(liquidation.net_salary)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Total Haberes</div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(liquidation.total_gross_income)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Descuentos</div>
                        <div className="font-medium text-red-600">
                          {formatCurrency(liquidation.total_deductions)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        {getStatusBadge(liquidation.status)}
                        
                        <div className="flex space-x-2">
                          <Link href={`/payroll/liquidations/${liquidation.id}`}>
                            <Button variant="primary" size="sm">
                              Ver Liquidación
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Herramientas para gestión de liquidaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/payroll/liquidations/generate">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="flex items-center">
                      <Calculator className="h-8 w-8 text-blue-600 mr-4" />
                      <div className="text-left">
                        <div className="font-medium">Generar Liquidación</div>
                        <div className="text-sm text-gray-500">Crear nueva liquidación individual</div>
                      </div>
                    </div>
                  </Button>
                </Link>
                
                <Button variant="outline" className="w-full justify-start h-auto p-4" disabled>
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600 mr-4" />
                    <div className="text-left">
                      <div className="font-medium">Lote Masivo</div>
                      <div className="text-sm text-gray-500">Generar múltiples liquidaciones</div>
                    </div>
                  </div>
                </Button>
                
                <Link href="/payroll/settings">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-purple-600 mr-4" />
                      <div className="text-left">
                        <div className="font-medium">Configuración</div>
                        <div className="text-sm text-gray-500">AFP, Salud, Topes e Indicadores</div>
                      </div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}