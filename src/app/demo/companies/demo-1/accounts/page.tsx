'use client';

import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

export default function DemoAccountsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Plan de Cuentas Demo"
        subtitle="Empresa Demo S.A."
        showBackButton={true}
        backHref="/demo/companies/demo-1"
      />

      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidad Redirigida</CardTitle>
            <CardDescription>
              Esta página demo te redirige al módulo principal de plan de cuentas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-6">
                El plan de cuentas demo ha sido redirigido al módulo principal del sistema.
              </p>
              
              <Button 
                variant="primary"
                onClick={() => window.location.href = '/accounting/chart-of-accounts'}
              >
                Ir a Plan de Cuentas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}