'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MinimalHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Users, FileText, Clock, Calendar, BarChart3, Plus, ChevronRight, Settings, FileSpreadsheet } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      <MinimalHeader variant="premium" />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg">
            <div className="px-6 py-8 text-white">
              <h1 className="text-3xl font-bold mb-2">Módulo de Remuneraciones</h1>
              <p className="text-blue-100">Gestiona empleados, contratos y nóminas</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-0">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vista General
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'employees'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Empleados
              </button>
              <button
                onClick={() => setActiveTab('contracts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contracts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contratos
              </button>
              <button
                onClick={() => setActiveTab('libro-remuneraciones')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'libro-remuneraciones'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Libro de Remuneraciones
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {loadingStats ? (
                            <span className="animate-pulse bg-gray-200 rounded w-8 h-8 inline-block"></span>
                          ) : (
                            stats.totalEmployees
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {!loadingStats && stats.totalEmployees > 0 && 'Activos en el sistema'}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contratos Activos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {loadingStats ? (
                            <span className="animate-pulse bg-gray-200 rounded w-8 h-8 inline-block"></span>
                          ) : (
                            stats.activeContracts
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {!loadingStats && stats.activeContracts > 0 && 'Contratos vigentes'}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Nómina Mensual</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {loadingStats ? (
                            <span className="animate-pulse bg-gray-200 rounded w-20 h-8 inline-block"></span>
                          ) : (
                            formatCurrency(stats.monthlyPayroll)
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {!loadingStats && stats.monthlyPayroll > 0 && 'Sueldos base totales'}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Próximos Vencimientos</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {loadingStats ? (
                            <span className="animate-pulse bg-gray-200 rounded w-8 h-8 inline-block"></span>
                          ) : (
                            stats.upcomingEvents
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Próximamente</p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                  <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/payroll/employees/new">
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Empleado
                      </Button>
                    </Link>
                    <Link href="/payroll/contracts/new">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Nuevo Contrato
                      </Button>
                    </Link>
                    <Link href="/payroll/libro-remuneraciones">
                      <Button variant="outline" className="w-full justify-start">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Libro de Remuneraciones
                      </Button>
                    </Link>
                    <Link href="/payroll/settings">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Configuración Previsional
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'employees' && (
            <div>
              {/* Header Actions */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Gestión de Empleados</h2>
                <div className="flex space-x-3">
                  <Link href="/payroll/employees">
                    <Button variant="outline">
                      <Users className="w-4 h-4 mr-2" />
                      Ver Todos los Empleados
                    </Button>
                  </Link>
                  <Link href="/payroll/employees/new">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Empleado
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Redirect Card */}
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Lista Completa de Empleados</h3>
                  <p className="text-gray-600 mb-6">
                    Ve la lista completa de empleados con detalles, búsquedas y filtros avanzados
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Link href="/payroll/employees">
                      <Button variant="primary" size="lg">
                        <Users className="w-5 h-5 mr-2" />
                        Ir a Lista de Empleados
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/payroll/employees/new">
                      <Button variant="outline" size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Crear Nuevo Empleado
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div>
              {/* Header Actions */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Gestión de Contratos</h2>
                <Link href="/payroll/contracts/new">
                  <Button variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Contrato
                  </Button>
                </Link>
              </div>

              {/* Empty State */}
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay contratos registrados</h3>
                  <p className="text-gray-600 mb-6">Los contratos aparecerán aquí una vez que agregues empleados</p>
                  <Link href="/payroll/employees/new">
                    <Button variant="outline">
                      <Users className="w-4 h-4 mr-2" />
                      Ir a Empleados
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'libro-remuneraciones' && (
            <div>
              {/* Header Actions */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Libro de Remuneraciones</h2>
                <div className="flex space-x-3">
                  <Link href="/payroll/libro-remuneraciones">
                    <Button variant="outline">
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Ver Libros Generados
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Libro de Remuneraciones Content */}
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión de Libros de Remuneraciones</h3>
                  <p className="text-gray-600 mb-6">
                    Genera y gestiona libros de remuneraciones electrónicos. Incluye exportación CSV para Previred y formato FUDE UMAG.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Link href="/payroll/libro-remuneraciones">
                      <Button variant="primary" size="lg">
                        <FileSpreadsheet className="w-5 h-5 mr-2" />
                        Gestionar Libros
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Quick Info */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">📊 Exportación CSV</h4>
                      <p className="text-sm text-blue-700">Compatible con sistemas contables y formato FUDE UMAG</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">💾 Archivo Previred</h4>
                      <p className="text-sm text-green-700">Genera archivos TXT con formato específico para Previred</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Coming Soon Features */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Próximas Funcionalidades</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Liquidaciones */}
              <Card variant="bordered">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="p-2 bg-green-100 rounded-lg mr-4">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <Link href="/payroll/liquidations">
                        <h4 className="font-semibold text-gray-900 mb-1 hover:text-green-600 cursor-pointer">
                          Liquidaciones de Sueldo
                        </h4>
                      </Link>
                      <p className="text-sm text-gray-600">Cálculo automático con configuración previsional chilena</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600 mt-2">
                        ✅ Disponible
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Asistencia */}
              <Card variant="bordered">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="p-2 bg-purple-100 rounded-lg mr-4">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Control de Asistencia</h4>
                      <p className="text-sm text-gray-600">Registro de entrada/salida y control de horas trabajadas</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mt-2">
                        Próximamente
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reportes */}
              <Card variant="bordered">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                      <FileText className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Reportes Previsionales</h4>
                      <p className="text-sm text-gray-600">Libro de remuneraciones y declaraciones automáticas</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mt-2">
                        Próximamente
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}