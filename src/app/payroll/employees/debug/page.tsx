'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, CardContent } from '@/components/ui';

export default function EmployeesDebugPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');

  const COMPANY_ID = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

  useEffect(() => {
    debugFetch();
  }, []);

  const debugFetch = async () => {
    try {
      setLoading(true);
      console.log('🔍 Iniciando fetch a:', `/api/payroll/employees?company_id=${COMPANY_ID}`);
      
      const response = await fetch(`/api/payroll/employees?company_id=${COMPANY_ID}`);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      const responseText = await response.text();
      setRawResponse(responseText);
      
      console.log('📄 Raw response:', responseText);
      
      const data = JSON.parse(responseText);
      console.log('📊 Parsed data:', data);
      
      setData(data);
      
      if (!response.ok) {
        setError(`HTTP ${response.status}: ${data.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('❌ Error completo:', err);
      setError(`Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Debug Empleados"
        subtitle="Diagnóstico de carga de empleados"
        showBackButton
      />

      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          
          {/* Estado de carga */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Estado de Carga</h3>
              <div className="space-y-2">
                <p><strong>Loading:</strong> {loading ? '✅ Cargando...' : '❌ Terminado'}</p>
                <p><strong>Error:</strong> {error || '✅ Sin errores'}</p>
                <p><strong>Company ID:</strong> {COMPANY_ID}</p>
                <p><strong>API URL:</strong> /api/payroll/employees?company_id={COMPANY_ID}</p>
              </div>
            </CardContent>
          </Card>

          {/* Raw Response */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Respuesta Raw de API</h3>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">{rawResponse || 'No hay respuesta aún...'}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Parsed Data */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Datos Parseados</h3>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(data, null, 2) || 'No hay datos parseados...'}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Empleados si existen */}
          {data && data.success && data.data && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Empleados Encontrados: {data.count}</h3>
                <div className="space-y-4">
                  {data.data.map((employee: any) => (
                    <div key={employee.id} className="border p-4 rounded-md">
                      <h4 className="font-medium">{employee.first_name} {employee.last_name}</h4>
                      <p className="text-sm text-gray-600">RUT: {employee.rut}</p>
                      <p className="text-sm text-gray-600">Email: {employee.email}</p>
                      {employee.employment_contracts && employee.employment_contracts.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Cargo: {employee.employment_contracts[0].position} - 
                          Salario: ${employee.employment_contracts[0].base_salary?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botón de reintento */}
          <div className="text-center">
            <Button onClick={debugFetch} disabled={loading}>
              {loading ? 'Cargando...' : 'Reintentar Fetch'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}