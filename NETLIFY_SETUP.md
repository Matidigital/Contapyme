# 🚀 CONFIGURACIÓN NETLIFY - SISTEMA F29 COMPARATIVO

## 📋 VARIABLES DE ENTORNO REQUERIDAS

Para que el sistema funcione correctamente en Netlify, necesitas configurar estas variables de entorno en tu panel de Netlify:

### **Variables Supabase (REQUERIDAS)**

```env
# URL pública de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave de servicio con privilegios completos
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...tu-service-key

# Clave pública (opcional, ya incluida en NEXT_PUBLIC_SUPABASE_URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...tu-anon-key
```

### **Variables del Sistema (OPCIONALES)**

```env
# Confirmar que estamos en Netlify
NETLIFY=true

# Ambiente de producción
NODE_ENV=production
```

## 🔧 PASOS PARA CONFIGURAR EN NETLIFY

### **1. Obtener Credenciales de Supabase**

1. Ve a https://supabase.com y accede a tu proyecto
2. En el panel izquierdo: **Settings** → **API**
3. Copia estos valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **MANTÉN ESTO SECRETO**

### **2. Configurar en Netlify**

1. Ve a tu sitio en Netlify Dashboard
2. **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Agrega una por una las variables de arriba

### **3. Verificar Configuración**

```bash
# Las migraciones ya están aplicadas en:
supabase/migrations/20250801000000_f29_analysis_tables.sql

# Tablas creadas:
- f29_forms
- f29_comparative_analysis  
- f29_insights_notifications
```

## 📊 FUNCIONALIDADES DISPONIBLES

✅ **Upload múltiple de F29** - `/api/f29/batch-upload`
✅ **Generación de datos demo** - `/api/f29/demo-data`
✅ **Análisis comparativo automático** - Integrado en batch-upload
✅ **Dashboard temporal** - `/accounting/f29-comparative`

## 🎯 ENDPOINTS PRINCIPALES

```
GET  /accounting/f29-comparative       # Dashboard principal
POST /api/f29/batch-upload            # Upload múltiple
POST /api/f29/demo-data              # Generar datos de ejemplo
```

## ⚡ CARACTERÍSTICAS DEL SISTEMA

- **100% Supabase**: Sin dependencias SQLite
- **API Routes**: Funcionan en Netlify Functions
- **Análisis automático**: Genera insights en tiempo real
- **Multi-archivo**: Hasta 24 F29 simultáneos
- **Validación robusta**: Sistema de confianza 0-100%

## 🔍 TROUBLESHOOTING

### **Error: "Missing environment variables"**
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` estén configuradas
- Redeploya el sitio después de agregar variables

### **Error: "Database connection failed"**
- Confirma que las credenciales de Supabase sean correctas
- Verifica que las migraciones estén aplicadas en tu proyecto Supabase

### **Error: "API routes not working"**
- Asegúrate de que no tengas `output: 'export'` en next.config.js
- Las API routes necesitan Netlify Functions habilitadas

## 📈 PRÓXIMOS PASOS

1. **Configurar variables** según esta guía
2. **Hacer redeploy** en Netlify
3. **Probar upload** con F29 reales
4. **Generar datos demo** para mostrar funcionalidad
5. **Compartir URL** con tu colega

---

**Estado**: Sistema simplificado para Netlify ✅  
**Fecha**: 1 de agosto, 2025  
**Desarrolladores**: Matías Riquelme + Claude Sonnet 4