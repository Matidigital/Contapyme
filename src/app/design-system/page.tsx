'use client'

import React, { useState } from 'react'
import { Header } from '@/components/layout'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'

export default function DesignSystemPage() {
  const [loading, setLoading] = useState(false)

  const handleLoadingTest = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Sistema de Diseño"
        subtitle="Componentes UI de ContaPyme"
        showBackButton={true}
        backHref="/"
        actions={
          <Button variant="primary" size="sm">
            Nuevo
          </Button>
        }
      />

      <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
        {/* Paleta de Colores */}
        <Card>
          <CardHeader>
            <CardTitle>Paleta de Colores</CardTitle>
            <CardDescription>Colores principales del sistema ContaPyme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="w-full h-16 bg-blue-500 rounded-lg"></div>
                <p className="text-sm font-medium">Blue 500</p>
                <p className="text-xs text-gray-500">#3B82F6</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-green-500 rounded-lg"></div>
                <p className="text-sm font-medium">Green 500</p>
                <p className="text-xs text-gray-500">#10B981</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-purple-500 rounded-lg"></div>
                <p className="text-sm font-medium">Purple 500</p>
                <p className="text-xs text-gray-500">#8B5CF6</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-yellow-500 rounded-lg"></div>
                <p className="text-sm font-medium">Yellow 500</p>
                <p className="text-xs text-gray-500">#F59E0B</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones */}
        <Card>
          <CardHeader>
            <CardTitle>Componente Button</CardTitle>
            <CardDescription>Diferentes variantes y tamaños de botones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Variantes */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Variantes</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="warning">Warning</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="outline">Outline</Button>
                </div>
              </div>

              {/* Tamaños */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Tamaños</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" size="xl">Extra Large</Button>
                </div>
              </div>

              {/* Estados */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Estados</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Normal</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                  <Button 
                    variant="primary" 
                    loading={loading}
                    onClick={handleLoadingTest}
                  >
                    {loading ? 'Cargando...' : 'Click para Loading'}
                  </Button>
                </div>
              </div>

              {/* Con iconos */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Con Iconos</h4>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="primary" 
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    }
                  >
                    Agregar
                  </Button>
                  <Button 
                    variant="success" 
                    rightIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    }
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Componente Card</CardTitle>
            <CardDescription>Diferentes configuraciones de tarjetas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card variant="default" hover={true}>
                <CardHeader>
                  <CardTitle>Card Default</CardTitle>
                  <CardDescription>Con hover effect</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Contenido de la tarjeta con estilo por defecto.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" fullWidth>Acción</Button>
                </CardFooter>
              </Card>

              <Card variant="elevated">
                <CardHeader border={true}>
                  <CardTitle>Card Elevated</CardTitle>
                  <CardDescription>Con header border</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Tarjeta con sombra elevada y separador en header.</p>
                </CardContent>
                <CardFooter border={true}>
                  <Button variant="outline" size="sm">Cancelar</Button>
                  <Button variant="primary" size="sm" className="ml-2">Guardar</Button>
                </CardFooter>
              </Card>

              <Card variant="bordered">
                <CardHeader>
                  <CardTitle>Card Bordered</CardTitle>
                  <CardDescription>Borde destacado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Ventas:</span>
                      <span className="font-medium">$1.250.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margen:</span>
                      <span className="font-medium text-green-600">+15%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Demo de uso en contexto */}
        <Card>
          <CardHeader>
            <CardTitle>Demo: Módulo F29</CardTitle>
            <CardDescription>Ejemplo de cómo se verían los componentes en un contexto real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Análisis F29 - Enero 2024</h3>
                  <p className="text-sm text-gray-600">Formulario procesado con 95% de confianza</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Exportar</Button>
                  <Button variant="primary" size="sm">Ver Detalles</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card variant="flat" className="bg-blue-50 border border-blue-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-blue-600 font-medium">Ventas Netas</p>
                      <p className="text-2xl font-bold text-blue-900">$17.950.795</p>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="flat" className="bg-green-50 border border-green-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-green-600 font-medium">Margen Bruto</p>
                      <p className="text-2xl font-bold text-green-900">$5.100.795</p>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="flat" className="bg-purple-50 border border-purple-200">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-purple-600 font-medium">IVA Determinado</p>
                      <p className="text-2xl font-bold text-purple-900">-$777.992</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}