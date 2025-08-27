import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseConnection, isSupabaseConfigured } from '@/lib/database/databaseSimple';
import { SettlementCalculator, type EmployeeTerminationData } from '@/lib/services/settlementCalculator';

// GET - Obtener finiquitos de una empresa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const employeeId = searchParams.get('employee_id');
    const status = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Base de datos no configurada' },
        { status: 503 }
      );
    }

    const supabase = getDatabaseConnection();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Error de configuración de base de datos' },
        { status: 503 }
      );
    }

    // First, try simple query without joins to avoid FK issues
    let query = supabase
      .from('employee_terminations')
      .select('*')
      .eq('company_id', companyId);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: terminations, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching terminations:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al obtener finiquitos',
          details: error.message,
          hint: error.hint 
        },
        { status: 500 }
      );
    }

    // Enrich terminations with employee data separately
    const enrichedTerminations = [];
    
    for (const termination of terminations || []) {
      // Get employee data
      const { data: employee } = await supabase
        .from('employees')
        .select('id, rut, first_name, last_name')
        .eq('id', termination.employee_id)
        .single();

      // Get contract data  
      const { data: contracts } = await supabase
        .from('employment_contracts')
        .select('position, base_salary, contract_type')
        .eq('employee_id', termination.employee_id)
        .eq('status', 'active')
        .limit(1);

      // Add employee data to termination
      enrichedTerminations.push({
        ...termination,
        employees: {
          ...employee,
          employment_contracts: contracts || []
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: enrichedTerminations
    });

  } catch (error) {
    console.error('Error in GET /api/payroll/terminations:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear y calcular finiquito
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

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Base de datos no configurada' },
        { status: 503 }
      );
    }

    const supabase = getDatabaseConnection();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Error de configuración de base de datos' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { employee_id, termination_date, termination_cause_code, last_work_date, ...additionalData } = body;

    // 1. Obtener datos del empleado (sin JOIN para evitar errores)
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employee_id)
      .eq('company_id', companyId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    // 2. Obtener contrato del empleado por separado
    const { data: contracts } = await supabase
      .from('employment_contracts')
      .select('*')
      .eq('employee_id', employee_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    const contract = contracts?.[0];
    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contrato activo no encontrado para el empleado' },
        { status: 404 }
      );
    }

    // 3. Obtener información de la causal de término
    const { data: terminationCause } = await supabase
      .from('termination_causes')
      .select('*')
      .eq('article_code', termination_cause_code)
      .single();

    // 4. Cálculos básicos (simplificados temporalmente)
    const basicCalculation = {
      termination_cause: {
        article_name: terminationCause?.article_name || 'Causa de término',
        requires_notice: terminationCause?.requires_notice || false,
        notice_days: terminationCause?.notice_days || 0
      },
      // Valores básicos por defecto
      days_worked_last_month: 30,
      pending_salary_days: 0,
      pending_salary_amount: 0,
      total_vacation_days_earned: 15,
      vacation_days_taken: 0,
      pending_vacation_days: 15,
      vacation_daily_rate: Math.round(contract.base_salary / 30),
      pending_vacation_amount: Math.round(contract.base_salary / 30 * 15),
      proportional_vacation_days: 0,
      proportional_vacation_amount: 0,
      years_of_service: 1,
      severance_amount: terminationCause?.requires_severance ? contract.base_salary : 0,
      notice_indemnification_amount: terminationCause?.requires_notice ? contract.base_salary : 0,
      christmas_bonus_amount: 0,
      pending_overtime_amount: 0,
      other_bonuses_amount: 0,
      total_compensations: 0,
      total_deductions: 0,
      final_net_amount: 0,
      employee: {
        monthly_salary: contract.base_salary
      }
    };

    // Calcular totales
    basicCalculation.total_compensations = 
      basicCalculation.pending_salary_amount +
      basicCalculation.pending_vacation_amount +
      basicCalculation.severance_amount +
      basicCalculation.notice_indemnification_amount;
    
    basicCalculation.final_net_amount = basicCalculation.total_compensations - basicCalculation.total_deductions;

    // 4. Guardar en base de datos
    const { data: savedTermination, error: saveError } = await supabase
      .from('employee_terminations')
      .insert({
        company_id: companyId,
        employee_id: employee_id,
        termination_date: termination_date,
        termination_cause_code: termination_cause_code,
        termination_cause_description: basicCalculation.termination_cause.article_name,
        notice_given: basicCalculation.termination_cause.requires_notice,
        notice_days: basicCalculation.termination_cause.notice_days,
        
        // Resultados del cálculo básico
        worked_days_last_month: basicCalculation.days_worked_last_month,
        pending_salary_days: basicCalculation.pending_salary_days,
        pending_salary_amount: basicCalculation.pending_salary_amount,
        
        total_vacation_days_earned: basicCalculation.total_vacation_days_earned,
        vacation_days_taken: basicCalculation.vacation_days_taken,
        pending_vacation_days: basicCalculation.pending_vacation_days,
        vacation_daily_rate: basicCalculation.vacation_daily_rate,
        pending_vacation_amount: basicCalculation.pending_vacation_amount,
        
        proportional_vacation_days: basicCalculation.proportional_vacation_days,
        proportional_vacation_amount: basicCalculation.proportional_vacation_amount,
        
        severance_years_service: basicCalculation.years_of_service,
        severance_monthly_salary: basicCalculation.employee.monthly_salary,
        severance_amount: basicCalculation.severance_amount,
        notice_indemnification_amount: basicCalculation.notice_indemnification_amount,
        
        christmas_bonus_amount: basicCalculation.christmas_bonus_amount,
        pending_overtime_amount: basicCalculation.pending_overtime_amount,
        other_bonuses_amount: basicCalculation.other_bonuses_amount,
        
        total_to_pay: basicCalculation.total_compensations,
        total_deductions: basicCalculation.total_deductions,
        final_net_amount: basicCalculation.final_net_amount,
        
        status: 'calculated',
        termination_reason_details: additionalData.termination_reason_details || null
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving termination:', saveError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al guardar finiquito',
          details: saveError.message,
          hint: saveError.hint,
          code: saveError.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        termination: savedTermination,
        calculation: basicCalculation
      }
    });

  } catch (error) {
    console.error('Error in POST /api/payroll/terminations:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar estado del finiquito
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    const supabase = getDatabaseConnection();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Error de configuración de base de datos' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { termination_id, status, employee_signature_date, company_signature_date, witness_name, witness_rut } = body;

    const { data: updatedTermination, error: updateError } = await supabase
      .from('employee_terminations')
      .update({
        status,
        employee_signature_date,
        company_signature_date,
        witness_name,
        witness_rut,
        updated_at: new Date().toISOString()
      })
      .eq('id', termination_id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating termination:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar finiquito' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTermination
    });

  } catch (error) {
    console.error('Error in PUT /api/payroll/terminations:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}