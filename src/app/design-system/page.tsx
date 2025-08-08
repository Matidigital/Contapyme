'use client'

import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { MinimalHeader } from '@/components/layout'
import { 
  Download, 
  Star, 
  Heart, 
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Palette,
  Zap,
  Shield
} from 'lucide-react'

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <MinimalHeader variant="premium" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Header informativo con título de página */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg mb-6">
              <Palette className="h-5 w-5 text-primary-600" />
              <span className="font-semibold text-gray-900">Sistema de Diseño 2.0</span>
              <Badge variant="success" size="xs">Actualizado</Badge>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Sistema de Diseño Unificado
            </h1>
            <p className="text-xl text-gray-500 mb-6">
              Componentes UI modernizados para ContaPyme
            </p>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nuevo sistema de diseño unificado con componentes mejorados, colores actualizados y mejor experiencia de usuario.
            </p>
          </div>

          {/* Botones */}
          <Card variant="elevated" rounded="2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-xl">
                  <Zap className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <CardTitle>Botones Mejorados</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Nuevos tamaños, animaciones y estados</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Variantes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>Variantes</span>
                    <Badge variant="info" size="xs">7 variantes</Badge>
                  </h3>
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
                
                {/* Tamaños - Ahora con XS */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>Tamaños</span>
                    <Badge variant="primary" size="xs">Nuevo XS</Badge>
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="xs">Extra Pequeño</Button>
                    <Button size="sm">Pequeño</Button>
                    <Button size="md">Mediano</Button>
                    <Button size="lg">Grande</Button>
                    <Button size="xl">Extra Grande</Button>
                  </div>
                </div>
                
                {/* Formas */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>Formas</span>
                    <Badge variant="purple" size="xs">Nuevo</Badge>
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <Button rounded="none">Sin bordes</Button>
                    <Button rounded="sm">Pequeño</Button>
                    <Button rounded="md">Mediano</Button>
                    <Button rounded="lg">Grande (default)</Button>
                    <Button rounded="full">Completo</Button>
                  </div>
                </div>
                
                {/* Con iconos */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Con Iconos Mejorados</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button leftIcon={<Download className="h-4 w-4" />}>
                      Descargar
                    </Button>
                    <Button variant="success" rightIcon={<CheckCircle className="h-4 w-4" />}>
                      Completado
                    </Button>
                    <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
                      Configurar
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<Heart className="h-4 w-4" />} />
                  </div>
                </div>
                
                {/* Estados */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Estados y Efectos</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button>Normal</Button>
                    <Button loading>Cargando</Button>
                    <Button disabled>Deshabilitado</Button>
                    <Button fullWidth>Ancho completo</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges - Nuevo componente */}
          <Card variant="elevated" rounded="2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-100 rounded-xl">
                  <Shield className="h-5 w-5 text-success-600" />
                </div>
                <div>
                  <CardTitle>Badges</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Nuevo componente para etiquetas y estados</p>
                  <Badge variant="success" size="xs" className="mt-2">Nuevo Componente</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Variantes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Variantes</h3>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="purple">Purple</Badge>
                  </div>
                </div>
                
                {/* Tamaños */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Tamaños</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge size="xs">Extra Small</Badge>
                    <Badge size="sm">Small</Badge>
                    <Badge size="md">Medium</Badge>
                    <Badge size="lg">Large</Badge>
                  </div>
                </div>
                
                {/* Con outline */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Outline</h3>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="primary" outline>Primary Outline</Badge>
                    <Badge variant="success" outline>Success Outline</Badge>
                    <Badge variant="warning" outline>Warning Outline</Badge>
                    <Badge variant="error" outline>Error Outline</Badge>
                  </div>
                </div>
                
                {/* Con puntos e iconos */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Con Puntos e Iconos</h3>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="success" dot>En Línea</Badge>
                    <Badge variant="warning" dot>Pendiente</Badge>
                    <Badge variant="error" dot>Desconectado</Badge>
                    <Badge variant="primary" icon={<Star className="h-3 w-3" />}>Favorito</Badge>
                    <Badge variant="purple" icon={<Settings className="h-3 w-3" />}>Config</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards Mejoradas */}
          <Card variant="elevated" rounded="2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Info className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Cards Modernizadas</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Nuevas variantes y efectos mejorados</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Variantes existentes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Variantes Clásicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card variant="default" rounded="xl">
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-2">Default</h4>
                        <p className="text-gray-600 text-sm">
                          Estilo por defecto mejorado
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card variant="bordered" rounded="xl">
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-2">Bordered</h4>
                        <p className="text-gray-600 text-sm">
                          Con bordes prominentes
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card variant="elevated" rounded="xl">
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-2">Elevated</h4>
                        <p className="text-gray-600 text-sm">
                          Con sombra elevada
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card variant="flat" rounded="xl">
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-2">Flat</h4>
                        <p className="text-gray-600 text-sm">
                          Sin bordes, minimalista
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {/* Nuevas variantes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>Nuevas Variantes</span>
                    <Badge variant="success" size="xs">Nuevo</Badge>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card variant="glass" rounded="2xl">
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <span>Glass Effect</span>
                          <Badge variant="primary" size="xs">Moderno</Badge>
                        </h4>
                        <p className="text-gray-600 text-sm">
                          Efecto glassmorphism con desenfoque de fondo
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card variant="gradient" rounded="2xl">
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <span>Gradient</span>
                          <Badge variant="purple" size="xs">Premium</Badge>
                        </h4>
                        <p className="text-gray-600 text-sm">
                          Fondo con gradiente sutil y elegante
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {/* Card interactiva mejorada */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Efectos Interactivos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card hover variant="elevated" rounded="2xl">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-primary">
                            <Star className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Hover con Elevación</h4>
                            <p className="text-gray-600 text-sm">
                              Se eleva al hacer hover
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card hover variant="glass" rounded="2xl">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                            <Heart className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Glass Interactivo</h4>
                            <p className="text-gray-600 text-sm">
                              Efecto glass con hover
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secci\u00f3n final con call to action */}
          <Card variant="gradient" rounded="2xl" className="text-center">
            <CardContent className="p-12">
              <div className="max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-primary-100 rounded-full px-4 py-2 mb-6">
                  <CheckCircle className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-semibold text-primary-800">Sistema Actualizado</span>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Diseño Unificado y Moderno
                </h2>
                
                <p className="text-lg text-gray-600 mb-8">
                  Los componentes han sido modernizados manteniendo total compatibilidad con las funcionalidades existentes. 
                  El nuevo sistema proporciona mejor experiencia visual y consistencia en toda la aplicación.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    leftIcon={<Settings className="h-5 w-5" />}
                    rounded="full"
                  >
                    Ver en Acción
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    leftIcon={<Download className="h-5 w-5" />}
                    rounded="full"
                  >
                    Documentación
                  </Button>
                </div>
                
                <div className="flex justify-center items-center gap-6 mt-8 pt-8 border-t border-gray-200">
                  <Badge variant="primary" icon={<Zap className="h-3 w-3" />}>Más Rápido</Badge>
                  <Badge variant="success" icon={<Shield className="h-3 w-3" />}>Más Seguro</Badge>
                  <Badge variant="purple" icon={<Star className="h-3 w-3" />}>Más Bonito</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}