import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // TEMPORAL: Retornar datos mock para que las liquidaciones funcionen
    const mockEmployees = [
      {
        id: 'mock-employee-1',
        company_id: companyId,
        rut: '12.345.678-9',
        first_name: 'Juan',
        last_name: 'Pérez',
        middle_name: 'Carlos',
        email: 'juan.perez@empresa.cl',
        phone: '+56912345678',
        status: 'active',
        employment_contracts: [
          {
            id: 'mock-contract-1',
            position: 'Desarrollador Senior',
            department: 'Tecnología',
            contract_type: 'indefinido',
            start_date: '2024-01-01',
            base_salary: 1500000,
            salary_type: 'monthly',
            status: 'active'
          }
        ],
        payroll_config: [
          {
            afp_code: 'HABITAT',
            health_institution_code: 'FONASA',
            family_allowances: 2,
            legal_gratification_type: 'code_47',
            has_unemployment_insurance: true
          }
        ]
      },
      {
        id: 'mock-employee-2',
        company_id: companyId,
        rut: '98.765.432-1',
        first_name: 'María',
        last_name: 'González',
        middle_name: 'Isabel',
        email: 'maria.gonzalez@empresa.cl',
        phone: '+56987654321',
        status: 'active',
        employment_contracts: [
          {
            id: 'mock-contract-2',
            position: 'Contadora',
            department: 'Finanzas',
            contract_type: 'indefinido',
            start_date: '2023-06-15',
            base_salary: 1200000,
            salary_type: 'monthly',
            status: 'active'
          }
        ],
        payroll_config: [
          {
            afp_code: 'PROVIDA',
            health_institution_code: 'ISAPRE_CONSALUD',
            family_allowances: 1,
            legal_gratification_type: 'code_50',
            has_unemployment_insurance: true
          }
        ]
      }
    ];

    console.log('✅ Retornando empleados mock:', mockEmployees.length);

    return NextResponse.json({
      success: true,
      data: mockEmployees,
      count: mockEmployees.length,
      mode: 'mock_data'
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
    
    console.log('🔍 API POST empleados - datos recibidos:', body);
    
    // TEMPORAL: Simular creación exitosa sin tocar la base de datos
    const mockNewEmployee = {
      id: `mock-employee-${Date.now()}`,
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
      employment_contracts: [
        {
          id: `mock-contract-${Date.now()}`,
          employee_id: `mock-employee-${Date.now()}`,
          company_id: body.company_id,
          position: body.position,
          department: body.department,
          contract_type: body.contract_type || 'indefinido',
          start_date: body.start_date,
          end_date: body.contract_type === 'indefinido' ? null : body.end_date,
          base_salary: body.base_salary,
          salary_type: body.salary_type || 'monthly',
          weekly_hours: body.weekly_hours || 45,
          status: 'active'
        }
      ],
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
    
    console.log('✅ Empleado mock creado exitosamente:', mockNewEmployee.id);
    
    return NextResponse.json({
      success: true,
      data: mockNewEmployee,
      message: 'Empleado creado exitosamente (modo mock)',
      mode: 'mock_data'
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del empleado es requerido' },
        { status: 400 }
      );
    }

    // Remover campos que no deben actualizarse
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.company_id; // No permitir cambiar de empresa

    const { data: employee, error } = await supabase
      .from('employees')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar empleado:', error);
      return NextResponse.json(
        { error: 'Error al actualizar empleado' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Empleado actualizado exitosamente'
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

    if (!id) {
      return NextResponse.json(
        { error: 'ID del empleado es requerido' },
        { status: 400 }
      );
    }

    // Soft delete - cambiar estado a 'terminated'
    const { data: employee, error } = await supabase
      .from('employees')
      .update({
        status: 'terminated',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al desactivar empleado:', error);
      return NextResponse.json(
        { error: 'Error al desactivar empleado' },
        { status: 500 }
      );
    }

    // También terminar contratos activos
    await supabase
      .from('employment_contracts')
      .update({
        status: 'terminated',
        termination_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('employee_id', id)
      .eq('status', 'active');

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Empleado desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error en DELETE /api/payroll/employees:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}