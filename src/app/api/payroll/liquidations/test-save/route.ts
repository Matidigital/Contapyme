import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    console.log('🔍 TEST SAVE - Company ID:', companyId);

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    const liquidationData = await request.json();
    console.log('🔍 TEST SAVE - Data received:', JSON.stringify(liquidationData, null, 2));

    // 1. VERIFICAR TABLA EXISTS
    const { data: tableCheck, error: tableError } = await supabase
      .from('payroll_liquidations')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ Table check failed:', tableError);
      return NextResponse.json({
        success: false,
        error: 'Tabla payroll_liquidations no existe',
        details: tableError.message
      }, { status: 500 });
    }

    console.log('✅ Tabla payroll_liquidations existe');

    // 2. VERIFICAR EMPLOYEE EXISTS
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, rut')
      .eq('id', liquidationData.employee_id)
      .eq('company_id', companyId)
      .single();

    if (employeeError) {
      console.error('❌ Employee check failed:', employeeError);
      return NextResponse.json({
        success: false,
        error: 'Employee no existe',
        details: employeeError.message
      }, { status: 404 });
    }

    console.log('✅ Employee existe:', employee.first_name, employee.last_name);

    // 3. INTENTAR INSERT MÍNIMO
    const minimalData = {
      company_id: companyId,
      employee_id: liquidationData.employee_id,
      period_year: liquidationData.period_year || 2025,
      period_month: liquidationData.period_month || 8,
      days_worked: liquidationData.days_worked || 30,
      base_salary: liquidationData.base_salary || 0,
      status: 'draft'
    };

    console.log('🔍 Inserting minimal data:', minimalData);

    const { data: created, error: createError } = await supabase
      .from('payroll_liquidations')
      .insert(minimalData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Create failed:', createError);
      return NextResponse.json({
        success: false,
        error: 'Error creando liquidation',
        details: createError.message,
        code: createError.code
      }, { status: 500 });
    }

    console.log('✅ Liquidation created:', created.id);

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Test liquidation creada exitosamente'
    });

  } catch (error) {
    console.error('❌ TEST SAVE Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint for liquidation save debugging',
    endpoints: {
      POST: 'Test save with minimal data',
    }
  });
}