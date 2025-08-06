import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST - Crear asientos contables desde liquidaciones de sueldo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 API Payroll Journal - POST:', body);

    const {
      period_year,
      period_month,
      company_id = 'demo-company'
    } = body;

    // Validaciones
    if (!period_year || !period_month) {
      return NextResponse.json(
        { success: false, error: 'period_year y period_month son requeridos' },
        { status: 400 }
      );
    }

    // Obtener todas las liquidaciones del período
    const { data: liquidations, error: liquidationsError } = await supabase
      .from('payroll_liquidations')
      .select(`
        *,
        employees!inner(
          first_name,
          last_name,
          rut
        )
      `)
      .eq('company_id', company_id)
      .eq('period_year', period_year)
      .eq('period_month', period_month);

    if (liquidationsError) {
      console.error('Error fetching liquidations:', liquidationsError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener liquidaciones' },
        { status: 500 }
      );
    }

    if (!liquidations || liquidations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron liquidaciones para el período especificado' },
        { status: 404 }
      );
    }

    console.log(`📋 Procesando ${liquidations.length} liquidaciones del ${period_month}/${period_year}`);

    // Calcular totales consolidados
    const totals = liquidations.reduce(
      (acc, liq) => ({
        total_haberes: acc.total_haberes + (liq.total_haberes || 0),
        total_descuentos: acc.total_descuentos + (liq.total_descuentos || 0),
        liquido_pagar: acc.liquido_pagar + (liq.liquido_pagar || 0),
        // Detalle de haberes
        sueldo_base: acc.sueldo_base + (liq.sueldo_base || 0),
        gratificacion: acc.gratificacion + (liq.gratificacion || 0),
        horas_extras: acc.horas_extras + (liq.horas_extras_amount || 0),
        // Detalle de descuentos
        prevision_amount: acc.prevision_amount + (liq.prevision_amount || 0),
        health_amount: acc.health_amount + (liq.health_amount || 0),
        unemployment_amount: acc.unemployment_amount + (liq.unemployment_amount || 0),
        // Empleados
        employee_count: acc.employee_count + 1
      }),
      {
        total_haberes: 0,
        total_descuentos: 0,
        liquido_pagar: 0,
        sueldo_base: 0,
        gratificacion: 0,
        horas_extras: 0,
        prevision_amount: 0,
        health_amount: 0,
        unemployment_amount: 0,
        employee_count: 0
      }
    );

    console.log('💰 Totales calculados:', totals);

    // Generar asientos contables consolidados por período
    const timestamp = Date.now();
    const date = `${period_year}-${period_month.toString().padStart(2, '0')}-28`; // Último día laboral típico
    const period_description = `${period_month.toString().padStart(2, '0')}/${period_year}`;

    const journalEntries = [];

    // 1. ASIENTO PRINCIPAL DE REMUNERACIONES
    const mainJbid = `JB${timestamp}`;
    const mainEntry = {
      jbid: mainJbid,
      date,
      debit: totals.total_haberes,
      credit: totals.total_haberes,
      description: `Provision Remuneraciones ${period_description} - ${totals.employee_count} empleados`,
      document_number: `REM-${period_year}${period_month.toString().padStart(2, '0')}`,
      reference_type: 'REMUNERACION',
      reference_id: null // Se podría crear un ID consolidado si fuera necesario
    };

    // 2. ASIENTO DE DESCUENTOS LEGALES (PROVISIONES)
    if (totals.total_descuentos > 0) {
      const discountJbid = `JB${timestamp + 1}`;
      const discountEntry = {
        jbid: discountJbid,
        date,
        debit: totals.total_descuentos,
        credit: totals.total_descuentos,
        description: `Descuentos Legales ${period_description} - AFP: $${totals.prevision_amount.toLocaleString('es-CL')}, Salud: $${totals.health_amount.toLocaleString('es-CL')}, Cesantía: $${totals.unemployment_amount.toLocaleString('es-CL')}`,
        document_number: `DESC-${period_year}${period_month.toString().padStart(2, '0')}`,
        reference_type: 'REMUNERACION',
        reference_id: null
      };
      journalEntries.push(discountEntry);
    }

    // 3. ASIENTO DE PAGO DE LÍQUIDO
    if (totals.liquido_pagar > 0) {
      const paymentJbid = `JB${timestamp + 2}`;
      const paymentEntry = {
        jbid: paymentJbid,
        date,
        debit: totals.liquido_pagar,
        credit: totals.liquido_pagar,
        description: `Pago Sueldos ${period_description} - Líquido a pagar ${totals.employee_count} empleados`,
        document_number: `PAG-${period_year}${period_month.toString().padStart(2, '0')}`,
        reference_type: 'REMUNERACION',
        reference_id: null
      };
      journalEntries.push(paymentEntry);
    }

    journalEntries.unshift(mainEntry); // Agregar al inicio

    // Verificar si ya existen asientos para este período
    const { data: existingEntries, error: checkError } = await supabase
      .from('journal_book')
      .select('jbid, description')
      .eq('reference_type', 'REMUNERACION')
      .like('description', `%${period_description}%`)
      .eq('status', 'active');

    if (checkError) {
      console.warn('Error checking existing entries:', checkError);
    }

    if (existingEntries && existingEntries.length > 0) {
      console.log(`⚠️  Ya existen ${existingEntries.length} asientos para el período ${period_description}`);
      return NextResponse.json({
        success: false,
        error: `Ya existen asientos contables para el período ${period_description}. Si desea regenerarlos, primero debe revertir los existentes.`,
        data: {
          existing_entries: existingEntries,
          suggested_action: 'Revertir asientos existentes y volver a generar'
        }
      }, { status: 409 }); // Conflict
    }

    // Insertar todos los asientos en una transacción
    const { data: createdEntries, error: insertError } = await supabase
      .from('journal_book')
      .insert(journalEntries)
      .select();

    if (insertError) {
      console.error('Error creating journal entries:', insertError);
      return NextResponse.json(
        { success: false, error: 'Error al crear asientos contables' },
        { status: 500 }
      );
    }

    console.log(`✅ ${createdEntries.length} asientos contables creados para remuneraciones ${period_description}`);

    return NextResponse.json({
      success: true,
      data: {
        journal_entries: createdEntries,
        summary: {
          period: period_description,
          employee_count: totals.employee_count,
          total_haberes: totals.total_haberes,
          total_descuentos: totals.total_descuentos,
          liquido_pagar: totals.liquido_pagar,
          entries_created: createdEntries.length
        },
        breakdown: {
          sueldo_base: totals.sueldo_base,
          gratificacion: totals.gratificacion,
          horas_extras: totals.horas_extras,
          prevision_amount: totals.prevision_amount,
          health_amount: totals.health_amount,
          unemployment_amount: totals.unemployment_amount
        }
      },
      message: `${createdEntries.length} asientos contables creados exitosamente para remuneraciones ${period_description}`
    });

  } catch (error) {
    console.error('Error in POST /api/accounting/payroll-journal:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener asientos contables de remuneraciones por período
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period_year = searchParams.get('period_year');
    const period_month = searchParams.get('period_month');
    
    console.log('🔍 API Payroll Journal - GET:', { period_year, period_month });

    // Query base
    let query = supabase
      .from('journal_book')
      .select('*')
      .eq('reference_type', 'REMUNERACION')
      .eq('status', 'active')
      .order('date', { ascending: false });

    // Filtro por período si se especifica
    if (period_year && period_month) {
      const period_description = `${period_month.toString().padStart(2, '0')}/${period_year}`;
      query = query.like('description', `%${period_description}%`);
    }

    const { data: entries, error } = await query;

    if (error) {
      console.error('Error fetching payroll journal entries:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener asientos de remuneraciones' },
        { status: 500 }
      );
    }

    // Calcular totales
    const totals = entries?.reduce(
      (acc, entry) => ({
        total_debit: acc.total_debit + (entry.debit || 0),
        total_credit: acc.total_credit + (entry.credit || 0),
        entry_count: acc.entry_count + 1
      }),
      { total_debit: 0, total_credit: 0, entry_count: 0 }
    ) || { total_debit: 0, total_credit: 0, entry_count: 0 };

    console.log(`✅ Asientos de remuneraciones: ${entries?.length || 0} encontrados`);

    return NextResponse.json({
      success: true,
      data: {
        entries: entries || [],
        totals,
        filter_applied: period_year && period_month ? `${period_month}/${period_year}` : 'Todos los períodos'
      }
    });

  } catch (error) {
    console.error('Error in GET /api/accounting/payroll-journal:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Revertir asientos contables de remuneraciones por período
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period_year = searchParams.get('period_year');
    const period_month = searchParams.get('period_month');

    if (!period_year || !period_month) {
      return NextResponse.json(
        { success: false, error: 'period_year y period_month son requeridos' },
        { status: 400 }
      );
    }

    console.log('🔍 API Payroll Journal - DELETE:', { period_year, period_month });

    const period_description = `${period_month.toString().padStart(2, '0')}/${period_year}`;

    // Marcar como revertidos en lugar de eliminar
    const { data: revertedEntries, error } = await supabase
      .from('journal_book')
      .update({ status: 'reversed' })
      .eq('reference_type', 'REMUNERACION')
      .like('description', `%${period_description}%`)
      .eq('status', 'active')
      .select();

    if (error) {
      console.error('Error reversing payroll journal entries:', error);
      return NextResponse.json(
        { success: false, error: 'Error al revertir asientos de remuneraciones' },
        { status: 500 }
      );
    }

    console.log(`✅ ${revertedEntries?.length || 0} asientos revertidos para período ${period_description}`);

    return NextResponse.json({
      success: true,
      data: {
        reverted_entries: revertedEntries || [],
        period: period_description,
        count: revertedEntries?.length || 0
      },
      message: `${revertedEntries?.length || 0} asientos de remuneraciones revertidos para ${period_description}`
    });

  } catch (error) {
    console.error('Error in DELETE /api/accounting/payroll-journal:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}