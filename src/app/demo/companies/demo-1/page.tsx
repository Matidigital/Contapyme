'use client';

import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Building, TrendingUp, DollarSign, FileText, BarChart3 } from 'lucide-react';

export default function DemoCompanyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Empresa Demo S.A."
        subtitle="Dashboard Demo - RUT: 12.345.678-9"
        showBackButton={true}
        backHref="/demo"
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              📊 Ver Reportes
            </Button>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              DEMO
            </span>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        {/* Demo Notice */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Modo Demostración</h3>
                <p className="text-blue-800 text-sm">
                  Esta es una empresa demo con datos simulados para mostrar las capacidades del sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Ventas Mes Actual</p>
                  <p className="text-2xl font-bold text-gray-900">$17.950.795</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Crecimiento</p>
                  <p className="text-2xl font-bold text-green-600">+15.3%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">F29 Procesados</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Confianza Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">94%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Modules */}
        <Card>
          <CardHeader>
            <CardTitle>Módulos Disponibles</CardTitle>
            <CardDescription>
              Explora las funcionalidades del sistema con datos demo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                variant="primary" 
                fullWidth 
                className="h-20 flex-col space-y-2"
                onClick={() => window.open('/accounting/f29-analysis', '_blank')}
              >
                <FileText className="w-6 h-6" />
                <span>Análisis F29 Individual</span>
              </Button>

              <Button 
                variant="primary" 
                fullWidth 
                className="h-20 flex-col space-y-2"
                onClick={() => window.open('/accounting/f29-comparative', '_blank')}
              >
                <BarChart3 className="w-6 h-6" />
                <span>Análisis Comparativo</span>
              </Button>

              <Button 
                variant="outline" 
                fullWidth 
                className="h-20 flex-col space-y-2"
                onClick={() => window.open('/accounting/f29-guide', '_blank')}
              >
                <FileText className="w-6 h-6" />
                <span>Guía F29</span>
              </Button>

              <Button 
                variant="outline" 
                fullWidth 
                className="h-20 flex-col space-y-2"
                disabled
              >
                <DollarSign className="w-6 h-6" />
                <span>Transacciones</span>
              </Button>

              <Button 
                variant="outline" 
                fullWidth 
                className="h-20 flex-col space-y-2"
                disabled
              >
                <TrendingUp className="w-6 h-6" />
                <span>Reportes</span>
              </Button>

              <Button 
                variant="outline" 
                fullWidth 
                className="h-20 flex-col space-y-2"
                disabled
              >
                <Building className="w-6 h-6" />
                <span>Plan de Cuentas</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* F29 Analysis Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Demo F29</CardTitle>
            <CardDescription>
              Datos del último formulario F29 procesado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-medium text-blue-700 mb-1">Ventas Netas</h4>
                <p className="text-2xl font-bold text-blue-900">$17.950.795</p>
                <p className="text-xs text-blue-600">Código 563</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="text-sm font-medium text-green-700 mb-1">Compras Netas</h4>
                <p className="text-2xl font-bold text-green-900">$17.950.789</p>
                <p className="text-xs text-green-600">Calculado automáticamente</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="text-sm font-medium text-purple-700 mb-1">IVA Determinado</h4>
                <p className="text-2xl font-bold text-green-900">-$777.992</p>
                <p className="text-xs text-green-600">A favor del contribuyente</p>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button 
                variant="primary"
                onClick={() => window.location.href = '/accounting/f29-analysis'}
              >
                📄 Probar Análisis Individual
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/accounting/f29-comparative'}
              >
                📊 Ver Análisis Comparativo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}