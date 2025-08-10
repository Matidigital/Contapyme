import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos de empleados típicos de una PyME chilena
const sampleEmployees = [
  {
    rut: '12.345.678-9',
    first_name: 'Juan Carlos',
    last_name: 'González',
    middle_name: 'Silva',
    birth_date: '1985-03-15',
    gender: 'M',
    marital_status: 'casado',
    nationality: 'chilena',
    email: 'jgonzalez@contapyme.cl',
    phone: '+56912345678',
    mobile_phone: '+56987654321',
    address: 'Los Carrera 1234',
    city: 'Santiago',
    region: 'Metropolitana',
    postal_code: '7500000',
    position: 'Desarrollador Senior',
    department: 'Tecnología',
    base_salary: 1200000,
    afp_code: 'HABITAT',
    health_institution_code: 'FONASA',
    family_allowances: 1
  },
  {
    rut: '87.654.321-0',
    first_name: 'María Elena',
    last_name: 'Martínez',
    middle_name: 'López',
    birth_date: '1990-07-22',
    gender: 'F',
    marital_status: 'soltera',
    nationality: 'chilena',
    email: 'mmartinez@contapyme.cl',
    phone: '+56923456789',
    mobile_phone: '+56998765432',
    address: 'San Martín 567',
    city: 'Santiago',
    region: 'Metropolitana',
    postal_code: '7500001',
    position: 'Contadora',
    department: 'Administración',
    base_salary: 950000,
    afp_code: 'PROVIDA',
    health_institution_code: 'FONASA',
    family_allowances: 0
  },
  {
    rut: '11.222.333-4',
    first_name: 'Carlos Alberto',
    last_name: 'Rodríguez',
    middle_name: 'Pérez',
    birth_date: '1982-11-08',
    gender: 'M',
    marital_status: 'casado',
    nationality: 'chilena',
    email: 'crodriguez@contapyme.cl',
    phone: '+56934567890',
    mobile_phone: '+56909876543',
    address: 'Avenida Libertad 890',
    city: 'Santiago',
    region: 'Metropolitana',
    postal_code: '7500002',
    position: 'Gerente Comercial',
    department: 'Ventas',
    base_salary: 1500000,
    afp_code: 'CUPRUM',
    health_institution_code: 'ISAPRE_COLMENA',
    family_allowances: 2
  },
  {
    rut: '22.333.444-5',
    first_name: 'Ana Sofía',
    last_name: 'Hernández',
    middle_name: 'Morales',
    birth_date: '1988-02-14',
    gender: 'F',
    marital_status: 'casada',
    nationality: 'chilena',
    email: 'ahernandez@contapyme.cl',
    phone: '+56945678901',
    mobile_phone: '+56920987654',
    address: 'Pedro de Valdivia 234',
    city: 'Santiago',
    region: 'Metropolitana',
    postal_code: '7500003',
    position: 'Diseñadora Gráfica',
    department: 'Marketing',
    base_salary: 800000,
    afp_code: 'MODELO',
    health_institution_code: 'FONASA',
    family_allowances: 1
  },
  {
    rut: '33.444.555-6',
    first_name: 'Roberto Miguel',
    last_name: 'Fernández',
    middle_name: 'Castillo',
    birth_date: '1975-09-30',
    gender: 'M',
    marital_status: 'casado',
    nationality: 'chilena',
    email: 'rfernandez@contapyme.cl',
    phone: '+56956789012',
    mobile_phone: '+56931098765',
    address: 'Manuel Montt 456',
    city: 'Santiago',
    region: 'Metropolitana',
    postal_code: '7500004',
    position: 'Supervisor Operaciones',
    department: 'Producción',
    base_salary: 750000,
    afp_code: 'PLANVITAL',
    health_institution_code: 'FONASA',
    family_allowances: 3
  }
];

// POST - Generar datos de ejemplo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const companyId = body.company_id || '8033ee69-b420-4d91-ba0e-482f46cd6fce';

    console.log('🚀 Generando datos demo para empresa:', companyId);

    // 1. Limpiar datos existentes (opcional)
    if (body.clear_existing) {
      await supabase.from('payroll_liquidations').delete().eq('company_id', companyId);
      await supabase.from('payroll_config').delete().eq('employee_id', supabase.from('employees').select('id').eq('company_id', companyId));
      await supabase.from('employment_contracts').delete().eq('company_id', companyId);
      await supabase.from('employees').delete().eq('company_id', companyId);
      console.log('🧹 Datos existentes limpiados');
    }

    const results = {
      employees_created: 0,
      contracts_created: 0,
      payroll_configs_created: 0,
      liquidations_created: 0,
      errors: []
    };

    // 2. Crear empleados
    for (const empData of sampleEmployees) {
      try {
        // Crear empleado
        const { data: employee, error: empError } = await supabase
          .from('employees')
          .insert({
            company_id: companyId,
            rut: empData.rut,
            first_name: empData.first_name,
            last_name: empData.last_name,
            middle_name: empData.middle_name,
            birth_date: empData.birth_date,
            gender: empData.gender,
            marital_status: empData.marital_status,
            nationality: empData.nationality,
            email: empData.email,
            phone: empData.phone,
            mobile_phone: empData.mobile_phone,
            address: empData.address,
            city: empData.city,
            region: empData.region,
            postal_code: empData.postal_code,
            status: 'active',
            created_by: companyId
          })
          .select()
          .single();

        if (empError) {
          if (empError.code === '23505') {
            console.log(`⚠️ Empleado ${empData.rut} ya existe, saltando...`);
            continue;
          } else {
            throw empError;
          }
        }

        console.log(`✅ Empleado creado: ${empData.first_name} ${empData.last_name}`);
        results.employees_created++;

        // Crear contrato
        const { data: contract, error: contractError } = await supabase
          .from('employment_contracts')
          .insert({
            employee_id: employee.id,
            company_id: companyId,
            position: empData.position,
            department: empData.department,
            contract_type: 'indefinido',
            start_date: '2024-01-01',
            base_salary: empData.base_salary,
            salary_type: 'monthly',
            weekly_hours: 45,
            status: 'active',
            created_by: companyId
          })
          .select()
          .single();

        if (contractError) throw contractError;
        console.log(`✅ Contrato creado para ${empData.first_name}`);
        results.contracts_created++;

        // Crear configuración previsional
        const { error: configError } = await supabase
          .from('payroll_config')
          .insert({
            employee_id: employee.id,
            afp_code: empData.afp_code,
            health_institution_code: empData.health_institution_code,
            family_allowances: empData.family_allowances
          });

        if (configError) throw configError;
        console.log(`✅ Config previsional creada para ${empData.first_name}`);
        results.payroll_configs_created++;

        // Crear liquidaciones para los últimos 3 meses
        const currentDate = new Date();
        for (let i = 0; i < 3; i++) {
          const liquidationDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const year = liquidationDate.getFullYear();
          const month = liquidationDate.getMonth() + 1;

          // Calcular valores según normativa chilena 2025
          const baseSalary = empData.base_salary;
          const familyAllowance = empData.family_allowances * 15000; // $15.000 por carga familiar
          const foodAllowance = Math.min(baseSalary * 0.2, 25000); // Máximo $25.000
          const transportAllowance = Math.min(baseSalary * 0.15, 20000); // Máximo $20.000

          const totalGrossIncome = baseSalary + familyAllowance + foodAllowance + transportAllowance;

          // Descuentos previsionales
          const afpAmount = Math.round(totalGrossIncome * 0.1); // 10% AFP
          const healthAmount = Math.round(totalGrossIncome * 0.07); // 7% Salud
          const unemploymentAmount = Math.round(totalGrossIncome * 0.006); // 0.6% Cesantía

          // Impuesto único según tramo
          let incomeTaxAmount = 0;
          if (totalGrossIncome > 760801) {
            if (totalGrossIncome <= 1267000) {
              incomeTaxAmount = Math.round((totalGrossIncome - 760801) * 0.04);
            } else if (totalGrossIncome <= 2114000) {
              incomeTaxAmount = Math.round(20248 + (totalGrossIncome - 1267000) * 0.08);
            } else if (totalGrossIncome <= 2960000) {
              incomeTaxAmount = Math.round(88008 + (totalGrossIncome - 2114000) * 0.135);
            }
          }

          const totalDeductions = afpAmount + healthAmount + unemploymentAmount + incomeTaxAmount;
          const netSalary = totalGrossIncome - totalDeductions;

          const { error: liqError } = await supabase
            .from('payroll_liquidations')
            .insert({
              company_id: companyId,
              employee_id: employee.id,
              period_year: year,
              period_month: month,
              days_worked: 30,
              base_salary: baseSalary,
              family_allowance: familyAllowance,
              food_allowance: foodAllowance,
              transport_allowance: transportAllowance,
              total_gross_income: totalGrossIncome,
              afp_amount: afpAmount,
              health_amount: healthAmount,
              unemployment_amount: unemploymentAmount,
              income_tax_amount: incomeTaxAmount,
              total_deductions: totalDeductions,
              net_salary: netSalary,
              status: 'approved',
              created_by: companyId,
              created_at: new Date().toISOString()
            });

          if (liqError) throw liqError;
          results.liquidations_created++;
        }

      } catch (error) {
        console.error(`❌ Error procesando empleado ${empData.first_name}:`, error);
        results.errors.push(`Error con ${empData.first_name}: ${error}`);
      }
    }

    console.log('✅ Datos demo generados exitosamente:', results);

    return NextResponse.json({
      success: true,
      data: results,
      message: `Datos demo generados: ${results.employees_created} empleados, ${results.contracts_created} contratos, ${results.liquidations_created} liquidaciones`
    });

  } catch (error) {
    console.error('❌ Error generando datos demo:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Verificar datos existentes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id') || '8033ee69-b420-4d91-ba0e-482f46cd6fce';

    // Contar empleados
    const { count: employeesCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    // Contar liquidaciones
    const { count: liquidationsCount } = await supabase
      .from('payroll_liquidations')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    // Obtener períodos disponibles
    const { data: periodsData } = await supabase
      .from('payroll_liquidations')
      .select('period_year, period_month')
      .eq('company_id', companyId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false });

    const periods = periodsData?.map(p => `${p.period_year}-${p.period_month.toString().padStart(2, '0')}`) || [];
    const uniquePeriods = [...new Set(periods)];

    return NextResponse.json({
      success: true,
      data: {
        company_id: companyId,
        employees_count: employeesCount || 0,
        liquidations_count: liquidationsCount || 0,
        available_periods: uniquePeriods.slice(0, 6), // Últimos 6 períodos
        ready_for_libro: employeesCount > 0 && liquidationsCount > 0
      }
    });

  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}