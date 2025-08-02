'use client';

import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

export default function DemoTransactionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Transacciones Demo"
        subtitle="Empresa Demo S.A."
        showBackButton={true}
        backHref="/demo/companies/demo-1"
      />

      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidad Redirigida</CardTitle>
            <CardDescription>
              Esta página demo te redirige al módulo principal de transacciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-6">
                Las transacciones demo han sido redirigidas al módulo principal del sistema.
              </p>
              
              <Button 
                variant="primary"
                onClick={() => window.location.href = '/accounting/transactions'}
              >
                Ir a Transacciones
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}