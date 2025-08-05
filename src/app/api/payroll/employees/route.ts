import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fileEmployeeStore from '@/lib/fileEmployeeStore';

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Usar el store en memoria para obtener empleados
    const employees = fileEmployeeStore.getEmployeesByCompany(companyId);
    
    console.log('✅ Retornando empleados desde store:', employees.length);

    return NextResponse.json({
      success: true,
      data: employees,
      count: employees.length,
      mode: 'file_persistent_store'
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
    
    // Crear empleado con estructura completa
    const newEmployee = {
      id: '', // Se generará en el store
      company_id: body.company_id,
      rut: body.rut,
      first_name: body.first_name,
      last_name: body.last_name,
      middle_name: body.middle_name || '',
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      employment_contracts: body.position ? [
        {
          id: `contract-${Date.now()}`,
          position: body.position,
          department: body.department,
          contract_type: body.contract_type || 'indefinido',
          start_date: body.start_date,
          end_date: body.contract_type === 'indefinido' ? null : body.end_date,
          base_salary: parseFloat(body.base_salary) || 0,
          salary_type: body.salary_type || 'monthly',
          weekly_hours: body.weekly_hours || 45,
          status: 'active'
        }
      ] : [],
      payroll_config: [
        {
          afp_code: body.payroll_config?.afp_code || 'HABITAT',
          health_institution_code: body.payroll_config?.health_institution_code || 'FONASA',
          family_allowances: body.payroll_config?.family_allowances || 0,
          legal_gratification_type: body.payroll_config?.legal_gratification_type || 'none',
          has_unemployment_insurance: body.payroll_config?.has_unemployment_insurance !== false
        }
      ]
    };
    
    // Agregar al store
    const savedEmployee = fileEmployeeStore.addEmployee(newEmployee);
    
    console.log('✅ Empleado guardado en store:', savedEmployee.id);
    
    return NextResponse.json({
      success: true,
      data: savedEmployee,
      message: 'Empleado creado exitosamente y guardado permanentemente',
      mode: 'file_persistent_store'
    }, { status: 201 });
    
    /* CÓDIGO ORIGINAL COMENTADO TEMPORALMENTE
    const {
      // Datos del empleado
      company_id,
      rut,
      first_name,
      last_name,
      middle_name,
      birth_date,
      gender,
      marital_status,
      nationality,
      email,
      phone,
      mobile_phone,
      address,
      city,
      region,
      postal_code,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      
      // Datos del contrato
      position,
      department,
      contract_type,
      start_date,
      end_date,
      base_salary,
      salary_type,
      weekly_hours,
      health_insurance,
      pension_fund,
      
      // Metadata
      created_by
    } = body;

    // Validaciones básicas
    if (!company_id || !rut || !first_name || !last_name || !birth_date || !email) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Iniciar transacción para crear empleado y contrato
    // Primero crear el empleado
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert({
        company_id,
        rut,
        first_name,
        last_name,
        middle_name,
        birth_date,
        gender,
        marital_status,
        nationality,
        email,
        phone,
        mobile_phone,
        address,
        city,
        region,
        postal_code,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        status: 'active',
        created_by
      })
      .select()
      .single();

    if (employeeError) {
      console.error('Error al crear empleado:', employeeError);
      
      // Verificar si es error de duplicado
      if (employeeError.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe un empleado con ese RUT en esta empresa' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error al crear empleado' },
        { status: 500 }
      );
    }

    // Si se proporcionaron datos de contrato, crear el contrato
    if (position && start_date && base_salary) {
      const { data: contract, error: contractError } = await supabase
        .from('employment_contracts')
        .insert({
          employee_id: employee.id,
          company_id,
          position,
          department,
          contract_type: contract_type || 'indefinido',
          start_date,
          end_date: contract_type === 'indefinido' ? null : end_date,
          base_salary,
          salary_type: salary_type || 'monthly',
          weekly_hours: weekly_hours || 45,
          status: 'active',
          created_by
        })
        .select()
        .single();

      if (contractError) {
        console.error('Error al crear contrato:', contractError);
        
        // Si falla el contrato, eliminar el empleado creado
        await supabase
          .from('employees')
          .delete()
          .eq('id', employee.id);
        
        return NextResponse.json(
          { error: 'Error al crear contrato' },
          { status: 500 }
        );
      }

      // Crear configuración previsional si se proporcionaron datos
      if (health_insurance && pension_fund) {
        // Obtener comisión AFP
        const afpCommissions: Record<string, number> = {
          'Capital': 1.44,
          'Cuprum': 1.44,
          'Habitat': 1.27,
          'Modelo': 0.77,
          'PlanVital': 1.16,
          'ProVida': 1.45,
          'Uno': 0.69
        };

        const { error: configError } = await supabase
          .from('payroll_config')
          .insert({
            employee_id: employee.id,
            afp_name: pension_fund,
            afp_commission: afpCommissions[pension_fund] || 1.27,
            health_system: health_insurance === 'FONASA' ? 'fonasa' : 'isapre',
            health_provider: health_insurance === 'FONASA' ? null : health_insurance,
            health_plan: health_insurance === 'FONASA' ? null : 'Plan Base',
            health_plan_uf: health_insurance === 'FONASA' ? null : 2.5,
            afc_contract_type: contract_type || 'indefinido',
            family_charges: 0,
            has_agreed_deposit: false,
            agreed_deposit_amount: 0
          });

        if (configError) {
          console.error('Error al crear configuración previsional:', configError);
          // No fallar la creación completa, solo advertir
        }
      }

      // Retornar empleado con contrato
      return NextResponse.json({
        success: true,
        data: {
          ...employee,
          employment_contracts: [contract]
        },
        message: 'Empleado, contrato y configuración previsional creados exitosamente'
      }, { status: 201 });
    }

    // Retornar solo empleado si no hay contrato
    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Empleado creado exitosamente'
    }, { status: 201 });
    */ // FIN DEL CÓDIGO COMENTADO

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

    // Actualizar en el store
    const updatedEmployee = fileEmployeeStore.updateEmployee(company_id, id, updateData);

    if (!updatedEmployee) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Empleado actualizado en store:', updatedEmployee.id);

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Empleado actualizado exitosamente',
      mode: 'file_persistent_store'
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

    // Desactivar en el store (soft delete)
    const success = fileEmployeeStore.deleteEmployee(companyId, id);

    if (!success) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    // Obtener el empleado actualizado
    const updatedEmployee = fileEmployeeStore.getEmployeeById(companyId, id);

    console.log('✅ Empleado desactivado en store:', id);

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Empleado desactivado exitosamente',
      mode: 'file_persistent_store'
    });
  } catch (error) {
    console.error('Error en DELETE /api/payroll/employees:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}