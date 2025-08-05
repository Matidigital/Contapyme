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

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    // Obtener empleado con todas sus relaciones
    const { data: employee, error } = await supabase
      .from('employees')
      .select(`
        *,
        employment_contracts (
          id,
          position,
          base_salary,
          status,
          start_date,
          end_date,
          contract_type
        ),
        payroll_config (
          id,
          afp_code,
          health_institution_code,
          family_allowances
        )
      `)
      .eq('id', params.id)
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Error fetching employee:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener empleado' },
        { status: 500 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Error in GET /api/payroll/employees/[id]:', error);
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

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      address,
      birth_date,
      hire_date,
      status,
      contract,
      payroll_config
    } = body;

    // Actualizar empleado
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .update({
        first_name,
        last_name,
        email,
        phone,
        address,
        birth_date,
        hire_date,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (employeeError) {
      console.error('Error updating employee:', employeeError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar empleado' },
        { status: 500 }
      );
    }

    // Actualizar contrato si se proporciona
    if (contract) {
      const { error: contractError } = await supabase
        .from('employment_contracts')
        .update({
          position: contract.position,
          base_salary: contract.base_salary,
          contract_type: contract.contract_type,
          start_date: contract.start_date,
          end_date: contract.end_date,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', params.id)
        .eq('status', 'active');

      if (contractError) {
        console.error('Error updating contract:', contractError);
        // No retornamos error aquí para no fallar toda la operación
      }
    }

    // Actualizar configuración de nómina si se proporciona
    if (payroll_config) {
      const { error: payrollError } = await supabase
        .from('payroll_config')
        .update({
          afp_code: payroll_config.afp_code,
          health_institution_code: payroll_config.health_institution_code,
          family_allowances: payroll_config.family_allowances,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', params.id);

      if (payrollError) {
        console.error('Error updating payroll config:', payrollError);
      }
    }

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Empleado actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error in PUT /api/payroll/employees/[id]:', error);
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

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    // En lugar de eliminar físicamente, marcamos como inactivo
    const { data: employee, error } = await supabase
      .from('employees')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating employee:', error);
      return NextResponse.json(
        { success: false, error: 'Error al dar de baja empleado' },
        { status: 500 }
      );
    }

    // También marcamos los contratos como terminados
    await supabase
      .from('employment_contracts')
      .update({
        status: 'terminated',
        end_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('employee_id', params.id)
      .eq('status', 'active');

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Empleado dado de baja exitosamente'
    });

  } catch (error) {
    console.error('Error in DELETE /api/payroll/employees/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}