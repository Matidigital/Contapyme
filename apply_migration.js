// Script para aplicar migraciones a Supabase
const fs = require('fs');
const path = require('path');

// Configuración Supabase
const SUPABASE_URL = 'https://yttdnmokivtayeunlvlk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dGRubW9raXZ0YXlldW5sdmxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA5MTkyMCwiZXhwIjoyMDY5NjY3OTIwfQ.sdjibYLZAvmIGP_eXlJuUIu8yfoscVkl87HvsFCHv-Q';

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migraciones a Supabase...');
    
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync(path.join(__dirname, 'setup_supabase.sql'), 'utf8');
    
    console.log('📄 SQL leído, enviando a Supabase...');
    
    // Enviar a Supabase usando REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        sql: sqlContent
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Migraciones aplicadas exitosamente!');
      console.log('📊 Resultado:', result);
    } else {
      // Intentar método alternativo usando SQL directo
      console.log('🔄 Intentando método alternativo...');
      
      const statements = sqlContent
        .split(';')
        .filter(stmt => stmt.trim().length > 0)
        .map(stmt => stmt.trim() + ';');

      console.log(`📋 Ejecutando ${statements.length} statements SQL...`);
      
      let successCount = 0;
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.trim() === ';') continue;
        
        try {
          const stmtResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'apikey': SUPABASE_SERVICE_KEY,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              sql: stmt
            })
          });
          
          if (stmtResponse.ok) {
            successCount++;
            console.log(`✅ Statement ${i + 1}/${statements.length} completado`);
          } else {
            const error = await stmtResponse.text();
            console.log(`⚠️ Statement ${i + 1} falló:`, error.substring(0, 100));
          }
        } catch (error) {
          console.log(`❌ Error en statement ${i + 1}:`, error.message);
        }
      }
      
      console.log(`📈 Completado: ${successCount}/${statements.length} statements exitosos`);
    }
    
  } catch (error) {
    console.error('💥 Error aplicando migraciones:', error);
    
    // Fallback: mostrar instrucciones manuales
    console.log('\n📋 APLICACIÓN MANUAL:');
    console.log('1. Ve a tu proyecto Supabase');
    console.log('2. SQL Editor');
    console.log('3. Copia y pega el contenido de setup_supabase.sql');
    console.log('4. Ejecuta la query');
  }
}

// Verificar si fetch está disponible
if (typeof fetch === 'undefined') {
  console.log('⚠️ fetch no disponible, usando método manual...');
  console.log('\n📋 INSTRUCCIONES MANUALES:');
  console.log('1. Ve a: https://supabase.com/dashboard/project/yttdnmokivtayeunlvlk');
  console.log('2. Ir a SQL Editor');
  console.log('3. Copiar contenido de setup_supabase.sql');
  console.log('4. Pegar y ejecutar en el editor');
  console.log('\n✅ Esto creará todas las tablas necesarias para el sistema F29');
} else {
  applyMigration();
}