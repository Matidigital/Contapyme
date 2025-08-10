# 🔧 CONFIGURAR SUPABASE PARA ENTIDADES RCV

## ❌ Problema Actual
Al intentar crear una entidad RCV en https://funny-elf-4be477.netlify.app/accounting/configuration, obtienes un error porque las tablas necesarias no existen en Supabase.

## ✅ Solución Paso a Paso

### **1. Crear tabla `companies` (si no existe)**
```sql
-- Ejecutar en Supabase SQL Editor
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_rut VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos de demo
INSERT INTO companies (id, company_name, company_rut) 
VALUES ('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'ContaPyme Demo', '76.123.456-7')
ON CONFLICT (id) DO NOTHING;
```

### **2. Ejecutar migración completa de RCV Entities**
Copia y ejecuta todo el contenido del archivo:
`supabase/migrations/20250810140000_rcv_entities.sql`

### **3. Insertar datos de demo**
```sql
-- Datos de ejemplo para probar inmediatamente
INSERT INTO rcv_entities (
    company_id,
    entity_name,
    entity_rut,
    entity_business_name,
    entity_type,
    account_code,
    account_name,
    account_type,
    default_tax_rate,
    is_tax_exempt
) VALUES 
-- Proveedores comunes
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'Empresa ABC Ltda.', '76.123.456-7', 'Empresa ABC Limitada', 'supplier', '2.1.1.001', 'Proveedores Nacionales', 'liability', 19.0, false),
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'Servicios XYZ SpA', '96.789.123-4', 'Servicios XYZ Sociedad Por Acciones', 'supplier', '2.1.1.001', 'Proveedores Nacionales', 'liability', 19.0, false),
-- Clientes comunes  
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'Cliente Principal S.A.', '90.555.666-7', 'Cliente Principal Sociedad Anónima', 'customer', '1.1.1.001', 'Clientes Nacionales', 'asset', 19.0, false),
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'Distribuidora Norte', '85.111.222-3', 'Distribuidora Norte Limitada', 'customer', '1.1.1.001', 'Clientes Nacionales', 'asset', 19.0, false)
ON CONFLICT (company_id, entity_rut) DO NOTHING;
```

### **4. Verificar instalación**
```sql
-- Verificar que las tablas existen y tienen datos
SELECT COUNT(*) as total_companies FROM companies;
SELECT COUNT(*) as total_entities FROM rcv_entities;
SELECT * FROM rcv_entities WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce';
```

## 📋 **Variables de Entorno Requeridas**
Asegúrate de que estén configuradas en Netlify:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_key
```

## 🎯 **Después de la Configuración**

1. **Recarga la página**: https://funny-elf-4be477.netlify.app/accounting/configuration
2. **Verifica entidades existentes**: Deberías ver 4 entidades de demo en la sección "Entidades Registradas RCV"
3. **Prueba crear nueva entidad**: Haz clic en "Nueva Entidad" y completa el formulario

## 🚀 **Testing Inmediato**

### **Entidad de Ejemplo para Crear:**
- **Nombre**: Mi Proveedor Test
- **RUT**: 12.345.678-9
- **Tipo**: Proveedor
- **Cuenta**: 2.1.1.001 - Proveedores Nacionales
- **IVA**: 19%

---

Una vez ejecutados estos pasos, la funcionalidad de crear entidades RCV debería funcionar perfectamente.