'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowLeft, Save, User, Briefcase, Settings } from 'lucide-react';
import { RutInputFixed } from '@/components/payroll/RutInputFixed';

interface Employee {
  id: string;
  rut: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  hire_date?: string;
  status: string;
  employment_contracts?: Array<{
    id: string;
    position: string;
    base_salary: number;
    status: string;
    start_date: string;
    end_date?: string;
    contract_type: string;
  }>;
  payroll_config?: {
    id: string;
    afp_code: string;
    health_institution_code: string;
    family_allowances: number;
  };
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personal');

  const COMPANY_ID = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    rut: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    hire_date: '',
    status: 'active',
    contract: {
      position: '',
      base_salary: '',
      contract_type: 'indefinido',
      start_date: '',
      end_date: ''
    },
    payroll_config: {
      afp_code: 'HABITAT',
      health_institution_code: 'FONASA',
      family_allowances: 0
    }
  });

  useEffect(() => {
    if (params.id) {
      fetchEmployee(params.id as string);
    }
  }, [params.id]);

  const fetchEmployee = async (employeeId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payroll/employees/${employeeId}?company_id=${COMPANY_ID}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const emp = data.data;
        setEmployee(emp);
        
        const activeContract = emp.employment_contracts?.find((contract: any) => contract.status === 'active');
        
        setFormData({
          first_name: emp.first_name || '',
          last_name: emp.last_name || '',
          rut: emp.rut || '',
          email: emp.email || '',
          phone: emp.phone || '',
          address: emp.address || '',
          birth_date: emp.birth_date || '',
          hire_date: emp.hire_date || '',
          status: emp.status || 'active',
          contract: {
            position: activeContract?.position || '',
            base_salary: activeContract?.base_salary?.toString() || '',
            contract_type: activeContract?.contract_type || 'indefinido',
            start_date: activeContract?.start_date || '',
            end_date: activeContract?.end_date || ''
          },
          payroll_config: {
            afp_code: emp.payroll_config?.afp_code || 'HABITAT',
            health_institution_code: emp.payroll_config?.health_institution_code || 'FONASA',
            family_allowances: emp.payroll_config?.family_allowances || 0
          }
        });
      } else {
        setError(data.error || 'Error al cargar empleado');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching employee:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contract.')) {
      const contractField = name.replace('contract.', '');
      setFormData(prev => ({
        ...prev,
        contract: {
          ...prev.contract,
          [contractField]: value
        }
      }));
    } else if (name.startsWith('payroll_config.')) {
      const payrollField = name.replace('payroll_config.', '');
      setFormData(prev => ({
        ...prev,
        payroll_config: {
          ...prev.payroll_config,
          [payrollField]: payrollField === 'family_allowances' ? parseInt(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleRutChange = (rut: string) => {
    setFormData(prev => ({ ...prev, rut }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.rut) {
      setError('Nombre, apellido y RUT son obligatorios');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        contract: {
          ...formData.contract,
          base_salary: parseInt(formData.contract.base_salary) || 0
        }
      };

      const response = await fetch(`/api/payroll/employees/${params.id}?company_id=${COMPANY_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push(`/payroll/employees/${params.id}`);
      } else {
        setError(data.error || 'Error al actualizar empleado');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error updating employee:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Cargando..."
          subtitle="Obteniendo información del empleado"
          showBackButton
        />
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando empleado...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Error"
          subtitle="No se pudo cargar el empleado"
          showBackButton
        />
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <User className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  {error}
                </h3>
                <Link href="/payroll/employees">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a Lista de Empleados
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={`Editar: ${formData.first_name} ${formData.last_name}`}
        subtitle="Actualizar información del empleado"
        showBackButton
        actions={
          <div className="flex space-x-2">
            <Link href={`/payroll/employees/${params.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </Link>
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleSubmit}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center text-red-700">
                <User className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'personal'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Información Personal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('contract')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contract'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Briefcase className="h-4 w-4 inline mr-2" />
                Contrato
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payroll')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payroll'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Configuración Previsional
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'personal' && (
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Datos personales del empleado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUT *
                    </label>
                    <RutInputFixed
                      value={formData.rut}
                      onChange={handleRutChange}
                      placeholder="12.345.678-9"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Contratación
                    </label>
                    <input
                      type="date"
                      name="hire_date"
                      value={formData.hire_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'contract' && (
            <Card>
              <CardHeader>
                <CardTitle>Información del Contrato</CardTitle>
                <CardDescription>Detalles laborales y salariales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo
                    </label>
                    <input
                      type="text"
                      name="contract.position"
                      value={formData.contract.position}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sueldo Base (CLP)
                    </label>
                    <input
                      type="number"
                      name="contract.base_salary"
                      value={formData.contract.base_salary}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Contrato
                    </label>
                    <select
                      name="contract.contract_type"
                      value={formData.contract.contract_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="indefinido">Indefinido</option>
                      <option value="plazo_fijo">Plazo Fijo</option>
                      <option value="obra_faena">Por Obra o Faena</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      name="contract.start_date"
                      value={formData.contract.start_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {formData.contract.contract_type !== 'indefinido' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Término
                      </label>
                      <input
                        type="date"
                        name="contract.end_date"
                        value={formData.contract.end_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'payroll' && (
            <Card>
              <CardHeader>
                <CardTitle>Configuración Previsional</CardTitle>
                <CardDescription>AFP, Salud y Cargas Familiares</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AFP
                    </label>
                    <select
                      name="payroll_config.afp_code"
                      value={formData.payroll_config.afp_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CAPITAL">AFP Capital</option>
                      <option value="CUPRUM">AFP Cuprum</option>
                      <option value="HABITAT">AFP Hábitat</option>
                      <option value="PLANVITAL">AFP PlanVital</option>
                      <option value="PROVIDA">AFP ProVida</option>
                      <option value="MODELO">AFP Modelo</option>
                      <option value="UNO">AFP Uno</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institución de Salud
                    </label>
                    <select
                      name="payroll_config.health_institution_code"
                      value={formData.payroll_config.health_institution_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FONASA">FONASA</option>
                      <option value="BANMEDICA">Banmédica</option>
                      <option value="CONSALUD">Consalud</option>
                      <option value="CRUZ_BLANCA">Cruz Blanca</option>
                      <option value="VIDA_TRES">Vida Tres</option>
                      <option value="COLMENA">Colmena Golden Cross</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Cargas Familiares
                    </label>
                    <input
                      type="number"
                      name="payroll_config.family_allowances"
                      value={formData.payroll_config.family_allowances}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex justify-end space-x-4">
            <Link href={`/payroll/employees/${params.id}`}>
              <Button variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              variant="primary"
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}