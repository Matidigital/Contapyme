'use client';

import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

export default function DemoBalanceSheetPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Balance General Demo"
        subtitle="Empresa Demo S.A."
        showBackButton={true}
        backHref="/demo/companies/demo-1"
      />

      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidad Redirigida</CardTitle>
            <CardDescription>
              Esta página demo te redirige al módulo principal de reportes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-6">
                Los reportes demo han sido redirigidos al módulo principal del sistema.
              </p>
              
              <Button 
                variant="primary"
                onClick={() => window.location.href = '/accounting/reports'}
              >
                Ir a Reportes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}