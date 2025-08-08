'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { LivePayrollPreview } from '@/components/payroll/LivePayrollPreview';
import { useLivePayrollCalculation } from '@/hooks/useLivePayrollCalculation';
import { 
  Calculator, 
  Users, 
  FileText, 
  Download, 
  Save, 
  Eye,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp
} from 'lucide-react';
import { EmployeeData } from '@/lib/services/payrollCalculator';

interface Employee {
  id: string;
  rut: string;
  first_name: string;
  last_name: string;
  family_allowances: number;
  afp_code: string;
  health_institution_code: string;
  employment_contracts: Array<{
    position: string;
    base_salary: number;
    contract_type: string;
  }>;
}

export default function GenerateLiquidationPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const COMPANY_ID = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

  const [formData, setFormData] = useState({
    period_year: new Date().getFullYear(),
    period_month: new Date().getMonth() + 1,
    days_worked: 30,
    worked_hours: 0,
    overtime_hours: 0,
    
    // Haberes adicionales
    bonuses: 0,
    commissions: 0,
    gratification: 0,
    overtime_amount: 0,
    food_allowance: 0,
    transport_allowance: 0,
    
    // Descuentos adicionales
    loan_deductions: 0,
    advance_payments: 0,
    apv_amount: 0,
    other_deductions: 0
  });

  // Obtener empleado seleccionado
  const selectedEmployee = useMemo(() => {
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp || !emp.employment_contracts?.[0]) return null;

    const contract = emp.employment_contracts[0];
    return {
      id: emp.id,
      rut: emp.rut,
      first_name: emp.first_name,
      last_name: emp.last_name,
      base_salary: contract.base_salary,
      contract_type: contract.contract_type as 'indefinido' | 'plazo_fijo' | 'obra_faena',
      afp_code: emp.afp_code || 'MODELO',
      health_institution_code: emp.health_institution_code || 'FONASA',
      family_allowances: emp.family_allowances || 0
    } as EmployeeData;
  }, [employees, selectedEmployeeId]);

  // Datos para el cálculo en tiempo real
  const calculationData = useMemo(() => ({
    employee: selectedEmployee,
    period: {
      year: formData.period_year,
      month: formData.period_month,
      days_worked: formData.days_worked,
      worked_hours: formData.worked_hours,
      overtime_hours: formData.overtime_hours
    },
    additionalIncome: {
      bonuses: formData.bonuses,
      commissions: formData.commissions,
      gratification: formData.gratification,
      overtime_amount: formData.overtime_amount,
      food_allowance: formData.food_allowance,
      transport_allowance: formData.transport_allowance
    },
    additionalDeductions: {
      loan_deductions: formData.loan_deductions,
      advance_payments: formData.advance_payments,
      apv_amount: formData.apv_amount,
      other_deductions: formData.other_deductions
    }
  }), [selectedEmployee, formData]);

  // Hook de cálculo en tiempo real con configuración dinámica
  const { result, isCalculating, errors, warnings, isValid, configurationStatus } = useLivePayrollCalculation(calculationData);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payroll/employees?company_id=${COMPANY_ID}`);
      const data = await response.json();

      if (response.ok && data.success) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSaveAndGenerate = async () => {
    if (!result || !selectedEmployee) return;

    setSaving(true);
    try {
      // Mapear los datos de la liquidación al formato de la base de datos
      const liquidationData = {
        employee_id: selectedEmployeeId,
        period_year: formData.period_year,
        period_month: formData.period_month,
        days_worked: formData.days_worked,
        
        // Haberes
        base_salary: result.base_salary || 0,
        overtime_amount: result.overtime_amount || 0,
        bonuses: result.bonuses || 0,
        commissions: result.commissions || 0,
        gratification: result.gratification || 0,
        food_allowance: result.food_allowance || 0,
        transport_allowance: result.transport_allowance || 0,
        family_allowance: result.family_allowance || 0,
        
        // Descuentos legales
        afp_discount: (result.afp_amount || 0) + (result.afp_commission_amount || 0),
        health_discount: result.health_amount || 0,
        unemployment_discount: result.unemployment_amount || 0,
        
        // Descuentos adicionales
        loan_deductions: formData.loan_deductions || 0,
        advance_payments: formData.advance_payments || 0,
        apv_amount: formData.apv_amount || 0,
        other_deductions: formData.other_deductions || 0,
        
        // Totales
        total_haberes: result.total_gross_income || 0,
        total_descuentos: result.total_deductions || 0,
        net_salary: result.net_salary || 0
      };

      // Guardar en la base de datos usando la nueva API
      const response = await fetch(`/api/payroll/liquidations/save?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(liquidationData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirigir a la vista de liquidaciones o mostrar éxito
        router.push(`/payroll/liquidations`);
      } else {
        setError(data.error || 'Error al guardar liquidación');
      }
    } catch (err) {
      setError('Error al guardar liquidación');
      console.error('Error saving liquidation:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!result || !selectedEmployee) return;

    setExporting(true);
    try {
      // Preparar los datos para la exportación
      const exportData = {
        employee_id: selectedEmployeeId,
        employee_name: `${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
        employee_rut: selectedEmployee.rut,
        period_year: formData.period_year,
        period_month: formData.period_month,
        days_worked: formData.days_worked,
        calculation_result: result
      };

      // Llamar a la API de exportación
      const response = await fetch(`/api/payroll/liquidations/export?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Crear un blob con el contenido HTML y abrir en nueva ventana para imprimir
        const htmlContent = data.html;
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          
          // Esperar a que se cargue el contenido y luego mostrar diálogo de impresión
          setTimeout(() => {
            newWindow.print();
          }, 1000);
        }
      } else {
        setError(data.error || 'Error al exportar liquidación');
      }
    } catch (err) {
      setError('Error al exportar liquidación');
      console.error('Error exporting liquidation:', err);
    } finally {
      setExporting(false);
    }
  };

  const getEmployeeDisplayName = (employee: Employee) => {
    return `${employee.first_name} ${employee.last_name} (${employee.rut})`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header 
          title="Generar Liquidación"
          subtitle="Creación de liquidaciones con previsualización en tiempo real"
          showBackButton={true}
          backHref="/payroll/liquidations"
        />
        <div className="max-w-7xl mx-auto py-8 px-4 flex justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando empleados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header 
        title="Generar Liquidación"
        subtitle="Creación de liquidaciones con previsualización en tiempo real"
        showBackButton={true}
        backHref="/payroll/liquidations"
        actions={
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 rounded-full text-xs font-medium text-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Cálculo en Tiempo Real • Normativa 2025</span>
            </div>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto py-8 px-4">
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <FileText className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel izquierdo - Formulario */}
          <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Datos del Empleado
                </CardTitle>
                <CardDescription>
                  Seleccione el empleado y configure los parámetros de la liquidación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empleado *
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar empleado...</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {getEmployeeDisplayName(employee)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Año
                    </label>
                    <input
                      type="number"
                      name="period_year"
                      value={formData.period_year}
                      onChange={handleInputChange}
                      min="2020"
                      max="2030"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mes
                    </label>
                    <select
                      name="period_month"
                      value={formData.period_month}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleDateString('es-CL', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días Trabajados
                  </label>
                  <input
                    type="number"
                    name="days_worked"
                    value={formData.days_worked}
                    onChange={handleInputChange}
                    min="1"
                    max="31"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Haberes adicionales */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Haberes Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bonos
                    </label>
                    <input
                      type="number"
                      name="bonuses"
                      value={formData.bonuses}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comisiones
                    </label>
                    <input
                      type="number"
                      name="commissions"
                      value={formData.commissions}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horas Extras ($)
                    </label>
                    <input
                      type="number"
                      name="overtime_amount"
                      value={formData.overtime_amount}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gratificación
                    </label>
                    <input
                      type="number"
                      name="gratification"
                      value={formData.gratification}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Colación
                    </label>
                    <input
                      type="number"
                      name="food_allowance"
                      value={formData.food_allowance}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Movilización
                    </label>
                    <input
                      type="number"
                      name="transport_allowance"
                      value={formData.transport_allowance}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descuentos adicionales */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-red-600" />
                  Descuentos Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Préstamos
                    </label>
                    <input
                      type="number"
                      name="loan_deductions"
                      value={formData.loan_deductions}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anticipos
                    </label>
                    <input
                      type="number"
                      name="advance_payments"
                      value={formData.advance_payments}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      APV
                    </label>
                    <input
                      type="number"
                      name="apv_amount"
                      value={formData.apv_amount}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Otros
                    </label>
                    <input
                      type="number"
                      name="other_deductions"
                      value={formData.other_deductions}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button
                onClick={handleSaveAndGenerate}
                disabled={!isValid || saving}
                loading={saving}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Generando...' : 'Generar y Guardar'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={!isValid || exporting}
                loading={exporting}
                className="border-blue-300 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {/* Panel derecho - Previsualización */}
          <div className="lg:sticky lg:top-8">
            <LivePayrollPreview
              result={result}
              isCalculating={isCalculating}
              errors={errors}
              warnings={warnings}
              isValid={isValid}
              configurationStatus={configurationStatus} // ✅ NUEVO: Estado de configuración
              employeeName={selectedEmployee ? getEmployeeDisplayName({
                ...selectedEmployee,
                employment_contracts: []
              } as Employee) : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}