import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Actualizando AFP correctas para cada empleado...');

    // Mapeo de RUTs a AFP reales según los datos que hemos estado usando
    const afpMapping: Record<string, { afp: string, salud: string }> = {
      '18.209.442-0': { afp: 'MODELO', salud: 'FONASA' },
      '182094420': { afp: 'MODELO', salud: 'FONASA' },
      
      '18.208.947-8': { afp: 'PLANVITAL', salud: 'FONASA' },
      '182089478': { afp: 'PLANVITAL', salud: 'FONASA' },
      
      '17.238.098-0': { afp: 'UNO', salud: 'FONASA' },
      '172380980': { afp: 'UNO', salud: 'FONASA' },
      
      '18.282.415-1': { afp: 'MODELO', salud: 'FONASA' },
      '182824151': { afp: 'MODELO', salud: 'FONASA' },
    };

    // Obtener todos los empleados
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, rut, first_name, last_name')
      .eq('company_id', '8033ee69-b420-4d91-ba0e-482f46cd6fce');

    if (employeesError) {
      console.error('Error obteniendo empleados:', employeesError);
      return NextResponse.json({ success: false, error: employeesError.message });
    }

    console.log(`📋 Encontrados ${employees?.length || 0} empleados`);

    const results = [];

    for (const employee of employees || []) {
      const cleanRut = employee.rut.replace(/[.\-]/g, '');
      const afpData = afpMapping[employee.rut] || afpMapping[cleanRut];

      if (afpData) {
        console.log(`🔍 Actualizando ${employee.first_name} ${employee.last_name} (${employee.rut}) → ${afpData.afp}`);

        // Actualizar o crear configuración previsional
        const { data, error } = await supabase
          .from('payroll_config')
          .upsert({
            employee_id: employee.id,
            afp_code: afpData.afp,
            health_institution_code: afpData.salud,
            family_allowances: 0,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'employee_id'
          });

        if (error) {
          console.error(`❌ Error actualizando ${employee.rut}:`, error);
          results.push({
            rut: employee.rut,
            name: `${employee.first_name} ${employee.last_name}`,
            success: false,
            error: error.message
          });
        } else {
          console.log(`✅ Actualizado exitosamente: ${employee.rut} → ${afpData.afp}`);
          results.push({
            rut: employee.rut,
            name: `${employee.first_name} ${employee.last_name}`,
            success: true,
            afp: afpData.afp,
            salud: afpData.salud
          });
        }
      } else {
        console.log(`⚠️ No se encontró AFP para ${employee.rut}, dejando como estaba`);
        results.push({
          rut: employee.rut,
          name: `${employee.first_name} ${employee.last_name}`,
          success: false,
          error: 'No encontrado en mapeo AFP'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Actualización de AFP completada',
      results: results,
      summary: {
        total: employees?.length || 0,
        updated: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando AFP:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}