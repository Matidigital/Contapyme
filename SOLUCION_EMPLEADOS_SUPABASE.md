# SOLUCIÓN DEFINITIVA: EMPLEADOS EN SUPABASE

## 🎯 PROBLEMA IDENTIFICADO

**El proyecto Supabase anterior expiró/fue eliminado**. Las credenciales en `.env.production` apuntan a un proyecto que ya no existe (`xytgylsdxtzkqcjlgqvk.supabase.co`).

## ✅ SOLUCIÓN IMPLEMENTADA

### **1. CÓDIGO RESTAURADO A SUPABASE**
- **GET**: Consulta empleados desde tabla `employees` con JOIN a `employment_contracts` y `payroll_config`
- **POST**: Inserta empleado → contrato → configuración previsional
- **PATCH**: Actualiza empleado en base de datos real
- **DELETE**: Soft delete (status = 'terminated')

### **2. MIGRACIÓN COMPLETA REALIZADA**
- ❌ **FileEmployeeStore** comentado
- ✅ **Supabase queries** restauradas
- ✅ **Imports** actualizados (`@/lib/supabase`)
- ✅ **Error handling** robusto

## 🚀 PASOS PARA ACTIVAR

### **PASO 1: Crear Proyecto Supabase**
1. Ir a https://supabase.com
2. Crear nuevo proyecto
3. Obtener URL y API Keys

### **PASO 2: Ejecutar Migraciones**
```sql
-- Ejecutar en Supabase SQL Editor:
-- 1. supabase/migrations/20250805020000_fix_payroll_config_structure.sql
-- 2. Otras migraciones de empleados si existen
```

### **PASO 3: Configurar Variables de Entorno**
En Netlify Dashboard > Site Settings > Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### **PASO 4: Deploy y Test**
```bash
git add .
git commit -m "fix: restaurar empleados a Supabase - solución definitiva"
git push
```

## 📊 ESTRUCTURA DE TABLAS NECESARIA

### **employees**
```sql
CREATE TABLE employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    rut VARCHAR(15) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    nationality VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    -- ... otros campos
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **employment_contracts**
```sql
CREATE TABLE employment_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    contract_type VARCHAR(20) DEFAULT 'indefinido',
    start_date DATE NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL,
    -- ... otros campos
    status VARCHAR(20) DEFAULT 'active'
);
```

### **payroll_config**
```sql
CREATE TABLE payroll_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    afp_code VARCHAR(20) NOT NULL DEFAULT 'HABITAT',
    health_institution_code VARCHAR(20) NOT NULL DEFAULT 'FONASA',
    family_allowances INTEGER DEFAULT 0,
    legal_gratification_type VARCHAR(20) DEFAULT 'none',
    has_unemployment_insurance BOOLEAN DEFAULT true
);
```

## 🎉 RESULTADO ESPERADO

**Los empleados ahora se guardarán permanentemente en Supabase**:
- ✅ **Persistencia real** - No se pierden con restart del servidor
- ✅ **Acumulativo** - Los empleados se van sumando
- ✅ **Relacional** - Con contratos y configuración previsional
- ✅ **Colaborativo** - Accesible desde cualquier dispositivo
- ✅ **Respaldado** - Supabase maneja backups automáticos

## 🔧 ARCHIVOS MODIFICADOS

1. **`src/app/api/payroll/employees/route.ts`** - API completamente restaurada a Supabase
2. **`.env.production`** - Limpiado para configuración del usuario
3. **Este archivo** - Documentación de la solución

---

**IMPORTANTE**: Una vez que configures las credenciales Supabase correctas, los empleados se guardarán en la base de datos real y **NUNCA MÁS se perderán**.