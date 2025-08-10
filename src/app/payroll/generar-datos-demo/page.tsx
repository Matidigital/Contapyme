'use client';

import { useState } from 'react';
import { PayrollHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Users, Database, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';

interface GenerationResult {
  employees_created: number;
  contracts_created: number;
  payroll_configs_created: number;
  liquidations_created: number;
  errors: string[];
}

export default function GenerarDatosDemoPage() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<any>(null);

  const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

  const checkCurrentStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch(`/api/payroll/demo-data?company_id=${companyId}`);
      const result = await response.json();
      
      if (result.success) {
        setCurrentStatus(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error verificando estado actual');
    } finally {
      setChecking(false);
    }
  };

  const generateData = async (clearExisting: boolean = false) => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/payroll/demo-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          clear_existing: clearExisting
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        // Actualizar estado después de generar
        setTimeout(checkCurrentStatus, 1000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error generando datos de ejemplo');
    } finally {
      setGenerating(false);
    }
  };

  // Verificar estado al cargar
  useState(() => {
    checkCurrentStatus();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <PayrollHeader 
        title="Generar Datos Demo" 
        subtitle="Crea empleados y liquidaciones de ejemplo para el sistema de remuneraciones"
        showBackButton
      />

      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          
          {/* Estado Actual */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                <Database className="w-5 h-5 mr-2 text-blue-600" />
                Estado Actual del Sistema
              </CardTitle>
              <CardDescription className="text-gray-600">
                Información sobre los datos existentes en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {checking ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Verificando datos existentes...</span>
                </div>
              ) : currentStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Empleados</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {currentStatus.employees_count}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <div className="flex items-center">
                        <FileSpreadsheet className="w-5 h-5 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Liquidaciones</p>
                          <p className="text-2xl font-bold text-green-700">
                            {currentStatus.liquidations_count}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${
                      currentStatus.ready_for_libro 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center">
                        {currentStatus.ready_for_libro ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-700">Estado</p>
                          <p className={`text-sm font-medium ${
                            currentStatus.ready_for_libro ? 'text-green-700' : 'text-yellow-700'
                          }`}>
                            {currentStatus.ready_for_libro ? 'Listo para Libro' : 'Necesita Datos'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {currentStatus.available_periods && currentStatus.available_periods.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Períodos Disponibles:</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentStatus.available_periods.map((period: string) => (
                          <span 
                            key={period}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                          >
                            {formatPeriod(period)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={checkCurrentStatus} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Verificar Estado
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Panel de Generación */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Generar Datos de Ejemplo
              </CardTitle>
              <CardDescription className="text-gray-600">
                Crea empleados típicos de una PyME chilena con sus liquidaciones correspondientes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                
                {/* Descripción de datos a generar */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Se generarán los siguientes datos:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>5 Empleados típicos</strong>: Desarrollador, Contadora, Gerente Comercial, Diseñadora, Supervisor</li>
                    <li>• <strong>Contratos de trabajo</strong> con salarios reales del mercado chileno</li>
                    <li>• <strong>Configuración previsional</strong> (AFP, Salud, Cargas familiares)</li>
                    <li>• <strong>Liquidaciones de los últimos 3 meses</strong> con cálculos reales según normativa chilena 2025</li>
                    <li>• <strong>Datos listos para generar Libro de Remuneraciones</strong></li>
                  </ul>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => generateData(false)}
                    disabled={generating}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                  >
                    {generating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Users className="w-4 h-4 mr-2" />
                    )}
                    {generating ? 'Generando...' : 'Generar Datos Demo'}
                  </Button>
                  
                  <Button
                    onClick={() => generateData(true)}
                    disabled={generating}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-700 hover:bg-red-50 py-3"
                  >
                    {generating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    ) : (
                      <Database className="w-4 h-4 mr-2" />
                    )}
                    {generating ? 'Limpiando y Generando...' : 'Limpiar y Generar Nuevo'}
                  </Button>
                </div>

                {/* Resultados */}
                {result && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <h4 className="font-semibold text-green-800">¡Datos generados exitosamente!</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Empleados:</span>
                        <span className="ml-2 text-green-700 font-bold">{result.employees_created}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Contratos:</span>
                        <span className="ml-2 text-green-700 font-bold">{result.contracts_created}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Config. Previsional:</span>
                        <span className="ml-2 text-green-700 font-bold">{result.payroll_configs_created}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Liquidaciones:</span>
                        <span className="ml-2 text-green-700 font-bold">{result.liquidations_created}</span>
                      </div>
                    </div>
                    
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-yellow-800 font-medium mb-1">Advertencias:</p>
                        {result.errors.map((err, index) => (
                          <p key={index} className="text-yellow-700 text-sm">{err}</p>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-blue-800 font-medium">Próximo paso:</p>
                      <p className="text-blue-700 text-sm">
                        Ve a <strong>"Libro de Remuneraciones"</strong> → Selecciona un período → <strong>"Generar Libro"</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* Errores */}
                {error && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      <h4 className="font-semibold text-red-800">Error</h4>
                    </div>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                ℹ️ Información Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3 text-sm text-gray-600">
              <p>
                <strong>Empleados de ejemplo:</strong> Juan Carlos González (Desarrollador), María Elena Martínez (Contadora), 
                Carlos Alberto Rodríguez (Gerente Comercial), Ana Sofía Hernández (Diseñadora), Roberto Miguel Fernández (Supervisor).
              </p>
              <p>
                <strong>Salarios:</strong> Entre $750.000 y $1.500.000, representativos del mercado chileno 2025.
              </p>
              <p>
                <strong>Cálculos:</strong> AFP (10%), Salud (7%), Cesantía (0.6%), Impuesto Único según tramos vigentes.
              </p>
              <p>
                <strong>Períodos:</strong> Se generan liquidaciones para los últimos 3 meses automáticamente.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

// Función auxiliar para formatear períodos
function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}