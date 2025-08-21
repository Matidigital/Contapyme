const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://yttdnmokivtayeunlvlk.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dGRubW9raXZ0YXlldW5sdmxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA5MTkyMCwiZXhwIjoyMDY5NjY3OTIwfQ.sdjibYLZAvmIGP_eXlJuUIu8yfoscVkl87HvsFCHv-Q';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración de configuraciones de impuestos...');
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250821120000_tax_account_configurations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Archivo de migración leído correctamente');
    
    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      // Intentar método alternativo: dividir en partes
      await applyMigrationInParts(migrationSQL);
      return;
    }
    
    console.log('✅ Migración aplicada exitosamente');
    console.log('📊 Resultado:', data);
    
    // Verificar que la tabla fue creada
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'tax_account_configurations');
      
    if (tablesError) {
      console.error('❌ Error verificando tabla:', tablesError);
    } else {
      console.log('🔍 Tabla tax_account_configurations:', tables.length > 0 ? 'EXISTE' : 'NO EXISTE');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

async function applyMigrationInParts(sql) {
  console.log('🔄 Intentando aplicar migración en partes...');
  
  // Dividir el SQL en statements separados
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`📝 Encontrados ${statements.length} statements para ejecutar`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim()) {
      try {
        console.log(`⏳ Ejecutando statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';'
        });
        
        if (error) {
          console.error(`❌ Error en statement ${i + 1}:`, error);
        } else {
          console.log(`✅ Statement ${i + 1} ejecutado correctamente`);
        }
      } catch (err) {
        console.error(`❌ Error ejecutando statement ${i + 1}:`, err);
      }
    }
  }
}

// Ejecutar migración
applyMigration();