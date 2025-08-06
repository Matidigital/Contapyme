'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Calculator, Users, FileText, AlertCircle, CheckCircle, Download, Eye } from 'lucide-react';
import { PayrollCalculator } from '@/lib/services/payrollCalculator';
import { SimpleLiquidationService } from '@/lib/services/simpleLiquidationService';
import { LiquidationPDFTemplate } from '@/components/payroll/LiquidationPDFTemplate';
import { exportToPDF, generatePDFFilename } from '@/lib/services/pdfExport';

interface Employee {
  id: string;
  rut: string;
  first_name: string;
  last_name: string;
  employment_contracts: Array<{
    position: string;
    base_salary: number;
    contract_type: string;
  }>;
}

interface LiquidationData {
  employee: any;
  period: any;
  total_gross_income: number;
  total_deductions: number;
  net_salary: number;
  warnings: string[];
}

export default function GenerateLiquidationPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liquidationResult, setLiquidationResult] = useState<LiquidationData | null>(null);
  const [exporting, setExporting] = useState(false);

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
    other_deductions: 0,
    
    save_liquidation: true
  });

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
      [name]: type === 'number' ? parseFloat(value) || 0 : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const calculateLiquidation = async () => {
    if (!selectedEmployee) {
      setError('Debe seleccionar un empleado');
      return;
    }

    setCalculating(true);
    setError(null);
    setLiquidationResult(null);

    try {
      // Obtener datos del empleado seleccionado
      const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);
      
      if (!selectedEmployeeData || !selectedEmployeeData.employment_contracts?.[0]) {
        setError('Empleado no encontrado o sin contrato');
        return;
      }

      const contract = selectedEmployeeData.employment_contracts[0];

      // Usar servicio SIMPLE - solo cálculos locales
      const payrollConfig = selectedEmployeeData.payroll_config?.[0];
      
      const requestData = {
        employee: {
          id: selectedEmployeeData.id,
          rut: selectedEmployeeData.rut,
          first_name: selectedEmployeeData.first_name,
          last_name: selectedEmployeeData.last_name,
          base_salary: contract.base_salary,
          contract_type: contract.contract_type,
          // Configuración previsional real del empleado
          afp_code: payrollConfig?.afp_code || 'HABITAT',
          health_institution_code: payrollConfig?.health_institution_code || 'FONASA',
          family_allowances: payrollConfig?.family_allowances || 0,
          legal_gratification_type: payrollConfig?.legal_gratification_type || 'none',
          has_unemployment_insurance: payrollConfig?.has_unemployment_insurance !== false
        },
        period: {
          year: formData.period_year,
          month: formData.period_month,
          days_worked: formData.days_worked
        },
        additional_income: {
          bonuses: formData.bonuses,
          commissions: formData.commissions,
          gratification: formData.gratification,
          overtime_amount: formData.overtime_amount,
          food_allowance: formData.food_allowance,
          transport_allowance: formData.transport_allowance
        },
        additional_deductions: {
          loan_deductions: formData.loan_deductions,
          advance_payments: formData.advance_payments,
          apv_amount: formData.apv_amount,
          other_deductions: formData.other_deductions
        }
      };

      console.log('🔄 Calculando con servicio SIMPLE (solo local)...');
      const result = SimpleLiquidationService.calculateLiquidation(requestData);

      if (result.success && result.data) {
        console.log('✅ Liquidación calculada exitosamente (modo simple)');
        setLiquidationResult(result.data.liquidation);
      } else {
        setError(result.error || 'Error al calcular liquidación');
      }
    } catch (err) {
      setError('Error de cálculo');
      console.error('Error calculating liquidation:', err);
    } finally {
      setCalculating(false);
    }
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
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const handleExportPDF = async () => {
    if (!liquidationResult || !selectedEmployee) {
      setError('No hay liquidación para exportar');
      return;
    }

    setExporting(true);
    try {
      const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);
      const employeeName = selectedEmployeeData ? 
        `${selectedEmployeeData.first_name} ${selectedEmployeeData.last_name}` : 
        'Empleado';
      
      const period = formatPeriod(formData.period_year, formData.period_month);
      
      const success = await exportToPDF({
        elementId: 'liquidation-pdf-content',
        employeeName,
        period,
        filename: generatePDFFilename(employeeName, period)
      });

      if (!success) {
        setError('Error al generar PDF');
      }
    } catch (err) {
      setError('Error al exportar PDF');
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Generar Liquidación de Sueldo"
        subtitle="Cálculo automático con configuración previsional"
        showBackButton
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/payroll/liquidations')}>
            <FileText className="h-4 w-4 mr-2" />
            Ver Liquidaciones
          </Button>
        }
      />

      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario de Cálculo */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                  Datos de Liquidación
                </CardTitle>
                <CardDescription>
                  Configure los parámetros para el cálculo automático
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Selección de Empleado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empleado *
                    </label>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="">Seleccionar empleado...</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name} - {employee.rut}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEmployeeData && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-sm">
                        <strong>Cargo:</strong> {selectedEmployeeData.employment_contracts[0]?.position}<br/>
                        <strong>Sueldo Base:</strong> {formatCurrency(selectedEmployeeData.employment_contracts[0]?.base_salary || 0)}<br/>
                        <strong>Tipo Contrato:</strong> {selectedEmployeeData.employment_contracts[0]?.contract_type}
                      </div>
                    </div>
                  )}

                  {/* Período */}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {formatPeriod(2024, i + 1).split(' ')[0]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Días y Horas */}
                  <div className="grid grid-cols-3 gap-4">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horas Normales
                      </label>
                      <input
                        type="number"
                        name="worked_hours"
                        value={formData.worked_hours}
                        onChange={handleInputChange}
                        min="0"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horas Extra
                      </label>
                      <input
                        type="number"
                        name="overtime_hours"
                        value={formData.overtime_hours}
                        onChange={handleInputChange}
                        min="0"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Haberes Adicionales */}
            <Card>
              <CardHeader>
                <CardTitle>Haberes Adicionales</CardTitle>
                <CardDescription>Ingresos extra del período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bonos (CLP)
                    </label>
                    <input
                      type="number"
                      name="bonuses"
                      value={formData.bonuses}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comisiones (CLP)
                    </label>
                    <input
                      type="number"
                      name="commissions"
                      value={formData.commissions}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gratificación (CLP)
                    </label>
                    <input
                      type="number"
                      name="gratification"
                      value={formData.gratification}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor H. Extra (CLP)
                    </label>
                    <input
                      type="number"
                      name="overtime_amount"
                      value={formData.overtime_amount}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Colación (CLP)
                    </label>
                    <input
                      type="number"
                      name="food_allowance"
                      value={formData.food_allowance}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Movilización (CLP)
                    </label>
                    <input
                      type="number"
                      name="transport_allowance"
                      value={formData.transport_allowance}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descuentos Adicionales */}
            <Card>
              <CardHeader>
                <CardTitle>Descuentos Adicionales</CardTitle>
                <CardDescription>Descuentos extra del período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Préstamos (CLP)
                    </label>
                    <input
                      type="number"
                      name="loan_deductions"
                      value={formData.loan_deductions}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Anticipos (CLP)
                    </label>
                    <input
                      type="number"
                      name="advance_payments"
                      value={formData.advance_payments}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      APV (CLP)
                    </label>
                    <input
                      type="number"
                      name="apv_amount"
                      value={formData.apv_amount}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Otros (CLP)
                    </label>
                    <input
                      type="number"
                      name="other_deductions"
                      value={formData.other_deductions}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="save_liquidation"
                      checked={formData.save_liquidation}
                      onChange={handleInputChange}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Guardar liquidación en el sistema
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Botón de Cálculo */}
            <div className="text-center">
              <Button 
                variant="primary" 
                size="lg"
                onClick={calculateLiquidation}
                disabled={calculating || !selectedEmployee}
              >
                <Calculator className="h-5 w-5 mr-2" />
                {calculating ? 'Calculando...' : 'Calcular Liquidación'}
              </Button>
            </div>
          </div>

          {/* Resultado de Liquidación */}
          <div>
            {liquidationResult ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Liquidación Calculada
                  </CardTitle>
                  <CardDescription>
                    {liquidationResult.employee.first_name} {liquidationResult.employee.last_name} - 
                    {formatPeriod(liquidationResult.period.year, liquidationResult.period.month)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Resumen Principal */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="text-center">
                          <div className="text-sm text-green-600 font-medium">SUELDO LÍQUIDO</div>
                          <div className="text-2xl font-bold text-green-700">
                            {formatCurrency(liquidationResult.net_salary)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-center">
                          <div className="text-sm text-blue-600">Total Haberes</div>
                          <div className="text-lg font-semibold text-blue-700">
                            {formatCurrency(liquidationResult.total_gross_income)}
                          </div>
                        </div>
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-center">
                          <div className="text-sm text-red-600">Total Descuentos</div>
                          <div className="text-lg font-semibold text-red-700">
                            {formatCurrency(liquidationResult.total_deductions)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {liquidationResult.warnings.length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-yellow-800">Advertencias</div>
                            <ul className="text-sm text-yellow-700 mt-1">
                              {liquidationResult.warnings.map((warning, index) => (
                                <li key={index}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Desglose de Descuentos Principales - NUEVO */}
                    {(liquidationResult.afp_amount > 0 || liquidationResult.health_amount > 0 || liquidationResult.unemployment_amount > 0) && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <div className="text-xs font-medium text-gray-700 mb-2">Descuentos Principales:</div>
                        <div className="space-y-1 text-xs text-gray-600">
                          {liquidationResult.afp_amount > 0 && (
                            <div className="flex justify-between">
                              <span>AFP {liquidationResult.afp_code || 'HABITAT'} (10.0%)</span>
                              <span>{formatCurrency(liquidationResult.afp_amount)}</span>
                            </div>
                          )}
                          {liquidationResult.health_amount > 0 && (
                            <div className="flex justify-between">
                              <span>{liquidationResult.health_institution_code === 'FONASA' ? 'FONASA' : 'ISAPRE'} (7.0%)</span>
                              <span>{formatCurrency(liquidationResult.health_amount)}</span>
                            </div>
                          )}
                          {liquidationResult.unemployment_amount > 0 && (
                            <div className="flex justify-between">
                              <span>Seguro Cesantía ({liquidationResult.unemployment_percentage || 0.6}%)</span>
                              <span>{formatCurrency(liquidationResult.unemployment_amount)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalle
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleExportPDF}
                        disabled={exporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {exporting ? 'Generando PDF...' : 'Exportar PDF'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Listo para Calcular
                    </h3>
                    <p className="text-gray-500">
                      Complete los datos y presione "Calcular Liquidación" para ver el resultado
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Template PDF oculto (solo para exportación) */}
      {liquidationResult && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <LiquidationPDFTemplate
            liquidationData={liquidationResult}
            employeeName={selectedEmployeeData ? 
              `${selectedEmployeeData.first_name} ${selectedEmployeeData.last_name}` : 
              'Empleado'
            }
            period={formatPeriod(formData.period_year, formData.period_month)}
            companyName="CONTAPYME SPA"
            companyRut="76.123.456-7"
            companyAddress="Avenida Principal 123, Santiago"
            companyPhone="+56 2 2345 6789"
            employeeRut={selectedEmployeeData?.rut || 'N/A'}
            employeePosition={selectedEmployeeData?.employment_contracts?.[0]?.position || 'Empleado'}
            employeeStartDate="01-01-2024"
          />
        </div>
      )}
    </div>
  );
}