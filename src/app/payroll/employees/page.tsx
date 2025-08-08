'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PayrollHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Plus, Users, Search, Filter } from 'lucide-react';

interface Employee {
  id: string;
  rut: string;
  first_name: string;
  last_name: string;
  email: string;
  position?: string;
  status: string;
  employment_contracts?: Array<{
    position: string;
    base_salary: number;
    status: string;
  }>;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const COMPANY_ID = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payroll/employees?company_id=${COMPANY_ID}`);
      const data = await response.json();

      if (response.ok) {
        setEmployees(data.data || []);
      } else {
        setError(data.error || 'Error al cargar empleados');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PayrollHeader 
          title="Empleados"
          subtitle="Gestión de empleados y contratos"
          showBackButton
        />
        <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando empleados...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PayrollHeader 
        title="Empleados"
        subtitle="Gestión de empleados y contratos"
        showBackButton
      />

      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white rounded-lg border px-3 py-2">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar empleados..."
                  className="border-none outline-none text-sm"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
            
            <Link href="/payroll/employees/new">
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Empleado
              </Button>
            </Link>
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center text-red-700">
                  <Users className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employees List */}
          {employees.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay empleados registrados
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Comienza agregando tu primer empleado al sistema
                  </p>
                  <Link href="/payroll/employees/new">
                    <Button variant="primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Primer Empleado
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {employees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>RUT: {employee.rut}</span>
                            {employee.employment_contracts && employee.employment_contracts.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{employee.employment_contracts[0].position}</span>
                                <span>•</span>
                                <span>{formatCurrency(employee.employment_contracts[0].base_salary)}</span>
                              </>
                            )}
                          </div>
                          {employee.email && (
                            <p className="text-sm text-gray-500">{employee.email}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          employee.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                        
                        <div className="flex space-x-2">
                          <Link href={`/payroll/employees/${employee.id}`}>
                            <Button variant="outline" size="sm">
                              Ver
                            </Button>
                          </Link>
                          <Link href={`/payroll/employees/${employee.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats Summary */}
          {employees.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {employees.length}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Empleados
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {employees.filter(e => e.status === 'active').length}
                    </div>
                    <div className="text-sm text-gray-500">
                      Empleados Activos
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {employees.filter(e => e.employment_contracts && e.employment_contracts.length > 0).length}
                    </div>
                    <div className="text-sm text-gray-500">
                      Con Contratos
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}