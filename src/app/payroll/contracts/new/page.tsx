'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowLeft, Save, FileText } from 'lucide-react';

export default function NewContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Placeholder para futuro desarrollo
    setTimeout(() => {
      setLoading(false);
      router.push('/payroll?tab=contracts');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Nuevo Contrato"
        subtitle="Crear un contrato laboral"
        showBackButton
      />

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Función en Desarrollo
              </CardTitle>
              <CardDescription>
                Esta funcionalidad estará disponible próximamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Contratos Independientes
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Por ahora, los contratos se crean automáticamente al registrar un empleado. 
                  La gestión independiente de contratos estará disponible en una próxima actualización.
                </p>
                
                <div className="flex justify-center space-x-4">
                  <Link href="/payroll/employees/new">
                    <Button variant="primary">
                      Crear Empleado con Contrato
                    </Button>
                  </Link>
                  <Link href="/payroll">
                    <Button variant="outline">
                      Volver al Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}