import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  console.log('🔍 Database Test: Verificando estado de las tablas...');
  
  try {
    const tableTests = {
      f29_forms: null,
      fixed_assets: null,
      journal_book: null,
      companies: null,
      users: null,
      economic_indicators: null
    };

    // Test 1: F29 Forms table
    try {
      const { data: f29Data, error: f29Error } = await supabase
        .from('f29_forms')
        .select('*')
        .limit(1);
      
      if (f29Error) {
        tableTests.f29_forms = `❌ Error: ${f29Error.message}`;
      } else {
        tableTests.f29_forms = `✅ OK - ${f29Data?.length || 0} registros disponibles`;
      }
    } catch (error) {
      tableTests.f29_forms = `❌ Error de conexión: ${error}`;
    }

    // Test 2: Fixed Assets table
    try {
      const { data: assetsData, error: assetsError } = await supabase
        .from('fixed_assets')
        .select('*')
        .limit(1);
      
      if (assetsError) {
        tableTests.fixed_assets = `❌ Error: ${assetsError.message}`;
      } else {
        tableTests.fixed_assets = `✅ OK - ${assetsData?.length || 0} registros disponibles`;
      }
    } catch (error) {
      tableTests.fixed_assets = `❌ Error de conexión: ${error}`;
    }

    // Test 3: Journal Book table
    try {
      const { data: journalData, error: journalError } = await supabase
        .from('journal_book')
        .select('*')
        .limit(1);
      
      if (journalError) {
        tableTests.journal_book = `❌ Error: ${journalError.message}`;
      } else {
        tableTests.journal_book = `✅ OK - ${journalData?.length || 0} registros disponibles`;
      }
    } catch (error) {
      tableTests.journal_book = `❌ Error de conexión: ${error}`;
    }

    // Test 4: Companies table
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(1);
      
      if (companiesError) {
        tableTests.companies = `❌ Error: ${companiesError.message}`;
      } else {
        tableTests.companies = `✅ OK - ${companiesData?.length || 0} registros disponibles`;
      }
    } catch (error) {
      tableTests.companies = `❌ Error de conexión: ${error}`;
    }

    // Test 5: Users table (auth.users)
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersError) {
        tableTests.users = `❌ Error: ${usersError.message}`;
      } else {
        tableTests.users = `✅ OK - ${usersData?.length || 0} registros disponibles`;
      }
    } catch (error) {
      tableTests.users = `❌ Error de conexión: ${error}`;
    }

    // Test 6: Economic Indicators table
    try {
      const { data: indicatorsData, error: indicatorsError } = await supabase
        .from('economic_indicators')
        .select('*')
        .limit(1);
      
      if (indicatorsError) {
        tableTests.economic_indicators = `❌ Error: ${indicatorsError.message}`;
      } else {
        tableTests.economic_indicators = `✅ OK - ${indicatorsData?.length || 0} registros disponibles`;
      }
    } catch (error) {
      tableTests.economic_indicators = `❌ Error de conexión: ${error}`;
    }

    // Calcular estadísticas
    const tablesOK = Object.values(tableTests).filter(status => status?.includes('✅')).length;
    const tablesError = Object.values(tableTests).filter(status => status?.includes('❌')).length;
    
    console.log('📊 Test completado:', { tablesOK, tablesError });

    return NextResponse.json({
      success: tablesOK > 0,
      database_status: tablesOK >= 4 ? '✅ FUNCIONAL' : '⚠️ PROBLEMAS DETECTADOS',
      summary: {
        tables_ok: tablesOK,
        tables_error: tablesError,
        total_tested: Object.keys(tableTests).length,
        database_ready: tablesOK >= 4 && tableTests.f29_forms?.includes('✅')
      },
      table_tests: tableTests,
      environment: {
        supabase_url: supabaseUrl ? '✅ Configurado' : '❌ No configurado',
        supabase_key: supabaseKey ? '✅ Configurado' : '❌ No configurado',
        node_env: process.env.NODE_ENV || 'undefined'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error crítico en database test:', error);
    return NextResponse.json({ 
      success: false,
      database_status: '❌ ERROR CRÍTICO',
      error: error instanceof Error ? error.message : 'Error desconocido',
      environment: {
        supabase_url: supabaseUrl ? '✅ Configurado' : '❌ No configurado',
        supabase_key: supabaseKey ? '✅ Configurado' : '❌ No configurado'
      }
    }, { status: 500 });
  }
}