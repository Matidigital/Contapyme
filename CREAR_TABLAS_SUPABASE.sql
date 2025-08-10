-- 🔧 SCRIPT COMPLETO PARA CREAR TABLAS RCV EN SUPABASE
-- Copia y pega todo este contenido en Supabase SQL Editor

-- 1. CREAR TABLA COMPANIES (si no existe)
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_rut VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. INSERTAR COMPANY DEMO
INSERT INTO companies (id, company_name, company_rut) 
VALUES ('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'ContaPyme Demo', '76.123.456-7')
ON CONFLICT (id) DO NOTHING;

-- 3. CREAR TABLA RCV_ENTITIES
CREATE TABLE IF NOT EXISTS rcv_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Datos de la entidad
    entity_name VARCHAR(255) NOT NULL,
    entity_rut VARCHAR(20) NOT NULL,
    entity_business_name VARCHAR(255),
    entity_type VARCHAR(50) DEFAULT 'supplier' CHECK (entity_type IN ('supplier', 'customer', 'both')),
    
    -- Configuración contable
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50),
    
    -- Configuración adicional
    default_tax_rate DECIMAL(5,2) DEFAULT 19.0,
    is_tax_exempt BOOLEAN DEFAULT false,
    
    -- Metadatos
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(company_id, entity_rut),
    CONSTRAINT valid_rut_format CHECK (entity_rut ~ '^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9K]$')
);

-- 4. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_rcv_entities_company_id ON rcv_entities(company_id);
CREATE INDEX IF NOT EXISTS idx_rcv_entities_rut ON rcv_entities(entity_rut);
CREATE INDEX IF NOT EXISTS idx_rcv_entities_name ON rcv_entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_rcv_entities_account_code ON rcv_entities(account_code);
CREATE INDEX IF NOT EXISTS idx_rcv_entities_active ON rcv_entities(is_active) WHERE is_active = true;

-- 5. CREAR FUNCIÓN DE ACTUALIZACIÓN
CREATE OR REPLACE FUNCTION update_rcv_entities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CREAR TRIGGER
DROP TRIGGER IF EXISTS trigger_rcv_entities_updated_at ON rcv_entities;
CREATE TRIGGER trigger_rcv_entities_updated_at
    BEFORE UPDATE ON rcv_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_rcv_entities_updated_at();

-- 7. INSERTAR DATOS DE PRUEBA
INSERT INTO rcv_entities (
    company_id, entity_name, entity_rut, entity_business_name, entity_type,
    account_code, account_name, account_type, default_tax_rate, is_tax_exempt
) VALUES 
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'Empresa ABC Ltda.', '76.123.456-7', 'Empresa ABC Limitada', 'supplier', '2.1.1.001', 'Proveedores Nacionales', 'liability', 19.0, false),
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'Servicios XYZ SpA', '96.789.123-4', 'Servicios XYZ SpA', 'supplier', '2.1.1.001', 'Proveedores Nacionales', 'liability', 19.0, false),
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'Cliente Principal S.A.', '90.555.666-7', 'Cliente Principal SA', 'customer', '1.1.1.001', 'Clientes Nacionales', 'asset', 19.0, false)
ON CONFLICT (company_id, entity_rut) DO NOTHING;

-- 8. VERIFICAR INSTALACIÓN
SELECT 'COMPANIES' as tabla, COUNT(*) as total FROM companies
UNION ALL
SELECT 'RCV_ENTITIES' as tabla, COUNT(*) as total FROM rcv_entities;

-- 9. MOSTRAR DATOS CREADOS
SELECT entity_name, entity_rut, entity_type, account_name FROM rcv_entities WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce';