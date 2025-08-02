'use client';

import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Building, Users, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  // Demo mode - no authentication required
  const userProfile = {
    name: 'Usuario Demo',
    email: 'demo@contapyme.com',
    companies: [
      {
        id: 'demo-1',
        name: 'Empresa Demo S.A.',
        rut: '12.345.678-9'
      },
      {
        id: 'demo-2',
        name: 'Mi Pyme Ltda.',
        rut: '98.765.432-1'
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Dashboard Principal"
        subtitle="Centro de control de ContaPyme"
        showBackButton={true}
        backHref="/"
        actions={
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            DEMO
          </span>
        }
      />

      <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
        {/* Welcome Section */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">¡Bienvenido a ContaPyme! 👋</CardTitle>
            <CardDescription className="text-lg max-w-2xl mx-auto">
              Tu plataforma integral para gestionar todos los aspectos financieros y administrativos de tu empresa
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Module Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contabilidad Module */}
          <Card className="group hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/accounting'}>
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="flex items-center space-x-3">
                <BarChart3 className="w-6 h-6" />
                <span>Contabilidad</span>
                <ArrowRight className="w-5 h-5 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="text-green-100">
                Gestión financiera completa
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">Análisis F29 automático</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">Análisis comparativo</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                  <span className="text-gray-500">Plan de cuentas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                  <span className="text-gray-500">Estados financieros</span>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Estado del módulo</p>
                    <p className="text-xs text-green-600">✅ F29 completamente funcional</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remuneraciones Module */}
          <Card className="group hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/payroll'}>
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="flex items-center space-x-3">
                <Users className="w-6 h-6" />
                <span>Remuneraciones</span>
                <ArrowRight className="w-5 h-5 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <CardDescription className="text-blue-100">
                Gestión integral de RRHH
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                  <span className="text-gray-500">Nóminas y liquidaciones</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                  <span className="text-gray-500">Control de asistencia</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                  <span className="text-gray-500">Gestión de empleados</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                  <span className="text-gray-500">Reportes previsionales</span>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Estado del módulo</p>
                    <p className="text-xs text-blue-600">🚧 Próximamente disponible</p>
                  </div>
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen de tu cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{userProfile?.companies?.length || 0}</p>
                <p className="text-sm text-gray-600">Empresas registradas</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-sm text-gray-600">Módulos disponibles</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">95%</p>
                <p className="text-sm text-gray-600">F29 Analysis funcional</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies */}
        {userProfile?.companies && userProfile.companies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tus empresas</CardTitle>
              <CardDescription>
                Gestiona las empresas registradas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile.companies.map((company: any) => (
                  <div key={company.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{company.name}</h4>
                        <p className="text-sm text-gray-600">RUT: {company.rut}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/companies/${company.id}`}
                      >
                        Ver <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Acceso directo a las funcionalidades más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="primary" 
                fullWidth
                onClick={() => window.location.href = '/accounting/f29-analysis'}
              >
                📄 Análisis F29
              </Button>
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => window.location.href = '/accounting/f29-comparative'}
              >
                📊 Análisis Comparativo
              </Button>
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => window.location.href = '/accounting'}
              >
                💼 Contabilidad
              </Button>
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => window.location.href = '/companies/new'}
              >
                🏢 Nueva Empresa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}