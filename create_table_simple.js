const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://yttdnmokivtayeunlvlk.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dGRubW9raXZ0YXlldW5sdmxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA5MTkyMCwiZXhwIjoyMDY5NjY3OTIwfQ.sdjibYLZAvmIGP_eXlJuUIu8yfoscVkl87HvsFCHv-Q';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createTableAndData() {
  try {
    console.log('🚀 Creando tabla y datos de prueba...');
    
    // Datos de ejemplo para insertar directamente
    const testData = [
      {
        id: 'test-iva-19',
        company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
        tax_type: 'iva_19',
        tax_name: 'IVA 19%',
        tax_rate: 19.0,
        sales_account_code: '2.1.4.001',
        sales_account_name: 'IVA por Pagar',
        purchases_account_code: '1.1.4.002',
        purchases_account_name: 'IVA Crédito Fiscal',
        notes: 'Configuración estándar para IVA general del 19%',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'test-iva-exento',
        company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
        tax_type: 'iva_exento',
        tax_name: 'IVA Exento',
        tax_rate: 0.0,
        sales_account_code: '4.1.1.001',
        sales_account_name: 'Ventas Exentas',
        purchases_account_code: '5.1.1.001',
        purchases_account_name: 'Compras Exentas',
        notes: 'Operaciones exentas de IVA',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Intentar insertar directamente para ver si la tabla existe
    console.log('📝 Intentando insertar datos de prueba...');
    const { data, error } = await supabase
      .from('tax_account_configurations')
      .insert(testData);

    if (error) {
      console.error('❌ Error (probablemente tabla no existe):', error.message);
      console.log('');
      console.log('🔧 SOLUCIÓN REQUERIDA:');
      console.log('1. Ve a https://yttdnmokivtayeunlvlk.supabase.co/project/yttdnmokivtayeunlvlk/sql');
      console.log('2. Copia y pega el contenido del archivo: APLICAR_MIGRACION_TAX_CONFIGURATIONS_SIMPLIFICADA.sql');
      console.log('3. Presiona "Run" para ejecutar');
      console.log('4. Vuelve a ejecutar este script para verificar');
      console.log('');
      console.log('📋 Archivos disponibles:');
      console.log('  - APLICAR_MIGRACION_TAX_CONFIGURATIONS_SIMPLIFICADA.sql (RECOMENDADO)');
      console.log('  - APLICAR_MIGRACION_TAX_CONFIGURATIONS.sql (versión completa)');
    } else {
      console.log('✅ Datos insertados correctamente');
      console.log('📊 Registros creados:', data?.length || 'N/A');
      
      // Verificar que se insertaron
      const { data: verifyData, error: verifyError } = await supabase
        .from('tax_account_configurations')
        .select('*')
        .eq('company_id', '8033ee69-b420-4d91-ba0e-482f46cd6fce');
        
      if (verifyError) {
        console.error('❌ Error verificando:', verifyError);
      } else {
        console.log('🔍 Total de configuraciones:', verifyData?.length || 0);
        verifyData?.forEach((config, index) => {
          console.log(`  ${index + 1}. ${config.tax_name} (${config.tax_type})`);
        });
      }
      
      console.log('');
      console.log('🎉 ¡Sistema listo!');
      console.log('👉 Prueba en: http://localhost:3000/accounting/configuration');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar
createTableAndData();