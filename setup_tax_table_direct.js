const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://yttdnmokivtayeunlvlk.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dGRubW9raXZ0YXlldW5sdmxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA5MTkyMCwiZXhwIjoyMDY5NjY3OTIwfQ.sdjibYLZAvmIGP_eXlJuUIu8yfoscVkl87HvsFCHv-Q';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function insertDefaultData() {
  try {
    console.log('🚀 Insertando configuraciones de impuestos por defecto...');
    
    const defaultConfigurations = [
      {
        company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
        tax_type: 'iva_19',
        tax_name: 'IVA 19%',
        tax_rate: 19.0,
        sales_debit_account_code: '1.1.4.001',
        sales_debit_account_name: 'IVA Débito Fiscal',
        sales_credit_account_code: '2.1.4.001',
        sales_credit_account_name: 'IVA por Pagar',
        purchases_debit_account_code: '1.1.4.002',
        purchases_debit_account_name: 'IVA Crédito Fiscal',
        purchases_credit_account_code: '2.1.4.002',
        purchases_credit_account_name: 'IVA por Recuperar',
        notes: 'Configuración estándar para IVA general del 19%',
        is_active: true
      },
      {
        company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
        tax_type: 'iva_exento',
        tax_name: 'IVA Exento',
        tax_rate: 0.0,
        sales_debit_account_code: '1.1.4.003',
        sales_debit_account_name: 'Ventas Exentas',
        sales_credit_account_code: '',
        sales_credit_account_name: '',
        purchases_debit_account_code: '1.1.4.004',
        purchases_debit_account_name: 'Compras Exentas',
        purchases_credit_account_code: '',
        purchases_credit_account_name: '',
        notes: 'Operaciones exentas de IVA',
        is_active: true
      },
      {
        company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
        tax_type: 'ila_20.5',
        tax_name: 'ILA 20.5%',
        tax_rate: 20.5,
        sales_debit_account_code: '1.1.4.101',
        sales_debit_account_name: 'ILA Débito 20.5%',
        sales_credit_account_code: '2.1.4.101',
        sales_credit_account_name: 'ILA por Pagar 20.5%',
        purchases_debit_account_code: '1.1.4.102',
        purchases_debit_account_name: 'ILA Crédito 20.5%',
        purchases_credit_account_code: '2.1.4.102',
        purchases_credit_account_name: 'ILA por Recuperar 20.5%',
        notes: 'Impuesto a bebidas alcohólicas (vinos, cervezas)',
        is_active: true
      },
      {
        company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
        tax_type: 'ila_31.5',
        tax_name: 'ILA 31.5%',
        tax_rate: 31.5,
        sales_debit_account_code: '1.1.4.103',
        sales_debit_account_name: 'ILA Débito 31.5%',
        sales_credit_account_code: '2.1.4.103',
        sales_credit_account_name: 'ILA por Pagar 31.5%',
        purchases_debit_account_code: '1.1.4.104',
        purchases_debit_account_name: 'ILA Crédito 31.5%',
        purchases_credit_account_code: '2.1.4.104',
        purchases_credit_account_name: 'ILA por Recuperar 31.5%',
        notes: 'Bebidas destiladas y analcohólicas con alto contenido de azúcar',
        is_active: true
      },
      {
        company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
        tax_type: 'ila_10',
        tax_name: 'ILA 10%',
        tax_rate: 10.0,
        sales_debit_account_code: '1.1.4.105',
        sales_debit_account_name: 'ILA Débito 10%',
        sales_credit_account_code: '2.1.4.105',
        sales_credit_account_name: 'ILA por Pagar 10%',
        purchases_debit_account_code: '1.1.4.106',
        purchases_debit_account_name: 'ILA Crédito 10%',
        purchases_credit_account_code: '2.1.4.106',
        purchases_credit_account_name: 'ILA por Recuperar 10%',
        notes: 'Bebidas analcohólicas con bajo contenido de azúcar',
        is_active: true
      },
      {
        company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
        tax_type: 'iaba_5',
        tax_name: 'IABA 5%',
        tax_rate: 5.0,
        sales_debit_account_code: '1.1.4.107',
        sales_debit_account_name: 'IABA Débito 5%',
        sales_credit_account_code: '2.1.4.107',
        sales_credit_account_name: 'IABA por Pagar 5%',
        purchases_debit_account_code: '1.1.4.108',
        purchases_debit_account_name: 'IABA Crédito 5%',
        purchases_credit_account_code: '2.1.4.108',
        purchases_credit_account_name: 'IABA por Recuperar 5%',
        notes: 'Impuesto adicional a bebidas analcohólicas azucaradas',
        is_active: true
      }
    ];
    
    // Intentar insertar los datos directamente
    const { data, error } = await supabase
      .from('tax_account_configurations')
      .insert(defaultConfigurations);
    
    if (error) {
      console.error('❌ Error insertando datos (tabla probablemente no existe):', error);
      console.log('');
      console.log('📋 INSTRUCCIONES MANUALES:');
      console.log('1. Ve a https://yttdnmokivtayeunlvlk.supabase.co/project/yttdnmokivtayeunlvlk/sql');
      console.log('2. Copia y pega este SQL completo:');
      console.log('');
      console.log('-- SQL PARA CREAR TABLA tax_account_configurations --');
      console.log(`
-- Crear tabla principal de configuraciones de impuestos
CREATE TABLE IF NOT EXISTS tax_account_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    
    -- Información del impuesto
    tax_type VARCHAR(50) NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    tax_rate DECIMAL(5,2),
    
    -- Asociación de cuentas
    sales_debit_account_code VARCHAR(20),
    sales_debit_account_name VARCHAR(255),
    sales_credit_account_code VARCHAR(20),
    sales_credit_account_name VARCHAR(255),
    
    purchases_debit_account_code VARCHAR(20),
    purchases_debit_account_name VARCHAR(255),
    purchases_credit_account_code VARCHAR(20),
    purchases_credit_account_name VARCHAR(255),
    
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

-- Insertar configuraciones por defecto
INSERT INTO tax_account_configurations (
    company_id, 
    tax_type, 
    tax_name, 
    tax_rate,
    sales_debit_account_code,
    sales_debit_account_name,
    sales_credit_account_code,
    sales_credit_account_name,
    purchases_debit_account_code,
    purchases_debit_account_name,
    purchases_credit_account_code,
    purchases_credit_account_name,
    notes
) VALUES 
-- IVA 19% General
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'iva_19', 'IVA 19%', 19.0,
 '1.1.4.001', 'IVA Débito Fiscal', '2.1.4.001', 'IVA por Pagar',
 '1.1.4.002', 'IVA Crédito Fiscal', '2.1.4.002', 'IVA por Recuperar',
 'Configuración estándar para IVA general del 19%'),

-- IVA Exento  
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'iva_exento', 'IVA Exento', 0.0,
 '1.1.4.003', 'Ventas Exentas', '', '',
 '1.1.4.004', 'Compras Exentas', '', '',
 'Operaciones exentas de IVA'),

-- ILA 20.5% (Bebidas alcohólicas)
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'ila_20.5', 'ILA 20.5%', 20.5,
 '1.1.4.101', 'ILA Débito 20.5%', '2.1.4.101', 'ILA por Pagar 20.5%',
 '1.1.4.102', 'ILA Crédito 20.5%', '2.1.4.102', 'ILA por Recuperar 20.5%',
 'Impuesto a bebidas alcohólicas (vinos, cervezas)'),

-- ILA 31.5% (Bebidas destiladas y analcohólicas)
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'ila_31.5', 'ILA 31.5%', 31.5,
 '1.1.4.103', 'ILA Débito 31.5%', '2.1.4.103', 'ILA por Pagar 31.5%',
 '1.1.4.104', 'ILA Crédito 31.5%', '2.1.4.104', 'ILA por Recuperar 31.5%',
 'Bebidas destiladas y analcohólicas con alto contenido de azúcar'),

-- ILA 10% (Bebidas analcohólicas bajo azúcar)
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'ila_10', 'ILA 10%', 10.0,
 '1.1.4.105', 'ILA Débito 10%', '2.1.4.105', 'ILA por Pagar 10%',
 '1.1.4.106', 'ILA Crédito 10%', '2.1.4.106', 'ILA por Recuperar 10%',
 'Bebidas analcohólicas con bajo contenido de azúcar'),

-- IABA 5% (Impuesto adicional bebidas azucaradas)
('8033ee69-b420-4d91-ba0e-482f46cd6fce', 'iaba_5', 'IABA 5%', 5.0,
 '1.1.4.107', 'IABA Débito 5%', '2.1.4.107', 'IABA por Pagar 5%',
 '1.1.4.108', 'IABA Crédito 5%', '2.1.4.108', 'IABA por Recuperar 5%',
 'Impuesto adicional a bebidas analcohólicas azucaradas');

-- Grants para el usuario de la aplicación
GRANT ALL ON tax_account_configurations TO postgres;
GRANT ALL ON tax_account_configurations TO anon;
GRANT ALL ON tax_account_configurations TO authenticated;
      `);
      console.log('-- FIN DEL SQL --');
      console.log('');
      console.log('3. Presiona "Run" para ejecutar el SQL');
      console.log('4. Una vez ejecutado, ejecuta nuevamente este script para verificar');
      
    } else {
      console.log('✅ Configuraciones de impuestos insertadas correctamente');
      console.log('📊 Datos insertados:', data?.length || 'N/A');
      
      // Verificar que los datos se insertaron
      const { data: verifyData, error: verifyError } = await supabase
        .from('tax_account_configurations')
        .select('*')
        .eq('company_id', '8033ee69-b420-4d91-ba0e-482f46cd6fce');
        
      if (verifyError) {
        console.error('❌ Error verificando datos:', verifyError);
      } else {
        console.log('🔍 Configuraciones en la base de datos:', verifyData?.length || 0);
        verifyData?.forEach((config, index) => {
          console.log(`  ${index + 1}. ${config.tax_name} (${config.tax_type})`);
        });
      }
      
      console.log('');
      console.log('🎉 ¡Sistema de configuraciones de impuestos listo!');
      console.log('👉 Ahora puedes probar en: http://localhost:3000/accounting/configuration');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
insertDefaultData();