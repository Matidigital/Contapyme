import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const liquidationId = params.id;

    console.log('🔍 GET Liquidation Detail - ID:', liquidationId, 'Company:', companyId);

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    if (!liquidationId) {
      return NextResponse.json(
        { success: false, error: 'liquidation_id es requerido' },
        { status: 400 }
      );
    }

    // Obtener liquidación específica con datos del empleado
    const { data: liquidation, error } = await supabase
      .from('payroll_liquidations')
      .select(`
        *,
        employees (
          rut,
          first_name,
          last_name
        )
      `)
      .eq('id', liquidationId)
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('❌ Error fetching liquidation detail:', error);
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Liquidación no encontrada' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Error al obtener liquidación' },
        { status: 500 }
      );
    }

    if (!liquidation) {
      return NextResponse.json(
        { success: false, error: 'Liquidación no encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ Liquidation detail found:', liquidation.id);

    // Formatear datos para respuesta
    const formattedLiquidation = {
      id: liquidation.id,
      employee: {
        rut: liquidation.employees?.rut,
        first_name: liquidation.employees?.first_name,
        last_name: liquidation.employees?.last_name
      },
      period_year: liquidation.period_year,
      period_month: liquidation.period_month,
      days_worked: liquidation.days_worked,
      
      // Haberes
      base_salary: liquidation.base_salary,
      overtime_amount: liquidation.overtime_amount,
      bonuses: liquidation.bonuses,
      commissions: liquidation.commissions,
      gratification: liquidation.gratification,
      food_allowance: liquidation.food_allowance,
      transport_allowance: liquidation.transport_allowance,
      family_allowance: liquidation.family_allowance,
      total_taxable_income: liquidation.total_taxable_income,
      total_non_taxable_income: liquidation.total_non_taxable_income,
      
      // Descuentos
      afp_percentage: liquidation.afp_percentage,
      afp_commission_percentage: liquidation.afp_commission_percentage,
      afp_amount: liquidation.afp_amount,
      afp_commission_amount: liquidation.afp_commission_amount,
      health_percentage: liquidation.health_percentage,
      health_amount: liquidation.health_amount,
      unemployment_percentage: liquidation.unemployment_percentage,
      unemployment_amount: liquidation.unemployment_amount,
      income_tax_amount: liquidation.income_tax_amount,
      
      // Otros descuentos
      loan_deductions: liquidation.loan_deductions,
      advance_payments: liquidation.advance_payments,
      apv_amount: liquidation.apv_amount,
      other_deductions: liquidation.other_deductions,
      total_other_deductions: liquidation.total_other_deductions,
      
      // Totales
      total_gross_income: liquidation.total_gross_income,
      total_deductions: liquidation.total_deductions,
      net_salary: liquidation.net_salary,
      
      status: liquidation.status,
      created_at: liquidation.created_at,
      updated_at: liquidation.updated_at
    };

    return NextResponse.json({
      success: true,
      data: formattedLiquidation
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (error) {
    console.error('❌ Error in GET /api/payroll/liquidations/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const liquidationId = params.id;
    const updateData = await request.json();

    console.log('🔍 PUT Liquidation - ID:', liquidationId, 'Data:', updateData);

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    if (!liquidationId) {
      return NextResponse.json(
        { success: false, error: 'liquidation_id es requerido' },
        { status: 400 }
      );
    }

    // Actualizar liquidación
    const { data: updated, error: updateError } = await supabase
      .from('payroll_liquidations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', liquidationId)
      .eq('company_id', companyId)
      .select(`
        *,
        employees (
          rut,
          first_name,
          last_name
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Error updating liquidation:', updateError);
      
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Liquidación no encontrada' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al actualizar liquidación',
          details: updateError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ Liquidation updated:', updated.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Liquidación actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error in PUT /api/payroll/liquidations/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const liquidationId = params.id;

    console.log('🔍 DELETE Liquidation - ID:', liquidationId);

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    if (!liquidationId) {
      return NextResponse.json(
        { success: false, error: 'liquidation_id es requerido' },
        { status: 400 }
      );
    }

    // Eliminar liquidación
    const { data: deleted, error: deleteError } = await supabase
      .from('payroll_liquidations')
      .delete()
      .eq('id', liquidationId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (deleteError) {
      console.error('❌ Error deleting liquidation:', deleteError);
      
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Liquidación no encontrada' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al eliminar liquidación',
          details: deleteError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ Liquidation deleted:', deleted.id);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: 'Liquidación eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error in DELETE /api/payroll/liquidations/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}