-- =============================================
-- MIGRACIÓN CONFIGURACIONES DE IMPUESTOS - VERSIÓN SIMPLIFICADA
-- COPIAR Y PEGAR EN SUPABASE SQL EDITOR
-- =============================================

-- Eliminar tabla si existe para recrearla con nueva estructura
DROP TABLE IF EXISTS tax_account_configurations CASCADE;

-- Crear tabla principal de configuraciones de impuestos (SIMPLIFICADA)
CREATE TABLE IF NOT EXISTS tax_account_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    
    -- Información del impuesto
    tax_type VARCHAR(50) NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    tax_rate DECIMAL(5,2),
    
    -- Asociación de cuentas SIMPLIFICADA
    sales_account_code VARCHAR(20),
    sales_account_name VARCHAR(255),
    purchases_account_code VARCHAR(20),
    purchases_account_name VARCHAR(255),
    
    -- Metadatos
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_company_tax_type UNIQUE (company_id, tax_type),
    CONSTRAINT valid_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_tax_config_company_id ON tax_account_configurations(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_config_tax_type ON tax_account_configurations(tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_config_active ON tax_account_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_tax_config_company_active ON tax_account_configurations(company_id, is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_tax_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tax_config_updated_at ON tax_account_configurations;
CREATE TRIGGER trigger_tax_config_updated_at
    BEFORE UPDATE ON tax_account_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_tax_config_updated_at();

-- Función para obtener configuraciones por empresa
CREATE OR REPLACE FUNCTION get_company_tax_configs(p_company_id UUID)
RETURNS SETOF tax_account_configurations AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM tax_account_configurations
    WHERE company_id = p_company_id 
    AND is_active = true
    ORDER BY tax_name;
END;
$$ LANGUAGE plpgsql;

-- Función para estadísticas
CREATE OR REPLACE FUNCTION get_tax_config_stats(p_company_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_configurations', COUNT(*),
        'active_configurations', COUNT(*) FILTER (WHERE is_active = true),
        'inactive_configurations', COUNT(*) FILTER (WHERE is_active = false),
        'iva_configurations', COUNT(*) FILTER (WHERE tax_type LIKE 'iva_%'),
        'ila_configurations', COUNT(*) FILTER (WHERE tax_type LIKE 'ila_%'),
        'other_configurations', COUNT(*) FILTER (WHERE tax_type NOT LIKE 'iva_%' AND tax_type NOT LIKE 'ila_%'),
        'last_updated', MAX(updated_at)
    ) INTO result
    FROM tax_account_configurations
    WHERE company_id = p_company_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insertar configuraciones por defecto SIMPLIFICADAS
INSERT INTO tax_account_configurations (
    company_id, 
    tax_type, 
    tax_name, 
    tax_rate,
    sales_account_code,
    sales_account_name,
    purchases_account_code,
    purchases_account_name,
    notes
) VALUES 
-- IVA 19% General
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'iva_19', 'IVA 19%', 19.0,
 '2.1.4.001', 'IVA por Pagar', '1.1.4.002', 'IVA Crédito Fiscal',
 'Configuración estándar para IVA general del 19%'),

-- IVA Exento  
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'iva_exento', 'IVA Exento', 0.0,
 '4.1.1.001', 'Ventas Exentas', '5.1.1.001', 'Compras Exentas',
 'Operaciones exentas de IVA'),

-- ILA 20.5% (Bebidas alcohólicas)
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'ila_20.5', 'ILA 20.5%', 20.5,
 '2.1.4.101', 'ILA por Pagar 20.5%', '1.1.4.102', 'ILA Crédito 20.5%',
 'Impuesto a bebidas alcohólicas (vinos, cervezas)'),

-- ILA 31.5% (Bebidas destiladas y analcohólicas)
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'ila_31.5', 'ILA 31.5%', 31.5,
 '2.1.4.103', 'ILA por Pagar 31.5%', '1.1.4.104', 'ILA Crédito 31.5%',
 'Bebidas destiladas y analcohólicas con alto contenido de azúcar'),

-- ILA 10% (Bebidas analcohólicas bajo azúcar)
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'ila_10', 'ILA 10%', 10.0,
 '2.1.4.105', 'ILA por Pagar 10%', '1.1.4.106', 'ILA Crédito 10%',
 'Bebidas analcohólicas con bajo contenido de azúcar'),

-- IABA 5% (Impuesto adicional bebidas azucaradas)
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'iaba_5', 'IABA 5%', 5.0,
 '2.1.4.107', 'IABA por Pagar 5%', '1.1.4.108', 'IABA Crédito 5%',
 'Impuesto adicional a bebidas analcohólicas azucaradas');

-- Grants para el usuario de la aplicación
GRANT ALL ON tax_account_configurations TO postgres;
GRANT ALL ON tax_account_configurations TO anon;
GRANT ALL ON tax_account_configurations TO authenticated;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración SIMPLIFICADA de configuraciones de impuestos completada';
    RAISE NOTICE '📊 Configuraciones insertadas: %', (SELECT COUNT(*) FROM tax_account_configurations);
    RAISE NOTICE '🔧 Funciones creadas: get_company_tax_configs, get_tax_config_stats';
    RAISE NOTICE '🎯 Estructura: sales_account + purchases_account (sin separación débito/crédito)';
END $$;