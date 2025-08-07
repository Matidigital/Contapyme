import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    const liquidationData = await request.json();

    // Validar que el empleado exista
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, rut')
      .eq('id', liquidationData.employee_id)
      .eq('company_id', companyId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya existe una liquidación para este período
    const { data: existing } = await supabase
      .from('payroll_liquidations')
      .select('id')
      .eq('company_id', companyId)
      .eq('employee_id', liquidationData.employee_id)
      .eq('period_year', liquidationData.period_year)
      .eq('period_month', liquidationData.period_month)
      .single();

    let savedLiquidation;

    if (existing) {
      // Actualizar liquidación existente
      const { data: updated, error: updateError } = await supabase
        .from('payroll_liquidations')
        .update({
          ...liquidationData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating liquidation:', updateError);
        return NextResponse.json(
          { success: false, error: 'Error al actualizar liquidación' },
          { status: 500 }
        );
      }

      savedLiquidation = updated;
    } else {
      // Crear nueva liquidación
      const { data: created, error: createError } = await supabase
        .from('payroll_liquidations')
        .insert({
          company_id: companyId,
          ...liquidationData,
          status: liquidationData.status || 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          generated_by: companyId // TODO: usar ID de usuario real
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating liquidation:', createError);
        return NextResponse.json(
          { success: false, error: 'Error al crear liquidación' },
          { status: 500 }
        );
      }

      savedLiquidation = created;
    }

    return NextResponse.json({
      success: true,
      data: savedLiquidation,
      message: existing 
        ? 'Liquidación actualizada exitosamente'
        : 'Liquidación guardada exitosamente'
    });

  } catch (error) {
    console.error('Error in POST /api/payroll/liquidations/save:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Obtener liquidación guardada
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const employeeId = searchParams.get('employee_id');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('payroll_liquidations')
      .select(`
        *,
        employees (
          rut,
          first_name,
          last_name,
          email
        )
      `)
      .eq('company_id', companyId);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (year) {
      query = query.eq('period_year', parseInt(year));
    }

    if (month) {
      query = query.eq('period_month', parseInt(month));
    }

    const { data: liquidations, error } = await query
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    if (error) {
      console.error('Error fetching liquidations:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener liquidaciones' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: liquidations || []
    });

  } catch (error) {
    console.error('Error in GET /api/payroll/liquidations/save:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}