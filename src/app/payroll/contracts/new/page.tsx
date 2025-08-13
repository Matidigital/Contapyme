'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PayrollHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { 
  ArrowLeft, Save, FileText, User, Calendar, DollarSign, 
  Clock, MapPin, AlertCircle, Plus, Search 
} from 'lucide-react';
import { useCompanyId } from '@/contexts/CompanyContext';

interface Employee {
  id: string;
  rut: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  position?: string;
  status: string;
}

interface ContractTemplate {
  id: string;
  template_name: string;
  template_type: string;
  position_category: string;
  job_functions: string[];
  obligations: string[];
  prohibitions: string[];
  standard_bonuses: any[];
  standard_allowances: any;
}

export default function NewContractPage() {
  const router = useRouter();
  const companyId = useCompanyId();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Datos del formulario
  const [formData, setFormData] = useState({
    position: '',
    department: '',
    contract_type: 'indefinido',
    start_date: '',
    end_date: '',
    base_salary: '',
    gratification_amount: '',
    weekly_hours: '45',
    workplace_address: '',
    schedule_entry: '09:00',
    schedule_exit: '18:00',
    lunch_start: '13:00',
    lunch_end: '14:00',
    bonuses: [] as any[],
    allowances: {
      meal: '',
      transport: '',
      cash: ''
    }
  });

  // Cargar empleados activos sin contrato
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`/api/payroll/employees?company_id=${companyId}&status=active`);
        const data = await response.json();
        if (data.success) {
          setEmployees(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    if (companyId) {
      fetchEmployees();
    }
  }, [companyId]);

  // Manejar cambio de empleado
  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    const employee = employees.find(e => e.id === employeeId);
    if (employee && employee.position) {
      setFormData(prev => ({ ...prev, position: employee.position || '' }));
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validaciones básicas
      const newErrors: Record<string, string> = {};
      if (!selectedEmployee) newErrors.employee = 'Selecciona un empleado';
      if (!formData.position) newErrors.position = 'El cargo es requerido';
      if (!formData.start_date) newErrors.start_date = 'La fecha de inicio es requerida';
      if (!formData.base_salary) newErrors.base_salary = 'El sueldo base es requerido';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Calcular gratificación legal si no se especificó
      const calculatedGratification = formData.gratification_amount || 
        Math.min(Number(formData.base_salary) * 0.25, 2512750);

      // Preparar datos del contrato
      const contractData = {
        employee_id: selectedEmployee,
        company_id: companyId,
        template_id: selectedTemplate || undefined,
        contract_type: formData.contract_type,
        position: formData.position,
        department: formData.department,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        base_salary: Number(formData.base_salary),
        gratification_amount: calculatedGratification,
        weekly_hours: Number(formData.weekly_hours),
        workplace_address: formData.workplace_address,
        schedule_details: {
          entry: formData.schedule_entry,
          exit: formData.schedule_exit,
          lunch_start: formData.lunch_start,
          lunch_end: formData.lunch_end,
          days: 'Lunes a Sábado'
        },
        bonuses: formData.bonuses,
        allowances: {
          meal: Number(formData.allowances.meal) || 0,
          transport: Number(formData.allowances.transport) || 0,
          cash: Number(formData.allowances.cash) || 0
        }
      };

      // Crear el contrato
      const response = await fetch('/api/payroll/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el contrato');
      }

      // Redirigir al contrato creado
      router.push(`/payroll/contracts/${result.data.id}`);

    } catch (error) {
      console.error('Error creating contract:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PayrollHeader 
        title="Nuevo Contrato"
        subtitle="Crear un contrato laboral"
        showBackButton
      />

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Selección de empleado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Seleccionar Empleado
                </CardTitle>
                <CardDescription>
                  Elige el empleado para quien se creará el contrato
                </CardDescription>
              </CardHeader>
              <CardContent>
                {employees.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay empleados disponibles
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Necesitas tener empleados registrados para crear contratos
                    </p>
                    <Link href="/payroll/employees/new">
                      <Button variant="primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Empleado
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecciona un empleado...</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.middle_name} {employee.last_name} - {employee.rut}
                        </option>
                      ))}
                    </select>
                    {errors.employee && (
                      <p className="text-red-600 text-sm mt-1">{errors.employee}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedEmployee && (
              <>
                {/* Información del cargo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                      Información del Cargo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cargo *
                        </label>
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="Ej: Vendedor, Contador, Gerente"
                        />
                        {errors.position && (
                          <p className="text-red-600 text-sm mt-1">{errors.position}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Departamento
                        </label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="Ej: Ventas, Administración"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Contrato *
                        </label>
                        <select
                          value={formData.contract_type}
                          onChange={(e) => setFormData(prev => ({ ...prev, contract_type: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="indefinido">Indefinido</option>
                          <option value="plazo_fijo">Plazo Fijo</option>
                          <option value="por_obra">Por Obra</option>
                          <option value="part_time">Part Time</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Horas Semanales
                        </label>
                        <input
                          type="number"
                          value={formData.weekly_hours}
                          onChange={(e) => setFormData(prev => ({ ...prev, weekly_hours: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="48"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fechas y salario */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                      Fechas y Remuneración
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Inicio *
                        </label>
                        <input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.start_date && (
                          <p className="text-red-600 text-sm mt-1">{errors.start_date}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Término
                        </label>
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          disabled={formData.contract_type === 'indefinido'}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sueldo Base *
                        </label>
                        <input
                          type="number"
                          value={formData.base_salary}
                          onChange={(e) => setFormData(prev => ({ ...prev, base_salary: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                          min="0"
                        />
                        {errors.base_salary && (
                          <p className="text-red-600 text-sm mt-1">{errors.base_salary}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gratificación Legal (opcional)
                        </label>
                        <input
                          type="number"
                          value={formData.gratification_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, gratification_amount: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="Se calculará automáticamente (25%)"
                          min="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Asignaciones */}
                <Card>
                  <CardHeader>
                    <CardTitle>Asignaciones No Imponibles</CardTitle>
                    <CardDescription>
                      Beneficios adicionales que no afectan las cotizaciones previsionales
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Colación
                        </label>
                        <input
                          type="number"
                          value={formData.allowances.meal}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            allowances: { ...prev.allowances, meal: e.target.value }
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Movilización
                        </label>
                        <input
                          type="number"
                          value={formData.allowances.transport}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            allowances: { ...prev.allowances, transport: e.target.value }
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Asignación de Caja
                        </label>
                        <input
                          type="number"
                          value={formData.allowances.cash}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            allowances: { ...prev.allowances, cash: e.target.value }
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Error general */}
                {errors.general && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>{errors.general}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Botones */}
                <div className="flex justify-end space-x-4">
                  <Link href="/payroll/contracts">
                    <Button variant="outline" disabled={loading}>
                      Cancelar
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={loading}
                    className="flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Crear Contrato
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}