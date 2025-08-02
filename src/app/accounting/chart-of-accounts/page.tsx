'use client';

import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { FolderTree, Plus, Search, Download } from 'lucide-react';

export default function ChartOfAccountsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Plan de Cuentas"
        subtitle="Estructura y organización de cuentas contables"
        showBackButton={true}
        backHref="/accounting"
        actions={
          <Button variant="primary" size="sm" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cuenta
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        {/* Search and Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar cuenta..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled
                  />
                </div>
              </div>
              <Button variant="outline" disabled>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chart of Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderTree className="w-5 h-5 text-blue-600" />
              <span>Estructura de Cuentas</span>
            </CardTitle>
            <CardDescription>
              Plan de cuentas según normas contables chilenas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FolderTree className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Plan de Cuentas en Desarrollo
              </h3>
              <p className="text-gray-600 mb-6">
                La estructura del plan de cuentas está siendo implementada según las normas chilenas.
              </p>
              
              <div className="bg-green-50 rounded-lg p-6 max-w-md mx-auto">
                <h4 className="text-sm font-medium text-green-900 mb-3">
                  📋 Estructura Planeada
                </h4>
                <div className="text-left space-y-2 text-sm text-green-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>1. Activos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>2. Pasivos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>3. Patrimonio</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>4. Ingresos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>5. Gastos</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-lg mx-auto">
                <Button variant="primary" onClick={() => window.location.href = '/accounting/f29-analysis'}>
                  📄 Análisis F29
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/accounting'}>
                  Volver a Contabilidad
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa del Sistema</CardTitle>
            <CardDescription>
              Ejemplo de cómo se verá la estructura de cuentas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 font-mono text-sm">
              <div className="text-gray-600">1. ACTIVOS</div>
              <div className="ml-4 text-gray-600">1.1. Activos Corrientes</div>
              <div className="ml-8 text-gray-600">1.1.1. Caja</div>
              <div className="ml-8 text-gray-600">1.1.2. Bancos</div>
              <div className="ml-8 text-gray-600">1.1.3. Cuentas por Cobrar</div>
              <div className="ml-4 text-gray-600">1.2. Activos No Corrientes</div>
              <div className="ml-8 text-gray-600">1.2.1. Muebles y Equipos</div>
              
              <div className="text-gray-600 mt-4">2. PASIVOS</div>
              <div className="ml-4 text-gray-600">2.1. Pasivos Corrientes</div>
              <div className="ml-8 text-gray-600">2.1.1. Cuentas por Pagar</div>
              <div className="ml-8 text-gray-600">2.1.2. IVA por Pagar</div>
              
              <div className="text-gray-600 mt-4">...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}