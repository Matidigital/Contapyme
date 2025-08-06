# 🚀 INSTRUCCIONES: FIX INMEDIATO LIQUIDACIONES

## ⚡ SOLUCIÓN EN 5 MINUTOS

### PASO 1: Ir a Supabase Dashboard
1. **Abrir:** https://supabase.com/dashboard
2. **Navegar:** Proyecto ContaPyme → SQL Editor
3. **Crear:** Nueva consulta

### PASO 2: Ejecutar el Fix
1. **Abrir el archivo:** `FIX_LIQUIDACIONES_INMEDIATO.sql` 
2. **Copiar todo el contenido** del archivo
3. **Pegar** en SQL Editor de Supabase
4. **Ejecutar** (botón Run o Ctrl+Enter)

### PASO 3: Verificar Resultados
Deberías ver algo como:
```
✅ Fix aplicado exitosamente
empresas_creadas: 1
empleados_creados: 2  
contratos_creados: 2

Empleados creados:
Juan Carlos González | 12.345.678-9 | Contador Senior | $1,200,000 | indefinido | ✅ Activo
María Elena Rodríguez | 11.111.111-1 | Asistente Admin | $800,000 | indefinido | ✅ Activo
```

## ✅ QUE HACE ESTE FIX

### Crea la empresa con ID correcto:
- **ID:** `8033ee69-b420-4d91-ba0e-482f46cd6fce` ← El que busca el frontend
- **Nombre:** ContaPyme Demo Enterprise
- **Estado:** Activo con funciones de nómina habilitadas

### Crea 2 empleados demo:
- **Juan Carlos González** - Contador Senior ($1,200,000)
- **María Elena Rodríguez** - Asistente Admin ($800,000)

### Crea contratos activos:
- Contratos indefinidos (con cesantía 0.6%)
- Sueldos base configurados
- Fechas de inicio definidas

### Configura previsión social:
- AFP (HABITAT/PROVIDA)
- Salud (FONASA)
- Cargas familiares

## 🎯 RESULTADO ESPERADO

**ANTES del fix:**
- ❌ Error 500 "company_id es requerido"
- ❌ No se cargan empleados
- ❌ No funciona guardado

**DESPUÉS del fix:**
- ✅ Sistema 100% funcional
- ✅ Carga empleados correctamente
- ✅ Calcula liquidaciones en tiempo real
- ✅ Guarda en base de datos
- ✅ Lista histórico de liquidaciones

## 🔧 TROUBLESHOOTING

### Si sale error en Supabase:
1. **Verificar que estás en el proyecto correcto** 
2. **Intentar ejecutar línea por línea** (dividir el script)
3. **Verificar permisos** de escritura en las tablas

### Si siguen los errores:
1. **Verificar variables de entorno** en Netlify
2. **Confirmar URLs** de Supabase
3. **Revisar RLS policies** en las tablas

## 🎉 PRÓXIMOS PASOS

Una vez ejecutado el fix:

1. **Ir a la app:** `/payroll/liquidations/generate`
2. **Seleccionar empleado:** Juan Carlos o María Elena
3. **Configurar datos:** Período, días trabajados, haberes/descuentos
4. **Ver previsualización** en tiempo real
5. **Hacer clic:** "Generar y Guardar"
6. **Verificar:** Se guarda y redirige al histórico

## 📞 SOPORTE

Si el fix no funciona:
1. **Revisar consola** del navegador (F12)
2. **Verificar logs** de Netlify
3. **Confirmar conexión** a Supabase
4. **Ejecutar:** `/api/payroll/liquidations/test` para diagnóstico

¡Una vez ejecutado, tendrás el sistema de liquidaciones más avanzado para PyMEs chilenas! 🇨🇱