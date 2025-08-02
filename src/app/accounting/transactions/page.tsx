'use client';

import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { FileText, Plus, Filter, Download } from 'lucide-react';

export default function TransactionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Transacciones"
        subtitle="Registro de asientos contables y libro diario"
        showBackButton={true}
        backHref="/accounting"
        actions={
          <Button variant="primary" size="sm" disabled>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Transacción
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                >
                  <option>Todos</option>
                  <option>Ingresos</option>
                  <option>Egresos</option>
                  <option>Transferencias</option>
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <Button variant="primary" disabled>
                  Filtrar
                </Button>
                <Button variant="outline" disabled>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Libro Diario</CardTitle>
            <CardDescription>
              Registro cronológico de todas las transacciones contables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Módulo en Desarrollo
              </h3>
              <p className="text-gray-600 mb-6">
                El registro de transacciones contables está siendo implementado.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
                <h4 className="text-sm font-medium text-blue-900 mb-3">
                  🚀 Funcionalidades Planeadas
                </h4>
                <div className="text-left space-y-2 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Registro de asientos contables</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Libro diario automatizado</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Conciliación bancaria</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Importación desde bancos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Validación automática</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-x-3">
                <Button variant="primary" onClick={() => window.location.href = '/accounting/f29-analysis'}>
                  📄 Análisis F29 (Disponible)
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/accounting'}>
                  Volver a Contabilidad
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}