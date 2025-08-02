'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Users, FileText, Clock, Calendar, BarChart3, Plus, ChevronRight } from 'lucide-react';

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Módulo de Remuneraciones"
        subtitle="Gestiona empleados, contratos y nóminas"
        showBackButton
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
                        <p className="text-2xl font-bold text-gray-900">0</p>
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
                        <p className="text-2xl font-bold text-gray-900">0</p>
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
                        <p className="text-2xl font-bold text-gray-900">$0</p>
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
                        <p className="text-2xl font-bold text-gray-900">0</p>
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
                    <Button variant="outline" className="w-full justify-start" disabled>
                      <Clock className="w-4 h-4 mr-2" />
                      Registrar Asistencia
                    </Button>
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
                <Link href="/payroll/employees/new">
                  <Button variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Empleado
                  </Button>
                </Link>
              </div>

              {/* Empty State */}
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay empleados registrados</h3>
                  <p className="text-gray-600 mb-6">Comienza agregando el primer empleado de tu empresa</p>
                  <Link href="/payroll/employees/new">
                    <Button variant="primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Primer Empleado
                    </Button>
                  </Link>
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

          {/* Coming Soon Features */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Próximas Funcionalidades</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Nóminas */}
              <Card variant="bordered">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="p-2 bg-green-100 rounded-lg mr-4">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Cálculo de Nóminas</h4>
                      <p className="text-sm text-gray-600">Liquidaciones automáticas con cálculo de impuestos y cotizaciones</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mt-2">
                        Próximamente
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