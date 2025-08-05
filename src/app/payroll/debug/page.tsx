'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Bug, Database, Users, Settings } from 'lucide-react';

export default function PayrollDebugPage() {
  const [employeesData, setEmployeesData] = useState<any>(null);
  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const COMPANY_ID = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

  useEffect(() => {
    fetchDebugData();
  }, []);

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Verificar empleados
      const employeesResponse = await fetch(`/api/payroll/employees?company_id=${COMPANY_ID}`);
      const employeesResult = await employeesResponse.json();

      // 2. Verificar configuración previsional
      const settingsResponse = await fetch(`/api/payroll/settings?company_id=${COMPANY_ID}`);
      const settingsResult = await settingsResponse.json();

      setEmployeesData(employeesResult);
      setSettingsData(settingsResult);

    } catch (err) {
      setError(`Error: ${err}`);
      console.error('Debug fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testLiquidationCalculation = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/payroll/liquidations/calculate?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          period_year: 2025,
          period_month: 8,
          days_worked: 30,
          additional_income: {},
          additional_deductions: {},
          save_liquidation: false
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ Liquidación calculada exitosamente!\nSueldo líquido: $${result.data.liquidation.net_salary.toLocaleString()}`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error de conexión: ${err}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Debug Payroll"
          subtitle="Diagnóstico del sistema..."
          showBackButton
        />
        <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Ejecutando diagnóstico...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Debug Payroll System"
        subtitle="Diagnóstico y pruebas del sistema de liquidaciones"
        showBackButton
        actions={
          <Button variant="outline" size="sm" onClick={fetchDebugData}>
            <Bug className="h-4 w-4 mr-2" />
            Actualizar Datos
          </Button>
        }
      />

      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center text-red-700">
                <Bug className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Empleados Debug */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Empleados ({employeesData?.count || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-gray-100 rounded-md">
                  <p className="text-sm font-medium">API Response Status:</p>
                  <p className={`text-sm ${employeesData?.success ? 'text-green-600' : 'text-red-600'}`}>
                    {employeesData?.success ? '✅ Success' : '❌ Error'}
                  </p>
                  {employeesData?.error && (
                    <p className="text-sm text-red-600">Error: {employeesData.error}</p>
                  )}
                </div>

                {employeesData?.success && employeesData?.data && (
                  <div className="space-y-2">
                    {employeesData.data.map((employee: any) => (
                      <div key={employee.id} className="p-3 border border-gray-200 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                            <p className="text-sm text-gray-600">RUT: {employee.rut}</p>
                            <p className="text-sm text-gray-600">Status: {employee.status}</p>
                            
                            {/* Contratos Debug */}
                            {employee.employment_contracts && employee.employment_contracts.length > 0 ? (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-green-600">✅ Contratos: {employee.employment_contracts.length}</p>
                                {employee.employment_contracts.map((contract: any, idx: number) => (
                                  <div key={idx} className="text-xs text-gray-500 ml-2">
                                    • {contract.position} - ${contract.base_salary?.toLocaleString()} ({contract.status})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-red-600 mt-2">❌ Sin contratos</p>
                            )}

                            {/* Payroll Config Debug */}
                            {employee.payroll_config ? (
                              <p className="text-xs text-green-600 mt-1">✅ Config Previsional</p>
                            ) : (
                              <p className="text-xs text-yellow-600 mt-1">⚠️ Sin config previsional</p>
                            )}
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => testLiquidationCalculation(employee.id)}
                          >
                            Probar Cálculo
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {employeesData?.success && (!employeesData?.data || employeesData.data.length === 0) && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">⚠️ No hay empleados registrados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configuración Previsional Debug */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600" />
                Configuración Previsional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-gray-100 rounded-md">
                  <p className="text-sm font-medium">API Response Status:</p>
                  <p className={`text-sm ${settingsData?.success ? 'text-green-600' : 'text-red-600'}`}>
                    {settingsData?.success ? '✅ Success' : '❌ Error'}
                  </p>
                  {settingsData?.error && (
                    <p className="text-sm text-red-600">Error: {settingsData.error}</p>
                  )}
                </div>

                {settingsData?.success && settingsData?.data && (
                  <div className="space-y-3">
                    {/* AFP Config */}
                    {settingsData.data.afp_configs && (
                      <div className="p-3 border border-gray-200 rounded-md">
                        <p className="text-sm font-medium text-green-600">✅ AFP Configuradas: {settingsData.data.afp_configs.length}</p>
                        <div className="text-xs text-gray-600 mt-1">
                          {settingsData.data.afp_configs.slice(0, 3).map((afp: any) => (
                            <div key={afp.code}>• {afp.name}: {afp.commission_percentage}%</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Topes e Imponibles */}
                    {settingsData.data.income_limits && (
                      <div className="p-3 border border-gray-200 rounded-md">
                        <p className="text-sm font-medium text-green-600">✅ Topes Imponibles</p>
                        <div className="text-xs text-gray-600 mt-1">
                          <div>• UF Límite: {settingsData.data.income_limits.uf_limit} UF</div>
                          <div>• Sueldo Mínimo: ${settingsData.data.income_limits.minimum_wage?.toLocaleString()}</div>
                        </div>
                      </div>
                    )}

                    {/* Asignaciones Familiares */}
                    {settingsData.data.family_allowances && (
                      <div className="p-3 border border-gray-200 rounded-md">
                        <p className="text-sm font-medium text-green-600">✅ Asignaciones Familiares</p>
                        <div className="text-xs text-gray-600 mt-1">
                          <div>• Tramo A: ${settingsData.data.family_allowances.tramo_a?.toLocaleString()}</div>
                          <div>• Tramo B: ${settingsData.data.family_allowances.tramo_b?.toLocaleString()}</div>
                          <div>• Tramo C: ${settingsData.data.family_allowances.tramo_c?.toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Raw Data Debug */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-gray-600" />
                Raw Employees Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(employeesData, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-gray-600" />
                Raw Settings Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(settingsData, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}