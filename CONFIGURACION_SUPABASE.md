# 🗄️ CONFIGURACIÓN SUPABASE PARA ACTIVOS FIJOS

## 📋 RESUMEN
ContaPyme ahora incluye un módulo completo de **Activos Fijos con base de datos real** usando Supabase. Este documento explica cómo configurar la base de datos para que funcione en producción.

## 🚀 CONFIGURACIÓN PASO A PASO

### **PASO 1: Crear Proyecto Supabase**

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto:
   - **Nombre**: ContaPyme Producción
   - **Base de datos**: PostgreSQL
   - **Región**: Más cercana a Chile (US West o South America)

### **PASO 2: Ejecutar Migraciones**

En el panel SQL de Supabase, ejecuta este script:

```sql
-- =============================================
-- MIGRACIÓN: MÓDULO DE ACTIVOS FIJOS
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Tabla principal: fixed_assets
CREATE TABLE IF NOT EXISTS fixed_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    
    -- Información básica del activo
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'Activo Fijo',
    
    -- Valores económicos
    purchase_value DECIMAL(15,2) NOT NULL,
    residual_value DECIMAL(15,2) DEFAULT 0,
    depreciable_value DECIMAL(15,2) GENERATED ALWAYS AS (purchase_value - residual_value) STORED,
    
    -- Fechas importantes
    purchase_date DATE NOT NULL,
    start_depreciation_date DATE NOT NULL,
    
    -- Vida útil y depreciación
    useful_life_years INTEGER NOT NULL CHECK (useful_life_years > 0),
    useful_life_months INTEGER GENERATED ALWAYS AS (useful_life_years * 12) STORED,
    depreciation_method VARCHAR(50) DEFAULT 'linear',
    
    -- Asociación con plan de cuentas
    asset_account_code VARCHAR(20),
    depreciation_account_code VARCHAR(20),
    expense_account_code VARCHAR(20),
    
    -- Estado del activo
    status VARCHAR(20) DEFAULT 'active',
    disposal_date DATE,
    disposal_value DECIMAL(15,2),
    
    -- Información adicional
    serial_number VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    location VARCHAR(255),
    responsible_person VARCHAR(255),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para categorías predefinidas de activos fijos
CREATE TABLE IF NOT EXISTS fixed_assets_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    default_useful_life_years INTEGER,
    suggested_asset_account VARCHAR(20),
    suggested_depreciation_account VARCHAR(20),
    suggested_expense_account VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar categorías predefinidas chilenas
INSERT INTO fixed_assets_categories (name, description, default_useful_life_years, suggested_asset_account, suggested_depreciation_account, suggested_expense_account) VALUES
('Muebles y Útiles', 'Mobiliario de oficina, escritorios, sillas, estanterías', 7, '1.2.01.001', '1.2.01.002', '3.1.08'),
('Equipos Computacionales', 'Computadores, laptops, servidores, impresoras', 3, '1.2.02.001', '1.2.02.002', '3.1.09'),
('Vehículos', 'Automóviles, camiones, motocicletas para uso empresarial', 7, '1.2.03.001', '1.2.03.002', '3.1.10'),
('Maquinaria y Equipos', 'Maquinaria industrial, herramientas especializadas', 10, '1.2.04.001', '1.2.04.002', '3.1.11'),
('Instalaciones y Equipos', 'Equipamiento fijo, instalaciones eléctricas', 10, '1.2.05.001', '1.2.05.002', '3.1.12'),
('Inmuebles', 'Edificios, terrenos, construcciones', 50, '1.2.06.001', '1.2.06.002', '3.1.13'),
('Intangibles', 'Software, licencias, patentes, marcas', 5, '1.2.07.001', '1.2.07.002', '3.1.14')
ON CONFLICT (name) DO NOTHING;

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_fixed_assets_user_id ON fixed_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(status);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(category);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_purchase_date ON fixed_assets(purchase_date);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_fixed_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fixed_assets_updated_at
    BEFORE UPDATE ON fixed_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_fixed_assets_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE fixed_assets IS 'Registro de activos fijos de la empresa con información para depreciación';
COMMENT ON TABLE fixed_assets_categories IS 'Categorías predefinidas de activos fijos con valores sugeridos';
```

### **PASO 3: Configurar Variables en Netlify**

En tu panel de Netlify, ve a **Site Settings > Environment Variables** y agrega:

```bash
# URL de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Service Role Key (no la anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**¿Cómo obtener estas variables?**

1. **NEXT_PUBLIC_SUPABASE_URL**: 
   - Ve a Settings > API en tu proyecto Supabase
   - Copia la "Project URL"

2. **SUPABASE_SERVICE_ROLE_KEY**:
   - En la misma página, busca "Project API keys"
   - Copia la "service_role" key (NO la "anon public")

### **PASO 4: Verificar Funcionamiento**

1. Hace deploy en Netlify
2. Ve a `https://tu-sitio.netlify.app/accounting/fixed-assets`
3. Intenta crear un activo fijo
4. Los datos ahora se guardarán en Supabase real

## 🔍 VERIFICACIÓN DE DATOS

### **Consultar Datos en Supabase:**

```sql
-- Ver todos los activos fijos
SELECT * FROM fixed_assets ORDER BY created_at DESC;

-- Ver activos por usuario
SELECT name, purchase_value, status, created_at 
FROM fixed_assets 
WHERE user_id = 'demo-user-id'
ORDER BY created_at DESC;

-- Ver categorías disponibles
SELECT * FROM fixed_assets_categories;
```

### **Dashboard de Métricas:**

En Supabase puedes ver:
- **Table Editor**: Datos en tiempo real
- **Database**: Estadísticas de uso
- **Logs**: Errores y queries ejecutadas

## 🎯 FUNCIONALIDADES HABILITADAS

Con esta configuración, **todas las funciones** de activos fijos funcionarán:

✅ **Crear activos fijos** - Datos persistentes en Supabase
✅ **Listar activos** - Con filtros y búsqueda
✅ **Eliminar activos** - Eliminación real de base de datos
✅ **Dashboard ejecutivo** - Métricas calculadas desde datos reales
✅ **Reportes** - Análisis basado en datos persistentes
✅ **Categorías** - Sistema de categorías predefinidas

## 🚨 TROUBLESHOOTING

### **Error: "Error al crear activo fijo"**
- Verificar variables de entorno en Netlify
- Confirmar que las migraciones se ejecutaron
- Revisar logs en Netlify Functions

### **Error: "No se pueden obtener activos"**
- Verificar conexión a Supabase
- Confirmar que las tablas existen
- Revisar permisos RLS (si están habilitados)

### **Dashboard muestra 0 activos**
- Crear algunos activos de prueba
- Verificar user_id en consultas
- Confirmar filtros de estado

## 🔐 SEGURIDAD

### **Recomendaciones:**
- Usar Service Role Key solo en server-side
- Considerar habilitar RLS (Row Level Security) para producción
- Rotar keys periódicamente
- Monitorear uso de base de datos

### **RLS (Opcional para múltiples usuarios):**
```sql
-- Habilitar RLS
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;

-- Política para usuarios autenticados
CREATE POLICY "Users can manage their own assets" ON fixed_assets
    FOR ALL USING (auth.uid() = user_id);
```

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Proyecto Supabase creado
- [ ] Migraciones ejecutadas
- [ ] Variables configuradas en Netlify
- [ ] Deploy exitoso
- [ ] Prueba de creación de activo
- [ ] Verificación de datos en Supabase
- [ ] Dashboard funcionando
- [ ] Reportes generándose

## 📞 SOPORTE

Si encuentras problemas:
1. Revisar logs de Netlify Functions
2. Consultar tabla de datos en Supabase
3. Verificar variables de entorno
4. Confirmar formato de datos enviados

**Estado**: ✅ Configuración lista para producción
**Fecha**: Agosto 2025
**Desarrollado por**: Matías Riquelme + Claude Sonnet 4