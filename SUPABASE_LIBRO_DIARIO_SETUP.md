# 🗄️ CONFIGURACIÓN BASE DE DATOS LIBRO DIARIO - SUPABASE

## 📋 INSTRUCCIONES PARA EJECUTAR MIGRACIÓN

### **Paso 1: Acceder a Supabase Dashboard**
1. Ve a: **https://app.supabase.com/project/xytgylsdxtzkqcjlgqvk**
2. En el menú lateral, selecciona **"SQL Editor"**

### **Paso 2: Ejecutar Migración del Libro Diario**
1. Crea una nueva query en el SQL Editor
2. Copia y pega el contenido completo del archivo: `supabase/migrations/20250805000000_libro_diario.sql`
3. Haz clic en **"Run"** para ejecutar la migración

### **Paso 3: Verificar Tablas Creadas**
Después de ejecutar la migración, deberías ver las siguientes tablas nuevas:

#### **Tablas Principales:**
- ✅ `journal_entries` - Asientos contables principales
- ✅ `journal_entry_lines` - Líneas detalladas de asientos (debe/haber)
- ✅ `journal_templates` - Plantillas para generación automática
- ✅ `journal_account_mapping` - Mapeo de cuentas contables

#### **Funciones PostgreSQL:**
- ✅ `update_journal_entry_totals()` - Actualización automática de totales
- ✅ `generate_journal_entries_from_f29()` - Generación desde F29
- ✅ `generate_depreciation_entries()` - Generación de depreciación
- ✅ `get_journal_entries()` - Consulta con filtros
- ✅ `get_journal_statistics()` - Estadísticas del libro diario

### **Paso 4: Verificar Datos Demo**
La migración incluye datos demo para probar inmediatamente:
- 2 asientos de ejemplo
- Plantillas de generación automática
- Mapeos de cuentas contables base

### **Paso 5: Probar APIs**
Una vez ejecutada la migración, las siguientes APIs estarán disponibles:
- `GET/POST /api/accounting/journal` - CRUD asientos
- `POST /api/accounting/journal/generate-from-f29` - Generación desde F29
- `POST /api/accounting/journal/generate-from-assets` - Depreciación
- `GET /api/accounting/journal/export` - Exportación

---

## 🔧 ALTERNATIVA: EJECUCIÓN MANUAL PASO A PASO

Si prefieres ejecutar la migración por partes, puedes hacerlo en este orden:

### **1. Crear Tablas Principales:**
```sql
-- Ejecutar primero las tablas journal_entries y journal_entry_lines
```

### **2. Crear Tablas Auxiliares:**
```sql
-- Ejecutar journal_templates y journal_account_mapping
```

### **3. Crear Funciones:**
```sql
-- Ejecutar las funciones PostgreSQL una por una
```

### **4. Insertar Datos Demo:**
```sql
-- Ejecutar los INSERT finales
```

---

## ✅ VERIFICACIÓN DE ÉXITO

### **Query de Verificación:**
Ejecuta esta query para verificar que todo se creó correctamente:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'journal%';

-- Verificar funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%journal%' 
OR routine_name LIKE '%depreciation%';

-- Verificar datos demo
SELECT 
  'journal_entries' as tabla, 
  count(*) as registros 
FROM journal_entries
UNION ALL
SELECT 
  'journal_templates' as tabla, 
  count(*) as registros 
FROM journal_templates
UNION ALL
SELECT 
  'journal_account_mapping' as tabla, 
  count(*) as registros 
FROM journal_account_mapping;
```

**Resultado esperado:**
- 4 tablas journal_*
- 6+ funciones
- 2 asientos demo, 4 templates, 9+ mapeos

---

## 🚨 RESOLUCIÓN DE ERRORES COMUNES

### **Error: "relation does not exist"**
- **Causa**: Intentar crear función antes que tabla
- **Solución**: Ejecutar tablas primero, luego funciones

### **Error: "function already exists"**
- **Causa**: Re-ejecutar migración
- **Solución**: Usar `DROP FUNCTION IF EXISTS` antes de crear

### **Error: "permission denied"**
- **Causa**: Usuario sin permisos
- **Solución**: Ejecutar como admin en Supabase Dashboard

---

## 📊 INFORMACIÓN DE CONEXIÓN

### **Configuración Supabase (ya en .env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL="https://xytgylsdxtzkqcjlgqvk.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **Base de Datos:**
- **Proyecto**: xytgylsdxtzkqcjlgqvk
- **URL**: https://xytgylsdxtzkqcjlgqvk.supabase.co
- **Dashboard**: https://app.supabase.com/project/xytgylsdxtzkqcjlgqvk

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE LA MIGRACIÓN

1. **Verificar que el frontend carga**: `/accounting/journal`
2. **Probar generación automática**: Desde F29 y activos fijos
3. **Validar exportación**: Descarga de CSV
4. **Comprobar filtros**: Búsqueda y filtrado funcionando

---

**📝 NOTA IMPORTANTE:**
La migración es **idempotente** - puedes ejecutarla múltiples veces sin problemas. Los datos demo se insertarán con `ON CONFLICT DO NOTHING`.

**🕒 Tiempo estimado**: 2-3 minutos para ejecutar completamente.