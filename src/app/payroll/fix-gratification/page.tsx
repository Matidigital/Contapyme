'use client';

import { useState } from 'react';
import { PayrollHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Wrench, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';

export default function FixGratificationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const COMPANY_ID = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

  const handleFix = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔧 Iniciando corrección masiva de gratificaciones...');
      
      const response = await fetch(`/api/payroll/liquidations/fix-gratification?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.data);
        console.log('✅ Corrección completada:', data.data);
      } else {
        setError(data.error || 'Error en la corrección');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('❌ Error fixing gratifications:', err);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <PayrollHeader 
        title="Corrección de Gratificaciones"
        subtitle="Herramienta temporal para corregir totales de liquidaciones"
        showBackButton
        backUrl="/payroll"
      />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Información */}
        <Card className="bg-yellow-50/80 backdrop-blur-sm border-yellow-200 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Corrección de Gratificaciones Art. 50</h3>
                <p className="text-yellow-700 text-sm mb-2">
                  Esta herramienta revisa todas las liquidaciones que tienen gratificación Art. 50 
                  y corrige aquellas donde la gratificación no está incluida en el total de haberes.
                </p>
                <p className="text-yellow-700 text-sm">
                  <strong>Importante:</strong> Solo ejecutar una vez. La corrección es automática y segura.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón de corrección */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Ejecutar Corrección
            </CardTitle>
            <CardDescription>
              Corregir liquidaciones existentes con gratificación Art. 50
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result && (
              <Button 
                onClick={handleFix}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                <Wrench className="h-4 w-4 mr-2" />
                {loading ? 'Corrigiendo liquidaciones...' : 'Ejecutar Corrección Masiva'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50/80 backdrop-blur-sm mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado */}
        {result && (
          <Card className="border-green-200 bg-green-50/80 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Corrección Completada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{result.total_liquidations_checked}</div>
                  <div className="text-sm text-gray-600">Revisadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{result.liquidations_needing_fix}</div>
                  <div className="text-sm text-gray-600">Requerían corrección</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.successful_updates}</div>
                  <div className="text-sm text-gray-600">Corregidas exitosamente</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{result.failed_updates}</div>
                  <div className="text-sm text-gray-600">Errores</div>
                </div>
              </div>

              {/* Detalle de correcciones */}
              {result.fixes && result.fixes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Detalles de las correcciones:</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {result.fixes.map((fix: any, index: number) => (
                      <div key={index} className="bg-white/60 rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-mono text-xs text-gray-500 mb-1">
                              ID: {fix.id.split('-')[0]}...
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600">Total original:</span> {formatCurrency(fix.original_total)}
                              </div>
                              <div>
                                <span className="text-gray-600">Gratificación:</span> {formatCurrency(fix.gratification)}
                              </div>
                              <div>
                                <span className="text-green-600">Total corregido:</span> {formatCurrency(fix.corrected_total)}
                              </div>
                              <div>
                                <span className="text-blue-600">Líquido corregido:</span> {formatCurrency(fix.corrected_net)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 p-3 bg-green-100 rounded-lg">
                <p className="text-green-800 text-sm text-center">
                  ✅ Corrección completada exitosamente. Las liquidaciones ahora muestran los totales correctos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}