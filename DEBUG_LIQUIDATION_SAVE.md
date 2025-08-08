# DEBUG: Error 500 en liquidation save

## 🚨 PROBLEMA

**Error**: `Failed to load resource: the server responded with a status of 500`
**Endpoint**: `/api/payroll/liquidations/save?company_id=8033ee69-b420-4d91-ba0e-482f46cd6fce`

## ✅ PROGRESO ACTUAL

- ✅ AFP configuración dinámica funciona: `🧮 Creando calculadora con configuración DINÁMICA`
- ✅ Comisiones AFP correctas por empleado (arreglado mapeo payroll_config)
- ❌ Save API devuelve 500 error

## 🔍 POSIBLES CAUSAS

### 1. Tabla payroll_liquidations no existe
**VERIFICAR** en Supabase SQL Editor:
```sql
-- Verificar si existe la tabla
SELECT * FROM information_schema.tables 
WHERE table_name = 'payroll_liquidations';

-- Verificar estructura
\d payroll_liquidations;
```

### 2. Campo faltante o tipo incorrecto
**REVISAR** schema vs datos enviados en debugger

### 3. RLS Policy bloqueando inserción
**VERIFICAR** que service role bypassa RLS

### 4. Company_id o Employee_id inválido
**VERIFICAR** que employee existe:
```sql
SELECT id, first_name, last_name 
FROM employees 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;
```

## 🚀 PASOS DE DEBUG

1. **Verificar tabla existe** en Supabase
2. **Revisar logs Netlify** Functions para error específico  
3. **Probar endpoint directo** con Postman/curl
4. **Revisar campos obligatorios** vs enviados

## 📋 CHECKLIST

- [ ] ⏳ Tabla payroll_liquidations existe
- [ ] ⏳ Migration ejecutada correctamente
- [ ] ⏳ Employee_id válido existe  
- [ ] ⏳ Campos enviados vs schema match
- [ ] ⏳ Service role bypassa RLS

## 🎯 SOLUCIÓN ESPERADA

Después de debug, save API debería:
1. Recibir datos liquidation correctos
2. Insertar en payroll_liquidations sin error
3. Retornar success: true con ID de liquidación
4. Permitir guardado exitoso desde frontend