/**
 * Script de verificación para migración de datos Previred adicionales
 * Verifica que la migración se pueda ejecutar correctamente
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno SUPABASE no encontradas');
  console.log('Asegúrate de tener configurado:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarPrerequisitos() {
  console.log('🔍 Verificando prerequisitos...');
  
  try {
    // 1. Verificar conexión a Supabase
    const { data, error } = await supabase.from('payroll_liquidations').select('id').limit(1);
    if (error) {
      console.error('❌ Error conectando a Supabase:', error.message);
      return false;
    }
    console.log('✅ Conexión a Supabase OK');

    // 2. Verificar que existe tabla payroll_liquidations
    const { data: tableCheck } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'payroll_liquidations')
      .eq('table_schema', 'public');
    
    if (!tableCheck || tableCheck.length === 0) {
      console.error('❌ Tabla payroll_liquidations no existe');
      return false;
    }
    console.log('✅ Tabla payroll_liquidations existe');

    // 3. Verificar que existe tabla companies
    const { data: companiesCheck } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'companies')
      .eq('table_schema', 'public');
    
    if (!companiesCheck || companiesCheck.length === 0) {
      console.error('❌ Tabla companies no existe');
      return false;
    }
    console.log('✅ Tabla companies existe');

    return true;
  } catch (error) {
    console.error('❌ Error verificando prerequisitos:', error.message);
    return false;
  }
}

async function verificarCamposExisten() {
  console.log('🔍 Verificando si los campos ya existen...');
  
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'payroll_liquidations')
      .in('column_name', [
        'incorporation_workplace_amount',
        'sick_leave_days',
        'previred_notes'
      ]);

    if (error) {
      console.error('❌ Error verificando columnas:', error.message);
      return 'error';
    }

    if (data && data.length > 0) {
      console.log(`⚠️  Algunos campos ya existen (${data.length} encontrados)`);
      data.forEach(col => console.log(`   - ${col.column_name}`));
      return 'partial';
    }

    console.log('✅ Campos nuevos - migración necesaria');
    return 'new';
  } catch (error) {
    console.error('❌ Error verificando campos:', error.message);
    return 'error';
  }
}

async function ejecutarMigracion() {
  console.log('🚀 Ejecutando migración...');
  
  try {
    // Leer archivo de migración
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250822160000_previred_additional_data.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Ejecutar migración
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Error ejecutando migración:', error.message);
      return false;
    }

    console.log('✅ Migración ejecutada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    return false;
  }
}

async function verificarResultados() {
  console.log('🔍 Verificando resultados de la migración...');
  
  try {
    // 1. Verificar campos agregados
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'payroll_liquidations')
      .in('column_name', [
        'incorporation_workplace_amount',
        'sick_leave_days', 
        'sick_leave_amount',
        'vacation_days',
        'previred_notes',
        'movement_code',
        'worker_type_code',
        'has_special_regime'
      ]);

    console.log(`✅ Campos agregados: ${columns?.length || 0}`);
    columns?.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    // 2. Verificar tabla conceptos
    const { data: concepts } = await supabase
      .from('previred_concepts')
      .select('concept_code, concept_name')
      .eq('company_id', '8033ee69-b420-4d91-ba0e-482f46cd6fce');

    console.log(`✅ Conceptos pre-configurados: ${concepts?.length || 0}`);
    concepts?.forEach(concept => {
      console.log(`   - ${concept.concept_code}: ${concept.concept_name}`);
    });

    // 3. Verificar función
    const { data: functionTest } = await supabase
      .rpc('calculate_proportional_amount', { 
        base_amount: 1000000, 
        days_worked: 15, 
        total_days: 30 
      });

    console.log(`✅ Función calculate_proportional_amount: ${functionTest} (esperado: 500000)`);

    return true;
  } catch (error) {
    console.error('❌ Error verificando resultados:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 VERIFICADOR DE MIGRACIÓN PREVIRED');
  console.log('====================================');
  
  // Paso 1: Verificar prerequisitos
  const prereqOK = await verificarPrerequisitos();
  if (!prereqOK) {
    console.log('\n❌ No se pueden cumplir los prerequisitos. Abortando.');
    process.exit(1);
  }

  // Paso 2: Verificar estado actual
  const camposStatus = await verificarCamposExisten();
  if (camposStatus === 'error') {
    console.log('\n❌ Error verificando estado actual. Abortando.');
    process.exit(1);
  }

  if (camposStatus === 'partial') {
    console.log('\n⚠️  Migración parcial detectada. Continuando...');
  }

  // Paso 3: Confirmar ejecución
  if (process.argv.includes('--execute') || process.argv.includes('-x')) {
    console.log('\n🚀 Ejecutando migración automáticamente...');
    
    const migrationOK = await ejecutarMigracion();
    if (!migrationOK) {
      console.log('\n❌ Error ejecutando migración.');
      process.exit(1);
    }

    // Paso 4: Verificar resultados
    await verificarResultados();
    
    console.log('\n🎉 Migración completada exitosamente!');
    console.log('\nPróximos pasos:');
    console.log('1. Ir a http://localhost:3001/payroll/liquidations/generate');
    console.log('2. Probar el formulario de datos adicionales Previred');
    console.log('3. Generar una liquidación de prueba');
  } else {
    console.log('\n📋 Para ejecutar la migración, usa:');
    console.log('node verify_previred_migration.js --execute');
    console.log('\nO ejecuta manualmente en Supabase Dashboard:');
    console.log('1. Ir a https://supabase.com/dashboard');
    console.log('2. SQL Editor > New query');
    console.log('3. Copiar contenido de: supabase/migrations/20250822160000_previred_additional_data.sql');
    console.log('4. Ejecutar ▶️');
  }
}

// Ejecutar script principal
main().catch(console.error);