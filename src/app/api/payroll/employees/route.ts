import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
// import fileEmployeeStore from '@/lib/fileEmployeeStore'; // COMENTADO - Ya no usar file store

// GET - Obtener todos los empleados de una empresa
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    console.log('🔍 API empleados llamada para company_id:', companyId);

    // Consulta ORIGINAL con Supabase - RESTAURADA
    const { data: employees, error } = await supabase
      .from('employees')
      .select(`
        *,
        employment_contracts (
          id,
          position,
          department,
          contract_type,
          start_date,
          end_date,
          base_salary,
          salary_type,
          status
        ),
        payroll_config (
          afp_code,
          health_institution_code,
          family_allowances,
          legal_gratification_type,
          has_unemployment_insurance
        )
      `)
      .eq('company_id', companyId)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('❌ Error Supabase empleados:', error);
      return NextResponse.json(
        { error: 'Error obteniendo empleados de la base de datos' },
        { status: 500 }
      );
    }

    console.log('✅ Empleados desde Supabase:', employees?.length || 0);

    return NextResponse.json({
      success: true,
      data: employees || [],
      count: employees?.length || 0,
      mode: 'supabase_database'
    });
  } catch (error) {
    console.error('Error en GET /api/payroll/employees:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo empleado con contrato
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔍 API POST empleados - datos recibidos:', JSON.stringify(body, null, 2));
    
    // Validaciones básicas
    if (!body.company_id || !body.rut || !body.first_name || !body.last_name || !body.email) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: company_id, rut, first_name, last_name, email' },
        { status: 400 }
      );
    }
    
    // 1. CREAR EMPLEADO
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert({
        company_id: body.company_id,
        rut: body.rut,
        first_name: body.first_name,
        last_name: body.last_name,
        middle_name: body.middle_name || null,
        birth_date: body.birth_date,
        gender: body.gender,
        marital_status: body.marital_status,
        nationality: body.nationality,
        email: body.email,
        phone: body.phone,
        mobile_phone: body.mobile_phone,
        address: body.address,
        city: body.city,
        region: body.region,
        postal_code: body.postal_code,
        emergency_contact_name: body.emergency_contact_name,
        emergency_contact_phone: body.emergency_contact_phone,
        emergency_contact_relationship: body.emergency_contact_relationship,
        status: 'active',
        created_by: body.created_by
      })
      .select()
      .single();

    if (employeeError) {
      console.error('❌ Error creando empleado:', employeeError);
      
      if (employeeError.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un empleado con ese RUT en esta empresa' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error creando empleado en base de datos' },
        { status: 500 }
      );
    }

    console.log('✅ Empleado creado:', employee.id);

    // 2. CREAR CONTRATO (si se proporcionaron datos)
    let contract = null;
    if (body.position && body.base_salary) {
      const { data: contractData, error: contractError } = await supabase
        .from('employment_contracts')
        .insert({
          employee_id: employee.id,
          company_id: body.company_id,
          position: body.position,
          department: body.department,
          contract_type: body.contract_type || 'indefinido',
          start_date: body.start_date,
          end_date: body.contract_type === 'indefinido' ? null : body.end_date,
          base_salary: parseFloat(body.base_salary) || 0,
          salary_type: body.salary_type || 'monthly',
          weekly_hours: parseFloat(body.weekly_hours) || 45,
          status: 'active',
          created_by: body.created_by
        })
        .select()
        .single();

      if (contractError) {
        console.error('⚠️ Error creando contrato:', contractError);
        // No cancelar la creación del empleado, solo avisar
      } else {
        contract = contractData;
        console.log('✅ Contrato creado:', contract.id);
      }
    }

    // 3. CREAR CONFIGURACIÓN PREVISIONAL (si se proporcionó)
    let payrollConfig = null;
    if (body.payroll_config) {
      const { data: configData, error: configError } = await supabase
        .from('payroll_config')
        .insert({
          employee_id: employee.id,
          afp_code: body.payroll_config.afp_code || 'HABITAT',
          health_institution_code: body.payroll_config.health_institution_code || 'FONASA',
          family_allowances: body.payroll_config.family_allowances || 0
        })
        .select()
        .single();

      if (configError) {
        console.error('⚠️ Error creando configuración previsional:', configError);
      } else {
        payrollConfig = configData;
        console.log('✅ Configuración previsional creada');
      }
    }

    // 4. RESPUESTA EXITOSA
    return NextResponse.json({
      success: true,
      data: {
        ...employee,
        employment_contracts: contract ? [contract] : [],
        payroll_config: payrollConfig ? [payrollConfig] : []
      },
      message: 'Empleado creado exitosamente',
      mode: 'supabase_database'
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/payroll/employees:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar empleado
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, company_id, ...updateData } = body;

    if (!id || !company_id) {
      return NextResponse.json(
        { error: 'ID del empleado y company_id son requeridos' },
        { status: 400 }
      );
    }

    console.log('🔍 Actualizando empleado:', id, 'con datos:', updateData);

    // Actualizar en Supabase
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando empleado:', updateError);
      return NextResponse.json(
        { error: 'Error actualizando empleado en base de datos' },
        { status: 500 }
      );
    }

    if (!updatedEmployee) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Empleado actualizado en Supabase:', updatedEmployee.id);

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Empleado actualizado exitosamente',
      mode: 'supabase_database'
    });
  } catch (error) {
    console.error('Error en PATCH /api/payroll/employees:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Desactivar empleado (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const companyId = searchParams.get('company_id');

    if (!id || !companyId) {
      return NextResponse.json(
        { error: 'ID del empleado y company_id son requeridos' },
        { status: 400 }
      );
    }

    console.log('🔍 Desactivando empleado:', id, 'de empresa:', companyId);

    // Desactivar en Supabase (soft delete)
    const { data: updatedEmployee, error: deleteError } = await supabase
      .from('employees')
      .update({
        status: 'terminated',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (deleteError) {
      console.error('❌ Error desactivando empleado:', deleteError);
      return NextResponse.json(
        { error: 'Error desactivando empleado en base de datos' },
        { status: 500 }
      );
    }

    if (!updatedEmployee) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Empleado desactivado en Supabase:', id);

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Empleado desactivado exitosamente',
      mode: 'supabase_database'
    });
  } catch (error) {
    console.error('Error en DELETE /api/payroll/employees:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}