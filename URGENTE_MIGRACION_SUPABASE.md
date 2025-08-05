# 🚨 URGENTE: MIGRACIÓN SUPABASE REQUERIDA

## **ERROR 404 - CAUSA IDENTIFICADA**

El error 404 que estás viendo es porque **las tablas de la base de datos no existen** en Supabase de producción.

### **🔧 SOLUCIÓN INMEDIATA:**

1. **Ve a Supabase Dashboard**: https://supabase.com/dashboard
2. **Selecciona tu proyecto ContaPyme** 
3. **Ve a SQL Editor** (ícono de base de datos)
4. **Copia y pega TODO el contenido** del archivo:
   `supabase/migrations/20250805000000_payroll_module.sql`
5. **Ejecuta la consulta** (botón "Run")

### **📋 CONTENIDO CRÍTICO DE LA MIGRACIÓN:**

```sql
-- Actualizar tabla employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Crear tabla payroll_config
CREATE TABLE IF NOT EXISTS payroll_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    afp_name VARCHAR(50) NOT NULL,
    health_system VARCHAR(10) NOT NULL,
    -- ... resto de campos
);

-- Crear función de validación RUT
CREATE OR REPLACE FUNCTION validate_chilean_rut(rut TEXT) RETURNS BOOLEAN AS $$
-- ... código de validación
$$ LANGUAGE plpgsql;

-- Y muchas más tablas y funciones...
```

### **⚡ DESPUÉS DE EJECUTAR:**

- ✅ La página de empleados funcionará
- ✅ El RutInput guardará datos
- ✅ Las APIs responderán correctamente  
- ✅ El cálculo de liquidaciones funcionará

### **🎯 ARCHIVO COMPLETO:**

El archivo completo está en:
`C:\Users\Matías Riquelme\Desktop\Proyectos\Contapymepuq\supabase\migrations\20250805000000_payroll_module.sql`

---

**⏰ EJECUTAR AHORA PARA RESOLVER EL ERROR 404**