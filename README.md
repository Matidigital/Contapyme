# ContaPyme - Sistema Contable Integral

Plataforma contable completa para PyMEs con dashboard financiero, balances y proyecciones.

## 🚀 Características

- **Dashboard Financiero**: Vista integral de la salud financiera de la empresa
- **Gestión de Balances**: Balances generales y estados de resultados en tiempo real
- **Proyecciones Financieras**: Análisis predictivo y forecasting
- **Multi-empresa**: Gestión de múltiples empresas desde una sola cuenta
- **Reportes Automatizados**: Generación automática de reportes contables
- **Interfaz Moderna**: UI/UX intuitiva y responsive

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Base de Datos**: Supabase (PostgreSQL + Auth + Storage)
- **Autenticación**: Supabase Auth
- **Visualizaciones**: Recharts
- **Deployment**: Netlify
- **Control de Versiones**: Git
- **Testing**: Jest + Testing Library

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd contapyme-sistema-contable

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

## 🗄️ Configuración de Supabase

1. Crear proyecto en [Supabase](https://supabase.com)
2. Obtener URL y API Key del proyecto
3. Ejecutar migración inicial:
   ```bash
   npx supabase db push
   ```
4. Configurar variables de entorno en `.env`

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linting del código
- `npm run type-check` - Verificación de tipos TypeScript
- `npm run db:types` - Generar tipos de Supabase
- `npm run supabase:start` - Iniciar Supabase local
- `npm run supabase:stop` - Detener Supabase local
- `npm run test` - Ejecutar tests

## 🚀 Deployment en Netlify

1. Conectar repositorio GitHub con Netlify
2. Configurar variables de entorno en Netlify:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy automático al hacer push a main

## 📊 Estructura del Proyecto

```
src/
├── app/              # Next.js App Router
├── components/       # Componentes React reutilizables
├── lib/              # Utilidades y configuraciones
├── types/            # Definiciones de tipos TypeScript
├── hooks/            # Custom React hooks
└── utils/            # Funciones utilitarias
```

## 🚦 Estado del Desarrollo

- ✅ Configuración inicial del proyecto
- ✅ Estructura de directorios
- ✅ Configuración de TypeScript y Tailwind
- ✅ Diseño de base de datos con Prisma
- 🔄 Sistema de autenticación
- ⏳ Módulos principales (balances, proyecciones)
- ⏳ Dashboard UI
- ⏳ Testing y deployment

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.