# DEBUG: Error 500 en /api/payroll/settings

## 🚨 PROBLEMA IDENTIFICADO

**Error**: `Failed to load resource: the server responded with a status of 500`
**Endpoint**: `/api/payroll/settings?company_id=8033ee69-b420-4d91-ba0e-482f46cd6fce`

## ✅ CORRECCIÓN APLICADA

1. **Company ID corregido**: `DEMO_COMPANY.id` actualizado de `demo-company-12345678-9` → `8033ee69-b420-4d91-ba0e-482f46cd6fce`

## 🔍 POSIBLES CAUSAS RESTANTES

### 1. Variables de Entorno en Netlify
**VERIFICAR** que estas variables estén configuradas en Netlify Dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://xytgylsdxtzkqcjlgqvk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Company No Existe en Supabase
**EJECUTAR** en Supabase SQL Editor:

```sql
-- Verificar que la company existe
SELECT id, name, rut FROM companies 
WHERE id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

-- Verificar payroll_settings
SELECT company_id FROM payroll_settings 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;
```

### 3. RLS (Row Level Security) Activo
La migración desactivó RLS, pero puede haberse reactivado:

```sql
-- Desactivar RLS temporalmente
ALTER TABLE payroll_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
```

### 4. Problemas de Red/Timeout
El API puede estar colgándose por timeouts de conexión.

## 🚀 PASOS DE DEBUG

1. **Ejecutar** `VERIFY_COMPANY_ID.sql` en Supabase
2. **Verificar** variables de entorno en Netlify
3. **Probar** endpoint directamente: `https://funny-elf-4be477.netlify.app/api/payroll/settings?company_id=8033ee69-b420-4d91-ba0e-482f46cd6fce`
4. **Revisar** logs de Netlify Functions

## 📋 CHECKLIST DE VERIFICACIÓN

- [x] ✅ Company ID corregido en CompanyContext
- [ ] ⏳ Variables de entorno en Netlify
- [ ] ⏳ Company existe en Supabase  
- [ ] ⏳ RLS desactivado para pruebas
- [ ] ⏳ API responde correctamente

## 🎯 RESULTADO ESPERADO

Después de las correcciones, `/payroll/settings` debería:
1. Cargar sin error 500
2. Mostrar configuración AFP
3. Permitir editar valores
4. Guardar cambios correctamente