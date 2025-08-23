# 🚀 Ejecutar Migración Previred - Datos Adicionales

## 📋 Instrucciones para aplicar la migración

### Opción 1: Dashboard de Supabase (RECOMENDADO)

1. **Acceder al Dashboard de Supabase**:
   - Ir a https://supabase.com/dashboard
   - Seleccionar el proyecto ContaPyme

2. **SQL Editor**:
   - Click en "SQL Editor" en el menú lateral
   - Click en "New query"

3. **Copiar y ejecutar el SQL**:
   - Abrir archivo: `supabase/migrations/20250822160000_previred_additional_data.sql`
   - Copiar todo el contenido
   - Pegar en el SQL Editor
   - Click en "Run" ▶️

4. **Verificar ejecución**:
   - Si sale "Success. No rows returned" = ✅ Migración exitosa
   - Si hay errores = Revisar logs y corregir

### Opción 2: Supabase CLI (Si está instalado)

```bash
cd Proyectos/Contapymepuq
npx supabase db push
```

### Opción 3: Script de verificación

```bash
cd Proyectos/Contapymepuq
node verify_previred_migration.js
```

## 🎯 Lo que hace esta migración

### ✅ Campos agregados a `payroll_liquidations`:
- `start_work_date` - Fecha inicio trabajo en período
- `end_work_date` - Fecha fin trabajo en período  
- `incorporation_workplace_amount` - Monto incorporación lugar trabajo
- `sick_leave_days` - Días de licencia médica
- `sick_leave_start_date` - Inicio licencia médica
- `sick_leave_end_date` - Fin licencia médica
- `sick_leave_amount` - Monto subsidio licencia
- `vacation_days` - Días de vacaciones
- `vacation_amount` - Monto vacaciones
- `partial_period_reason` - Razón período parcial
- `previred_notes` - Notas adicionales Previred
- `movement_code` - Código movimiento personal
- `worker_type_code` - Tipo trabajador  
- `has_special_regime` - Régimen especial

### ✅ Tablas nuevas creadas:
- `previred_personnel_movements` - Movimientos de personal
- `previred_concepts` - Conceptos pre-configurados

### ✅ Funciones PostgreSQL:
- `calculate_proportional_amount()` - Cálculo proporcional
- `get_previred_concepts_by_company()` - Consulta conceptos

### ✅ Conceptos pre-insertados:
- INCORP_WORKPLACE - Incorporación en lugar trabajo
- SICK_LEAVE_SUBSIDY - Subsidio licencia médica  
- VACATION_BONUS - Bono vacaciones proporcional
- PARTIAL_MONTH_ADJUST - Ajuste mes parcial

## 📊 Verificar que funcionó

### 1. Verificar campos nuevos:
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payroll_liquidations' 
AND column_name IN (
  'incorporation_workplace_amount',
  'sick_leave_days', 
  'previred_notes'
);
```

### 2. Verificar tabla conceptos:
```sql
SELECT * FROM previred_concepts WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce';
```

### 3. Verificar funciones:
```sql
SELECT calculate_proportional_amount(1000000, 15, 30); -- Debe retornar 500000
```

## 🔧 Solución de problemas

### Error: "relation does not exist"
- Verificar que las tablas base (`payroll_liquidations`, `companies`) existan
- Ejecutar migraciones anteriores primero

### Error: "function already exists"  
- Las funciones usan `CREATE OR REPLACE` - debe funcionar
- Si persiste, eliminar manualmente y volver a crear

### Error: "duplicate key value"
- Los conceptos ya existen para la empresa
- Es normal, usar `ON CONFLICT DO NOTHING` si es necesario

## ✅ Estado actual del sistema

Una vez ejecutada esta migración:

1. **Componente `PreviredAdditionalDataForm`** ✅ Funcional
2. **API `/api/payroll/previred-concepts`** ✅ Funcional  
3. **Integración en liquidaciones** ✅ Lista
4. **Cálculos automáticos** ✅ Disponibles
5. **Exportación Previred corregida** ✅ Con errores arreglados

## 🎯 Próximo paso

Después de ejecutar la migración:
- Ir a `/payroll/liquidations/generate`
- Probar el formulario de datos adicionales Previred
- Verificar que los cálculos automáticos funcionan
- Generar una liquidación de prueba con datos parciales

---

**Fecha**: 22 de agosto 2025  
**Sistema**: ContaPyme - Módulo Remuneraciones  
**Funcionalidad**: Datos adicionales Previred para períodos parciales