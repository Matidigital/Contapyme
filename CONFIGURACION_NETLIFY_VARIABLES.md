# 🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO NETLIFY

## 📋 VARIABLES REQUERIDAS PARA PRODUCCIÓN

### **1. Supabase Configuration (CRÍTICAS)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://yttdnmokivtayeunlvlk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[TU_SERVICE_ROLE_KEY_DE_SUPABASE]
```

### **2. App Configuration**
```bash
NEXT_PUBLIC_COMPANY_ID=8033ee69-b420-4d91-ba0e-482f46cd6fce
NEXT_PUBLIC_ENVIRONMENT=production
```

### **3. Optional (Recomendadas)**
```bash
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_DEBUG=false
```

## 🚀 PASOS DE CONFIGURACIÓN

### **Paso 1: Obtener Service Role Key**
1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/yttdnmokivtayeunlvlk
2. Settings → API → Project API keys  
3. Copia el **service_role** key (NO el anon key)

### **Paso 2: Configurar en Netlify**
1. Ve a Netlify Dashboard: https://app.netlify.com/sites/funny-elf-4be477/settings/deploys
2. Sección: "Environment variables"
3. Click "Add variable" para cada una:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: [El service role key copiado]
   - Name: `NEXT_PUBLIC_SUPABASE_URL` 
   - Value: `https://xytgylsdxtzkqcjlgqvk.supabase.co`
   - Name: `NEXT_PUBLIC_COMPANY_ID`
   - Value: `8033ee69-b420-4d91-ba0e-482f46cd6fce`

### **Paso 3: Redeploy**
1. Netlify Dashboard → Deploys
2. Click "Trigger deploy" 
3. Esperar 2-3 minutos para deployment

## ✅ VERIFICACIÓN POST-CONFIGURACIÓN

### **URLs de Testing:**
- **Homepage**: https://funny-elf-4be477.netlify.app/
- **Dashboard**: https://funny-elf-4be477.netlify.app/accounting
- **Payroll**: https://funny-elf-4be477.netlify.app/payroll
- **Liquidaciones**: https://funny-elf-4be477.netlify.app/payroll/liquidations/generate

### **Checklist de Funcionalidad:**
- [ ] Página carga sin errores de consola
- [ ] Lista de empleados se carga correctamente
- [ ] Sistema de gratificación Art. 50 visible
- [ ] Cálculo en tiempo real funciona
- [ ] PDF de liquidación se genera correctamente

## 🚨 TROUBLESHOOTING

### **Error: "SUPABASE_SERVICE_ROLE_KEY no está configurada"**
- ✅ Verificar que la variable está en Netlify Environment variables
- ✅ Confirmar que el key es el **service_role** (no anon)
- ✅ Redeploy después de agregar variables

### **Error: "TypeError: fetch failed"**
- ✅ Verificar URL de Supabase
- ✅ Confirmar permisos del service role key
- ✅ Verificar estado del proyecto Supabase

### **Empleados no cargan**
- ✅ Verificar COMPANY_ID correcto
- ✅ Confirmar tablas employees existen en Supabase
- ✅ Verificar RLS policies

## 🎯 FUNCIONALIDADES QUE SE ACTIVARÁN

### **Después de configurar correctamente:**
- ✅ **Sistema F29** completo con análisis
- ✅ **Módulo Payroll** con gratificación Art. 50
- ✅ **Indicadores económicos** tiempo real
- ✅ **Activos fijos** con depreciación
- ✅ **Plan de cuentas IFRS** editable
- ✅ **Dashboard ejecutivo** con métricas

### **Valor Diferenciador Único:**
**Primer sistema PyME chileno con gratificación legal calculada dinámicamente desde indicadores económicos oficiales.**

---

**Fecha**: Agosto 2025  
**Sistema**: ContaPyme v2.0  
**Deploy**: Netlify Production  
**Database**: Supabase