const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://yttdnmokivtayeunlvlk.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dGRubW9raXZ0YXlldW5sdmxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA5MTkyMCwiZXhwIjoyMDY5NjY3OTIwfQ.sdjibYLZAvmIGP_eXlJuUIu8yfoscVkl87HvsFCHv-Q';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createTable() {
  try {
    console.log('🚀 Creando tabla tax_account_configurations...');
    
    // Verificar si la tabla ya existe
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'tax_account_configurations');
    
    if (checkError) {
      console.error('❌ Error verificando tabla existente:', checkError);
      return;
    }
    
    if (tables && tables.length > 0) {
      console.log('✅ La tabla tax_account_configurations ya existe');
      return await insertDefaultData();
    }
    
    console.log('📄 La tabla no existe, creándola...');
    
    // Crear la tabla usando SQL directo (no funciona con Supabase client)
    console.log('❌ No se puede crear la tabla automáticamente desde JavaScript');
    console.log('📋 Necesitas copiar y pegar el SQL en el Dashboard de Supabase:');
    console.log('');
    console.log('-- COPIAR ESTE SQL EN SUPABASE DASHBOARD --');
    console.log(`
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

-- Índices
CREATE INDEX idx_tax_config_company_id ON tax_account_configurations(company_id);
CREATE INDEX idx_tax_config_tax_type ON tax_account_configurations(tax_type);
CREATE INDEX idx_tax_config_active ON tax_account_configurations(is_active);
CREATE INDEX idx_tax_config_company_active ON tax_account_configurations(company_id, is_active);

-- Función de actualización
CREATE OR REPLACE FUNCTION update_tax_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    `);
    console.log('-- FIN DEL SQL PARA COPIAR --');
    console.log('');
    console.log('📍 Ve a https://yttdnmokivtayeunlvlk.supabase.co/project/yttdnmokivtayeunlvlk/sql');
    console.log('📋 Copia y pega el SQL de arriba en el editor');
    console.log('▶️ Presiona "Run" para ejecutar');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

async function insertDefaultData() {
  try {
    console.log('📊 Insertando datos de ejemplo...');
    
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
        notes: 'Configuración estándar para IVA general del 19%'
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
        notes: 'Operaciones exentas de IVA'
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
        notes: 'Impuesto a bebidas alcohólicas (vinos, cervezas)'
      }
    ];
    
    const { data, error } = await supabase
      .from('tax_account_configurations')
      .insert(defaultConfigurations);
    
    if (error) {
      console.error('❌ Error insertando datos:', error);
    } else {
      console.log('✅ Datos de ejemplo insertados correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error insertando datos:', error);
  }
}

// Ejecutar
createTable();