'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MinimalHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Users, FileText, Clock, Calendar, BarChart3, Plus, ChevronRight, Settings, FileSpreadsheet, DollarSign, Activity, TrendingUp, ArrowRight, Database } from 'lucide-react';

interface PayrollStats {
  totalEmployees: number;
  activeContracts: number;
  monthlyPayroll: number;
  upcomingEvents: number;
}

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<PayrollStats>({
    totalEmployees: 0,
    activeContracts: 0,
    monthlyPayroll: 0,
    upcomingEvents: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const COMPANY_ID = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch(`/api/payroll/employees?company_id=${COMPANY_ID}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const employees = data.data || [];
        const activeContracts = employees.reduce((count: number, emp: any) => {
          return count + (emp.employment_contracts?.filter((contract: any) => contract.status === 'active').length || 0);
        }, 0);
        
        const monthlyPayroll = employees.reduce((total: number, emp: any) => {
          const activeContract = emp.employment_contracts?.find((contract: any) => contract.status === 'active');
          return total + (activeContract?.base_salary || 0);
        }, 0);

        setStats({
          totalEmployees: employees.length,
          activeContracts: activeContracts,
          monthlyPayroll: monthlyPayroll,
          upcomingEvents: 0 // Por ahora 0, futuro desarrollo
        });
      }
    } catch (error) {
      console.error('Error fetching payroll stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <MinimalHeader variant="premium" />

      {/* Hero Section modernizado */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                Módulo de Remuneraciones
              </h1>
              <p className="text-blue-100 text-lg mb-6">
                Centro de control integral para gestión de empleados, contratos y nóminas
              </p>
              
              {/* Quick stats en hero */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold">
                    {loadingStats ? (
                      <div className="animate-pulse bg-white/20 rounded h-6 w-8"></div>
                    ) : (
                      stats.totalEmployees
                    )}
                  </div>
                  <div className="text-xs text-blue-100">Empleados</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold">
                    {loadingStats ? (
                      <div className="animate-pulse bg-white/20 rounded h-6 w-8"></div>
                    ) : (
                      stats.activeContracts
                    )}
                  </div>
                  <div className="text-xs text-blue-100">Contratos</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 col-span-2 sm:col-span-2">
                  <div className="text-lg sm:text-xl font-bold truncate">
                    {loadingStats ? (
                      <div className="animate-pulse bg-white/20 rounded h-6 w-24"></div>
                    ) : (
                      formatCurrency(stats.monthlyPayroll).slice(0, 10) + (formatCurrency(stats.monthlyPayroll).length > 10 ? '...' : '')
                    )}
                  </div>
                  <div className="text-xs text-blue-100">Nómina Mensual</div>
                </div>
              </div>
            </div>
            
            {/* Acciones principales en hero */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto lg:w-auto">
              <Link href="/payroll/liquidations">
                <button className="w-full group relative px-6 py-3 rounded-xl bg-green-500/80 hover:bg-green-500 border border-green-400/50 hover:border-green-400 backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 text-white font-medium">
                  <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Ver Liquidaciones</span>
                  <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
              <Link href="/payroll/employees/new">
                <button className="w-full group relative px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 text-white font-medium">
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Nuevo Empleado</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs modernizados y responsive */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 mb-8 border border-white/20">
          <nav className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className="flex items-center gap-2 justify-center sm:justify-start">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Vista General</span>
                <span className="sm:hidden">General</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'employees'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className="flex items-center gap-2 justify-center sm:justify-start">
                <Users className="w-4 h-4" />
                <span>Empleados</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'contracts'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className="flex items-center gap-2 justify-center sm:justify-start">
                <FileText className="w-4 h-4" />
                <span>Contratos</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('libro-remuneraciones')}
              className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'libro-remuneraciones'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className="flex items-center gap-2 justify-center sm:justify-start">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Libro de Remuneraciones</span>
                <span className="sm:hidden">Libros</span>
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
            <>
              {/* Stats Cards modernizadas con efectos glass */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/80 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Total Empleados</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {loadingStats ? (
                          <div className="animate-pulse bg-gray-200/60 rounded-lg w-12 h-8"></div>
                        ) : (
                          stats.totalEmployees
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {!loadingStats && stats.totalEmployees > 0 && 'Activos en el sistema'}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-xl group-hover:from-blue-500/20 group-hover:to-blue-600/30 transition-colors">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/80 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Contratos Activos</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {loadingStats ? (
                          <div className="animate-pulse bg-gray-200/60 rounded-lg w-12 h-8"></div>
                        ) : (
                          stats.activeContracts
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {!loadingStats && stats.activeContracts > 0 && 'Contratos vigentes'}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-xl group-hover:from-green-500/20 group-hover:to-green-600/30 transition-colors">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/80 transition-all duration-200 group sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 mb-2">Nómina Mensual</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                        {loadingStats ? (
                          <div className="animate-pulse bg-gray-200/60 rounded-lg w-24 h-8"></div>
                        ) : (
                          formatCurrency(stats.monthlyPayroll)
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {!loadingStats && stats.monthlyPayroll > 0 && 'Sueldos base totales'}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-xl group-hover:from-purple-500/20 group-hover:to-purple-600/30 transition-colors">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/80 transition-all duration-200 group sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">Próximos Vencimientos</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {loadingStats ? (
                          <div className="animate-pulse bg-gray-200/60 rounded-lg w-12 h-8"></div>
                        ) : (
                          stats.upcomingEvents
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Próximamente</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-yellow-500/10 to-yellow-600/20 rounded-xl group-hover:from-yellow-500/20 group-hover:to-yellow-600/30 transition-colors">
                      <Calendar className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones Rápidas modernizadas */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Acciones Rápidas</h3>
                  <p className="text-gray-600">Accede rápidamente a las funciones más utilizadas del módulo</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link href="/payroll/employees/new" className="group">
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50/80 to-blue-100/80 rounded-xl border border-blue-200/50 hover:border-blue-300 transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <Plus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1">Nuevo Empleado</h4>
                          <p className="text-sm text-gray-600 truncate">Agregar empleado al sistema</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/payroll/liquidations" className="group">
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50/80 to-green-100/80 rounded-xl border border-green-200/50 hover:border-green-300 transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                          <BarChart3 className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1">Liquidaciones</h4>
                          <p className="text-sm text-gray-600 truncate">Gestionar liquidaciones</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/payroll/libro-remuneraciones" className="group">
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50/80 to-purple-100/80 rounded-xl border border-purple-200/50 hover:border-purple-300 transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                          <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1">Libros</h4>
                          <p className="text-sm text-gray-600 truncate">Libro de remuneraciones</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/payroll/generar-datos-demo" className="group">
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-orange-50/80 to-orange-100/80 rounded-xl border border-orange-200/50 hover:border-orange-300 transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                          <Database className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1">
                            Datos Demo
                            <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-medium">NUEVO</span>
                          </h4>
                          <p className="text-sm text-gray-600 truncate">Generar empleados de ejemplo</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/payroll/settings" className="group">
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-yellow-50/80 to-yellow-100/80 rounded-xl border border-yellow-200/50 hover:border-yellow-300 transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                          <Settings className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1">Configuración</h4>
                          <p className="text-sm text-gray-600 truncate">Configurar previsional</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </>
        )}

        {activeTab === 'employees' && (
            <div>
              {/* Header Actions modernizadas */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Empleados</h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Link href="/payroll/employees">
                    <button className="w-full sm:w-auto group relative px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                      <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Ver Todos los Empleados</span>
                    </button>
                  </Link>
                  <Link href="/payroll/employees/new">
                    <button className="w-full sm:w-auto group relative px-4 py-2.5 rounded-xl bg-green-500/80 hover:bg-green-500 border border-green-400/50 hover:border-green-400 backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 text-white font-medium">
                      <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Nuevo Empleado</span>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Redirect Card modernizada */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-white/20 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Users className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Lista Completa de Empleados</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Ve la lista completa de empleados con detalles, búsquedas y filtros avanzados
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/payroll/employees">
                    <button className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105">
                      <Users className="w-5 h-5" />
                      <span>Ir a Lista de Empleados</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href="/payroll/employees/new">
                    <button className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-3 bg-white/80 hover:bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 font-medium rounded-xl transition-all duration-200">
                      <Plus className="w-5 h-5" />
                      <span>Crear Nuevo Empleado</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
        )}

        {activeTab === 'contracts' && (
            <div>
              {/* Header Actions modernizadas */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Contratos</h2>
                <Link href="/payroll/contracts/new">
                  <button className="w-full sm:w-auto group relative px-4 py-2.5 rounded-xl bg-green-500/80 hover:bg-green-500 border border-green-400/50 hover:border-green-400 backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 text-white font-medium">
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Nuevo Contrato</span>
                  </button>
                </Link>
              </div>

              {/* Empty State modernizado */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-white/20 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No hay contratos registrados</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">Los contratos aparecerán aquí una vez que agregues empleados</p>
                <Link href="/payroll/employees/new">
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 hover:bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 font-medium rounded-xl transition-all duration-200">
                    <Users className="w-4 h-4" />
                    <span>Ir a Empleados</span>
                  </button>
                </Link>
              </div>
            </div>
        )}

        {activeTab === 'libro-remuneraciones' && (
            <div>
              {/* Header Actions modernizadas */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Libro de Remuneraciones</h2>
                <Link href="/payroll/libro-remuneraciones">
                  <button className="w-full sm:w-auto group relative px-4 py-2.5 rounded-xl bg-green-500/80 hover:bg-green-500 border border-green-400/50 hover:border-green-400 backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 text-white font-medium">
                    <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Ver Libros Generados</span>
                  </button>
                </Link>
              </div>

              {/* Libro de Remuneraciones Content modernizado */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <FileSpreadsheet className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Gestión de Libros de Remuneraciones</h3>
                  <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                    Genera y gestiona libros de remuneraciones electrónicos. Incluye exportación CSV para Previred y formato FUDE UMAG.
                  </p>
                  <Link href="/payroll/libro-remuneraciones">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105">
                      <FileSpreadsheet className="w-5 h-5" />
                      <span>Gestionar Libros</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
                
                {/* Quick Info modernizada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 p-6 rounded-xl border border-blue-200/50">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        📊
                      </div>
                      Exportación CSV
                    </h4>
                    <p className="text-sm text-blue-700">Compatible con sistemas contables y formato FUDE UMAG</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50/80 to-green-100/80 p-6 rounded-xl border border-green-200/50">
                    <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                        💾
                      </div>
                      Archivo Previred
                    </h4>
                    <p className="text-sm text-green-700">Genera archivos TXT con formato específico para Previred</p>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Próximas Funcionalidades modernizadas */}
        <div className="mt-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Funcionalidades del Módulo</h3>
              <p className="text-gray-600">Herramientas disponibles y próximos desarrollos</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Liquidaciones - Disponible */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/80 transition-all duration-200 group">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-xl group-hover:from-green-500/20 group-hover:to-green-600/30 transition-colors">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <Link href="/payroll/liquidations">
                      <h4 className="font-bold text-gray-900 mb-2 hover:text-green-600 cursor-pointer group-hover:text-green-600 transition-colors">
                        Liquidaciones de Sueldo
                      </h4>
                    </Link>
                    <p className="text-sm text-gray-600 mb-3">Cálculo automático con configuración previsional chilena</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-200">
                      ✅ Disponible
                    </span>
                  </div>
                </div>
              </div>

              {/* Asistencia - Próximamente */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 opacity-75">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/10 to-purple-600/20 rounded-xl">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Control de Asistencia</h4>
                    <p className="text-sm text-gray-600 mb-3">Registro de entrada/salida y control de horas trabajadas</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border border-gray-200">
                      ⏳ Próximamente
                    </span>
                  </div>
                </div>
              </div>

              {/* Reportes - Próximamente */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 opacity-75">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-yellow-500/10 to-yellow-600/20 rounded-xl">
                    <FileText className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Reportes Previsionales</h4>
                    <p className="text-sm text-gray-600 mb-3">Libro de remuneraciones y declaraciones automáticas</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border border-gray-200">
                      ⏳ Próximamente
                    </span>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}