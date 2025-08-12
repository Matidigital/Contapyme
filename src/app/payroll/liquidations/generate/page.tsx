'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PayrollHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { LivePayrollPreview } from '@/modules/remuneraciones/components/liquidaciones/LivePayrollPreview';
import { useLivePayrollCalculation } from '@/modules/remuneraciones/hooks/useCalculadora';
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
    cash_allowance: 0,
    
    // Descuentos adicionales
    loan_deductions: 0,
    advance_payments: 0,
    apv_amount: 0,
    other_deductions: 0,
    
    // ✅ NUEVO: Control de gratificación Art. 50
    apply_legal_gratification: false
  });

  // Obtener empleado seleccionado
  const selectedEmployee = useMemo(() => {
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp || !emp.employment_contracts?.[0]) return null;

    const contract = emp.employment_contracts[0];
    const payrollConfig = emp.payroll_config; // ✅ ARREGLADO: Es objeto directo, no array
    
    // ✅ DEBUG: Verificar estructura de datos del empleado
    console.log(`🔍 DEBUG EMPLEADO - Empleado completo:`, emp);
    console.log(`🔍 DEBUG EMPLEADO - payroll_config encontrado:`, payrollConfig);
    console.log(`🔍 DEBUG EMPLEADO - afp_code será:`, payrollConfig?.afp_code || 'MODELO');
    
    return {
      id: emp.id,
      rut: emp.rut,
      first_name: emp.first_name,
      last_name: emp.last_name,
      base_salary: contract.base_salary,
      contract_type: contract.contract_type as 'indefinido' | 'plazo_fijo' | 'obra_faena',
      afp_code: payrollConfig?.afp_code || 'MODELO', // ✅ CORREGIDO: Desde payroll_config
      health_institution_code: payrollConfig?.health_institution_code || 'FONASA', // ✅ CORREGIDO
      family_allowances: payrollConfig?.family_allowances || 0, // ✅ CORREGIDO
      // ✅ NUEVO: Override dinámico - usa checkbox del formulario si está marcado
      legal_gratification_type: formData.apply_legal_gratification ? 'article_50' : 'none',
      // Guardar el tipo original para referencia
      _original_gratification_type: payrollConfig?.legal_gratification_type || 'none'
    } as EmployeeData;
  }, [employees, selectedEmployeeId, formData.apply_legal_gratification]);

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
      transport_allowance: formData.transport_allowance,
      cash_allowance: formData.cash_allowance
    },
    additionalDeductions: {
      loan_deductions: formData.loan_deductions,
      advance_payments: formData.advance_payments,
      apv_amount: formData.apv_amount,
      other_deductions: formData.other_deductions
    }
  }), [selectedEmployee, formData]);

  // Hook de cálculo en tiempo real con configuración dinámica
  const { result: hookResult, isCalculating, errors, warnings, isValid, configurationStatus } = useLivePayrollCalculation(calculationData);
  
  // Usar resultado directo de la calculadora (ya maneja gratificación correctamente)
  const result = hookResult;

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ✅ Auto-marcar checkbox si empleado tiene gratificación configurada
  useEffect(() => {
    if (selectedEmployeeId && employees.length > 0) {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      const hasGratificationConfigured = emp?.payroll_config?.legal_gratification_type === 'article_50';
      
      // Solo auto-marcar si no se ha interactuado manualmente con el checkbox
      setFormData(prev => ({
        ...prev,
        apply_legal_gratification: hasGratificationConfigured
      }));
    }
  }, [selectedEmployeeId, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payroll/employees?company_id=${COMPANY_ID}`);
      const data = await response.json();

      // ✅ DEBUG: Verificar respuesta completa de la API
      console.log('🔍 DEBUG API - Respuesta completa:', data);
      console.log('🔍 DEBUG API - Primer empleado:', data.data?.[0]);
      console.log('🔍 DEBUG API - payroll_config del primer empleado:', data.data?.[0]?.payroll_config);

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

  // ✅ VALIDACIÓN DE FECHAS: No permitir períodos futuros
  const validatePeriod = (year: number, month: number): { isValid: boolean; message?: string } => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (year > currentYear) {
      return { isValid: false, message: `No se pueden crear liquidaciones para el año ${year} (futuro)` };
    }
    
    if (year === currentYear && month > currentMonth) {
      return { isValid: false, message: `No se pueden crear liquidaciones para ${month}/${year} (mes futuro)` };
    }
    
    return { isValid: true };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const { checked } = e.target as HTMLInputElement;
    
    const newValue = type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value);
    
    // ✅ VALIDACIÓN DE FECHAS AL CAMBIAR PERÍODO
    if (name === 'period_year' || name === 'period_month') {
      const updatedFormData = { ...formData, [name]: newValue };
      const validation = validatePeriod(
        updatedFormData.period_year, 
        updatedFormData.period_month
      );
      
      if (!validation.isValid) {
        setError(validation.message || 'Período inválido');
        setTimeout(() => setError(null), 5000);
        return; // No actualizar si es inválido
      } else {
        setError(null); // Limpiar error si ahora es válido
      }
    }
    
    // ✅ LOGGING TEMPORAL PARA DEBUGGING
    if (name === 'apply_legal_gratification') {
      console.log('🔍 CHECKBOX GRATIFICACIÓN CAMBIADO:');
      console.log('  - Checked:', checked);
      console.log('  - Type:', type);
      console.log('  - New value:', newValue);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSaveAndGenerate = async () => {
    if (!result || !selectedEmployee) return;

    // ✅ VALIDACIÓN FINAL DE PERÍODO ANTES DE GUARDAR
    const periodValidation = validatePeriod(formData.period_year, formData.period_month);
    if (!periodValidation.isValid) {
      setError(periodValidation.message || 'No se puede guardar liquidación para período futuro');
      return;
    }

    setSaving(true);
    try {
      console.log('🔍 SAVE LIQUIDATION - USANDO RESULTADOS DEL HOOK:');
      console.log('  - apply_legal_gratification:', formData.apply_legal_gratification);
      console.log('  - result.legal_gratification_art50:', result.legal_gratification_art50);
      console.log('  - result.total_gross_income:', result.total_gross_income);
      console.log('  - result.total_taxable_income:', result.total_taxable_income);
      console.log('  - result.net_salary:', result.net_salary);

      // Mapear los datos de la liquidación al formato de la base de datos
      const liquidationData = {
        employee_id: selectedEmployeeId,
        period_year: formData.period_year,
        period_month: formData.period_month,
        days_worked: formData.days_worked,
        
        // Haberes imponibles
        base_salary: result.base_salary || 0,
        overtime_amount: result.overtime_amount || 0,
        bonuses: result.bonuses || 0,
        commissions: result.commissions || 0,
        gratification: result.gratification || 0,
        total_taxable_income: result.total_taxable_income || 0,
        
        // Haberes no imponibles
        food_allowance: result.food_allowance || 0,
        transport_allowance: result.transport_allowance || 0,
        family_allowance: result.family_allowance || 0,
        other_allowances: 0,
        total_non_taxable_income: result.total_non_taxable_income || 0,
        
        // ✅ GRATIFICACIÓN DEL RESULTADO DEL HOOK
        legal_gratification_art50: result.legal_gratification_art50 || 0,
        
        // Descuentos previsionales (campos separados como espera la DB)
        afp_percentage: result.afp_percentage || 10.0,
        afp_commission_percentage: result.afp_commission_percentage || 0.58,
        afp_amount: result.afp_amount || 0,
        afp_commission_amount: result.afp_commission_amount || 0,
        sis_amount: result.employer_costs?.sis_amount || 0,
        
        health_percentage: result.health_percentage || 7.0,
        health_amount: result.health_amount || 0,
        
        unemployment_percentage: result.unemployment_percentage || 0.6,
        unemployment_amount: result.unemployment_amount || 0,
        
        // Impuestos
        income_tax_amount: result.income_tax_amount || 0,
        
        // Otros descuentos
        loan_deductions: formData.loan_deductions || 0,
        advance_payments: formData.advance_payments || 0,
        apv_amount: formData.apv_amount || 0,
        other_deductions: formData.other_deductions || 0,
        total_other_deductions: result.total_other_deductions || 0,
        
        // ✅ TOTALES DEL RESULTADO DEL HOOK (SIN MODIFICACIONES MANUALES)
        total_gross_income: result.total_gross_income || 0,
        total_deductions: result.total_deductions || 0,
        net_salary: result.net_salary || 0,
        
        // Configuración usada (snapshot)
        calculation_config: result.calculation_config || {}
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
        console.log('✅ Liquidación guardada exitosamente:', data);
        // Redirigir a la vista de liquidaciones con mensaje de éxito
        router.push(`/payroll/liquidations?saved=true`);
      } else {
        console.error('❌ Error al guardar liquidación:', data);
        setError(data.error || `Error al guardar liquidación: ${data.details || 'Error desconocido'}`);
      }
    } catch (err) {
      setError('Error al guardar liquidación');
      console.error('Error saving liquidation:', err);
    } finally {
      setSaving(false);
    }
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

  const getEmployeeDisplayName = (employee: Employee) => {
    const firstName = cleanText(employee.first_name);
    const lastName = cleanText(employee.last_name);
    return `${firstName} ${lastName} (${employee.rut})`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <PayrollHeader 
          title="Generar Liquidación"
          subtitle="Creación de liquidaciones con previsualización en tiempo real"
          showBackButton={true}
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
      <PayrollHeader 
        title="Generar Liquidación"
        subtitle="Creación de liquidaciones con previsualización en tiempo real"
        showBackButton={true}
      />

      {/* Hero Section modernizado */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Nueva Liquidación
              </h1>
              <p className="text-blue-100 text-sm sm:text-base mb-6">
                Genera liquidaciones con cálculo automático en tiempo real según normativa chilena 2025
              </p>
              
              {/* Indicador de cálculo en tiempo real */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs font-medium">Cálculo en Tiempo Real</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 flex items-center gap-2">
                  <Calculator className="w-3 h-3" />
                  <span className="text-xs font-medium">Normativa 2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/80 transition-all duration-200">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Datos del Empleado
                </h3>
                <p className="text-gray-600 text-sm">
                  Seleccione el empleado y configure los parámetros de la liquidación
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empleado *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 appearance-none"
                    >
                      <option value="">Seleccionar empleado...</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {getEmployeeDisplayName(employee)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mes
                    </label>
                    <div className="relative">
                      <select
                        name="period_month"
                        value={formData.period_month}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 appearance-none"
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleDateString('es-CL', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
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
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Haberes adicionales */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/80 transition-all duration-200">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Haberes Adicionales
                </h3>
                <p className="text-gray-600 text-sm">
                  Configure bonos, comisiones y otros ingresos adicionales
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200"
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
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200"
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
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bono por metas
                  </label>
                  <input
                    type="number"
                    name="gratification"
                    value={formData.gratification}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200"
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
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200"
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
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignación de Caja
                  </label>
                  <input
                    type="number"
                    name="cash_allowance"
                    value={formData.cash_allowance}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Gratificación Legal Art. 50 */}
            {selectedEmployee && (
              <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/50 hover:from-purple-100/80 hover:to-blue-100/80 transition-all duration-200">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m-2.599-8.598a5.978 5.978 0 00.001 10.598M15.399 8.598a5.978 5.978 0 01-.001 10.598" />
                    </svg>
                    Gratificación Legal Art. 50
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Gratificación legal del 25% del sueldo base con tope de 4.75 sueldos mínimos ÷ 12
                  </p>
                </div>

                <div className="bg-white/60 rounded-xl p-4 border border-purple-200/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">Aplicar a esta Liquidación</h4>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            name="apply_legal_gratification"
                            checked={formData.apply_legal_gratification}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-purple-600 bg-white border-2 border-purple-300 rounded focus:ring-purple-500 focus:ring-2 transition-all duration-200"
                          />
                          {formData.apply_legal_gratification && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            Aplicar Gratificación Art. 50 (25%)
                          </span>
                          <p className="text-xs text-gray-500">
                            {selectedEmployee._original_gratification_type === 'article_50' 
                              ? 'Este empleado tiene gratificación configurada por defecto'
                              : 'Gratificación temporal solo para esta liquidación'
                            }
                          </p>
                        </div>
                      </label>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      formData.apply_legal_gratification
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {formData.apply_legal_gratification ? 'APLICAR' : 'NO APLICAR'}
                    </div>
                  </div>

                  {formData.apply_legal_gratification && result && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-sm text-purple-600 font-medium">Gratificación Calculada</div>
                        <div className="text-lg font-bold text-purple-900">
                          {new Intl.NumberFormat('es-CL', { 
                            style: 'currency', 
                            currency: 'CLP',
                            minimumFractionDigits: 0 
                          }).format(result.legal_gratification_art50 || 0)}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-sm text-blue-600 font-medium">Base de Cálculo</div>
                        <div className="text-lg font-bold text-blue-900">
                          25% de {new Intl.NumberFormat('es-CL', { 
                            style: 'currency', 
                            currency: 'CLP',
                            minimumFractionDigits: 0 
                          }).format(selectedEmployee.base_salary)}
                        </div>
                      </div>
                    </div>
                  )}

                  {!formData.apply_legal_gratification && (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm mb-3">
                        La gratificación Art. 50 no se aplicará a esta liquidación.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-sm">
                          💡 Puedes marcar el checkbox arriba para aplicar la gratificación legal (25% del sueldo base con tope legal).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Descuentos adicionales */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/80 transition-all duration-200">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-red-600" />
                  Descuentos Adicionales
                </h3>
                <p className="text-gray-600 text-sm">
                  Configure préstamos, anticipos y otros descuentos
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200"
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
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200"
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
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200"
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
                    placeholder="0"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Botón de acción principal */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 space-y-4">
              <button
                onClick={handleSaveAndGenerate}
                disabled={!isValid || saving}
                className={`w-full group relative px-6 py-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-3 ${
                  !isValid || saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Generar y Guardar Liquidación</span>
                  </>
                )}
              </button>
              
              <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-1">Después de guardar</div>
                    <p className="text-blue-700">Podrás ver, imprimir y descargar la liquidación en PDF desde la lista de liquidaciones.</p>
                  </div>
                </div>
              </div>
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