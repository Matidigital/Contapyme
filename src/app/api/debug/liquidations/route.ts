import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseConnection, isSupabaseConfigured } from '@/lib/database/databaseSimple';

/**
 * 🔧 ENDPOINT DE DIAGNÓSTICO - API LIQUIDACIONES
 * Para verificar qué está fallando en el guardado de liquidaciones
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DIAGNÓSTICO LIQUIDATIONS - Iniciando...');
    
    // Step 1: Verificar configuración
    const isConfigured = isSupabaseConfigured();
    console.log('📋 Supabase configurado:', isConfigured);
    
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        step: 'configuration_check',
        error: 'Supabase no está configurado correctamente',
        isConfigured: false
      });
    }
    
    // Step 2: Obtener conexión
    const supabase = getDatabaseConnection();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        step: 'connection_check',
        error: 'No se pudo obtener conexión a Supabase'
      });
    }
    
    console.log('✅ Conexión Supabase obtenida');
    
    // Step 3: Verificar que tabla payroll_liquidations existe
    const { data: tables, error: tablesError } = await supabase
      .from('payroll_liquidations')
      .select('count')
      .limit(1);
      
    if (tablesError) {
      console.error('❌ Error verificando tabla payroll_liquidations:', tablesError);
      return NextResponse.json({
        success: false,
        step: 'table_check',
        error: 'Tabla payroll_liquidations no existe o no es accesible',
        details: tablesError
      });
    }
    
    console.log('✅ Tabla payroll_liquidations accesible');
    
    // Step 4: Verificar permisos de INSERT
    const testData = {
      company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
      employee_id: 'test-employee-id',
      period_year: 2025,
      period_month: 8,
      days_worked: 30,
      base_salary: 1000000,
      total_gross_income: 1000000,
      total_deductions: 200000,
      net_salary: 800000,
      status: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      generated_by: null
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('payroll_liquidations')
      .insert(testData)
      .select()
      .single();
      
    if (insertError) {
      console.error('❌ Error en test de INSERT:', insertError);
      return NextResponse.json({
        success: false,
        step: 'insert_test',
        error: 'No se pueden insertar registros en payroll_liquidations',
        details: insertError,
        testData: testData
      });
    }
    
    console.log('✅ Test INSERT exitoso, limpiando...');
    
    // Step 5: Limpiar el registro de prueba
    await supabase
      .from('payroll_liquidations')
      .delete()
      .eq('id', insertTest.id);
      
    return NextResponse.json({
      success: true,
      message: 'Todos los tests pasaron exitosamente',
      steps: {
        configuration_check: '✅ OK',
        connection_check: '✅ OK', 
        table_check: '✅ OK',
        insert_test: '✅ OK',
        cleanup: '✅ OK'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Error crítico en diagnóstico:', error);
    
    return NextResponse.json({
      success: false,
      step: 'critical_error',
      error: 'Error crítico en diagnóstico',
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * 🧪 TEST ESPECÍFICO DE GUARDADO DE LIQUIDACIÓN
 */
export async function POST(request: NextRequest) {
  try {
    const testLiquidationData = await request.json();
    console.log('🧪 TEST LIQUIDATION SAVE - Data:', JSON.stringify(testLiquidationData, null, 2));
    
    // Usar la misma lógica que la API real
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id') || '8033ee69-b420-4d91-ba0e-482f46cd6fce';
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Supabase no configurado en test',
        code: 'SUPABASE_NOT_CONFIGURED'
      }, { status: 503 });
    }
    
    const supabase = getDatabaseConnection();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo obtener conexión en test',
        code: 'DB_CONNECTION_ERROR'
      }, { status: 503 });
    }
    
    // Intentar el INSERT real
    const { data: created, error: createError } = await supabase
      .from('payroll_liquidations')
      .insert({
        company_id: companyId,
        ...testLiquidationData,
        status: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        generated_by: null
      })
      .select()
      .single();
      
    if (createError) {
      console.error('❌ Error en test de liquidation save:', createError);
      return NextResponse.json({
        success: false,
        error: 'Error insertando liquidación de prueba',
        details: createError,
        code: createError.code
      }, { status: 400 });
    }
    
    // Limpiar
    await supabase
      .from('payroll_liquidations')
      .delete()
      .eq('id', created.id);
    
    return NextResponse.json({
      success: true,
      message: 'Test de guardado exitoso',
      testRecord: created,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Error en test POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Error crítico en test POST',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}