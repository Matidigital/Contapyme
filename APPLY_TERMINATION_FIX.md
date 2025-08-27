# 🔧 SOLUCIÓN PARA PÁGINA QUE NO CARGA - SISTEMA DE FINIQUITOS

## 📋 PROBLEMA IDENTIFICADO

La página no carga porque falta la migración del sistema de finiquitos en la base de datos de Supabase.

## ✅ SOLUCIÓN PASO A PASO

### 1. Acceder a Supabase Dashboard
1. Ir a: https://supabase.com/dashboard
2. Iniciar sesión
3. Seleccionar proyecto: `yttdnmokivtayeunlvlk` (ContaPyme)

### 2. Aplicar Migración SQL
1. En el dashboard, ir a **SQL Editor** (panel izquierdo)
2. Crear nueva query
3. Copiar y pegar TODO el contenido del archivo: `apply_termination_migration.sql`
4. Ejecutar la query (botón **RUN**)

### 3. Verificar Tablas Creadas
Después de ejecutar, verificar que se crearon las tablas:
```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('employee_terminations', 'termination_causes');
```

## 📊 TABLAS QUE SE CREARÁN

### `employee_terminations`
- Tabla principal para registrar finiquitos
- 30+ campos especializados
- Cálculos automáticos de indemnizaciones

### `termination_causes`  
- Causales de término según Código del Trabajo
- 9 causales pre-cargadas (Art. 159, 160, 161, 163bis)
- Configuración automática de avisos e indemnizaciones

## 🚀 RESULTADO ESPERADO

Después de aplicar la migración:
- ✅ Página `/payroll/terminations` cargará correctamente
- ✅ API `/api/payroll/terminations` funcionará
- ✅ Sistema completo de finiquitos disponible
- ✅ Generación automática de cartas y finiquitos

## 🔍 EN CASO DE ERROR

Si hay algún error al ejecutar:
1. Revisar logs en Supabase Dashboard
2. Ejecutar queries individualmente (una tabla a la vez)
3. Verificar permisos de usuario en el proyecto

## 📞 ESTADO FINAL

Una vez aplicada la migración, el sistema de finiquitos estará **100% funcional**:
- Creación de finiquitos con cálculos automáticos
- Generación de documentos legales (PDF/HTML)
- Cumplimiento normativa laboral chilena
- Integración completa con sistema de empleados