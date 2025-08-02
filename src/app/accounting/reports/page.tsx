'use client';

import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { BarChart3, FileText, Download, Calendar, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Reportes"
        subtitle="Balance general, estado de resultados y más"
        showBackButton={true}
        backHref="/accounting"
        actions={
          <Button variant="primary" size="sm" disabled>
            <Download className="w-4 h-4 mr-2" />
            Exportar Todo
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        {/* Report Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Período de Análisis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
              <div className="flex items-end">
                <Button variant="primary" fullWidth disabled>
                  Generar Reportes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Balance General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Balance General</span>
              </CardTitle>
              <CardDescription>
                Estado de situación financiera de la empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Incluye:
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>• Activos Corrientes y No Corrientes</div>
                    <div>• Pasivos y Patrimonio</div>
                    <div>• Ecuación Contable</div>
                  </div>
                </div>
                <Button variant="outline" fullWidth disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  Generar Balance
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Estado de Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Estado de Resultados</span>
              </CardTitle>
              <CardDescription>
                Ingresos, gastos y resultado del período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">
                    Incluye:
                  </h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <div>• Ingresos Operacionales</div>
                    <div>• Gastos de Operación</div>
                    <div>• Resultado Neto</div>
                  </div>
                </div>
                <Button variant="outline" fullWidth disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  Generar Estado
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Flujo de Caja */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>Flujo de Caja</span>
              </CardTitle>
              <CardDescription>
                Movimientos de efectivo del período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-900 mb-2">
                    Incluye:
                  </h4>
                  <div className="text-sm text-purple-800 space-y-1">
                    <div>• Flujo Operacional</div>
                    <div>• Flujo de Inversión</div>
                    <div>• Flujo de Financiamiento</div>
                  </div>
                </div>
                <Button variant="outline" fullWidth disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  Generar Flujo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* F29 Analysis Available */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Análisis F29 - Disponible Ahora</span>
            </CardTitle>
            <CardDescription>
              Mientras implementamos los reportes tradicionales, puedes usar nuestro análisis F29 avanzado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-900 mb-3">Análisis Individual</h4>
                <p className="text-sm text-blue-800 mb-4">
                  Sube un formulario F29 y obtén análisis detallado instantáneo
                </p>
                <Button 
                  variant="primary" 
                  fullWidth
                  onClick={() => window.location.href = '/accounting/f29-analysis'}
                >
                  📄 Análisis Individual
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-900 mb-3">Análisis Comparativo</h4>
                <p className="text-sm text-blue-800 mb-4">
                  Sube múltiples F29 y obtén tendencias, proyecciones e insights automáticos
                </p>
                <Button 
                  variant="outline" 
                  fullWidth
                  onClick={() => window.location.href = '/accounting/f29-comparative'}
                >
                  📊 Análisis Comparativo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Status */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Desarrollo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-yellow-900 mb-3">
                🚧 Reportes Tradicionales en Desarrollo
              </h4>
              <p className="text-yellow-800 mb-4">
                Los reportes contables tradicionales están siendo implementados. El sistema de análisis F29 está completamente funcional.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-yellow-900 mb-2">Próximas Implementaciones:</h5>
                  <div className="space-y-1 text-sm text-yellow-800">
                    <div>• Balance General automatizado</div>
                    <div>• Estado de Resultados</div>
                    <div>• Flujo de Caja proyectado</div>
                    <div>• Análisis de ratios financieros</div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-yellow-900 mb-2">Disponible Ahora:</h5>
                  <div className="space-y-1 text-sm text-yellow-800">
                    <div>✅ Análisis F29 individual</div>
                    <div>✅ Análisis F29 comparativo</div>
                    <div>✅ Cálculos tributarios automáticos</div>
                    <div>✅ Insights y proyecciones</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}