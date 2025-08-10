# 📊 CONFIGURACIÓN SISTEMA RCV EN SUPABASE

## 🎯 Objetivo
Configurar las tablas necesarias en Supabase para almacenar los datos del Registro de Compras y Ventas (RCV) de forma relacional.

## 📋 Pasos para Configurar en Supabase

### 1. **Acceder al Editor SQL de Supabase**
- Ve a tu proyecto Supabase: https://app.supabase.com
- Navega a **SQL Editor** en el panel izquierdo
- Crea una nueva consulta

### 2. **Ejecutar el Script de Migración**
Copia y pega el contenido completo del archivo:
```
supabase/migrations/20250810180000_rcv_system_tables.sql
```

Este script creará:
- ✅ **4 tablas principales**: `purchase_ledger`, `sales_ledger`, `purchase_document`, `sale_document`
- ✅ **Índices optimizados** para consultas rápidas
- ✅ **Funciones PostgreSQL** para resúmenes automáticos
- ✅ **Triggers** para actualización automática de timestamps
- ✅ **Comentarios** de documentación

### 3. **Verificar las Tablas Creadas**
Ejecuta estas consultas para verificar:

```sql
-- Verificar que todas las tablas existan
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('purchase_ledger', 'sales_ledger', 'purchase_document', 'sale_document');

-- Verificar estructura de purchase_ledger
\d purchase_ledger;

-- Verificar funciones creadas
SELECT proname FROM pg_proc WHERE proname IN ('get_purchase_summary', 'get_sales_summary');
```

### 4. **Configurar Permisos RLS (Row Level Security)**
```sql
-- Habilitar RLS en las tablas
ALTER TABLE purchase_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_document ENABLE ROW LEVEL SECURITY;

-- Política para purchase_ledger (permitir todo por ahora - ajustar según necesidad)
CREATE POLICY "purchase_ledger_policy" ON purchase_ledger FOR ALL USING (true);

-- Política para sales_ledger
CREATE POLICY "sales_ledger_policy" ON sales_ledger FOR ALL USING (true);

-- Política para purchase_document
CREATE POLICY "purchase_document_policy" ON purchase_document FOR ALL USING (true);

-- Política para sale_document
CREATE POLICY "sale_document_policy" ON sale_document FOR ALL USING (true);
```

## 🧪 Testing de la Base de Datos

### Test 1: Insertar Datos de Prueba
```sql
-- Test purchase_ledger
INSERT INTO purchase_ledger (
    company_id, 
    period_start, 
    period_end, 
    period_identifier,
    total_transactions,
    total_net_amount,
    unique_suppliers,
    file_name
) VALUES (
    '8033ee69-b420-4d91-ba0e-482f46cd6fce',
    '2025-08-01',
    '2025-08-31', 
    '2025-08',
    100,
    5000000,
    25,
    'test_compras_agosto_2025.csv'
);

-- Verificar inserción
SELECT * FROM purchase_ledger WHERE period_identifier = '2025-08';
```

### Test 2: Probar Funciones
```sql
-- Test función de resumen
SELECT * FROM get_purchase_summary(
    '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID, 
    '2025-08'
);
```

## 🔧 APIs Disponibles

Una vez configurada la BD, estas APIs estarán funcionando:

### 1. **Almacenar RCV**: `POST /api/rcv/store`
```json
{
  "company_id": "uuid",
  "rcv_data": { /* datos procesados */ },
  "file_metadata": { "file_name": "...", "file_size": 1234 },
  "rcv_type": "purchase" // o "sales"
}
```

### 2. **Consultar Compras**: `GET /api/rcv/purchase?company_id=uuid&period=2025-08`

### 3. **Consultar Ventas**: `GET /api/rcv/sales?company_id=uuid&period=2025-08`

### 4. **Eliminar Ledger**: `DELETE /api/rcv/purchase?ledger_id=uuid`

## 🎯 Flujo de Uso Complete

1. **Usuario sube CSV** en `/accounting/rcv-analysis`
2. **Selecciona tipo** (Compras/Ventas) y **habilita almacenamiento**
3. **Sistema procesa** archivo con `parseRCV()`
4. **Sistema almacena** automáticamente en BD con `/api/rcv/store`
5. **Usuario ve confirmación** de almacenamiento exitoso
6. **Datos quedan disponibles** para consultas futuras y reportes

## 📊 Estructura de Datos Almacenados

### **purchase_ledger / sales_ledger**
- Registro maestro por período/empresa
- Totales calculados y estadísticas
- Metadatos del archivo procesado

### **purchase_document / sale_document**  
- Cada línea del CSV como documento individual
- Todos los campos del RCV (30+ columnas)
- Relación con ledger maestro

## 🔍 Monitoreo y Mantenimiento

### Ver estadísticas de uso:
```sql
SELECT 
    period_identifier,
    COUNT(*) as ledgers,
    SUM(total_transactions) as total_docs,
    SUM(total_calculated_amount) as total_amount
FROM purchase_ledger 
GROUP BY period_identifier 
ORDER BY period_identifier DESC;
```

### Limpiar datos de prueba:
```sql
DELETE FROM purchase_document WHERE purchase_ledger_id IN (
    SELECT id FROM purchase_ledger WHERE file_name LIKE '%test%'
);
DELETE FROM purchase_ledger WHERE file_name LIKE '%test%';
```

---

## ✅ Checklist de Configuración

- [ ] Script de migración ejecutado en Supabase
- [ ] 4 tablas creadas correctamente  
- [ ] Índices y funciones funcionando
- [ ] Políticas RLS configuradas
- [ ] Test de inserción exitoso
- [ ] APIs respondiendo correctamente
- [ ] Interface web actualizada

Una vez completado este checklist, el sistema RCV estará completamente funcional con almacenamiento persistente en Supabase.