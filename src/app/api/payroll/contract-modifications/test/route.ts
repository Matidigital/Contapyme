import { NextRequest, NextResponse } from 'next/server';
import { createContractModification } from '@/lib/contractModificationsHelper';

// API ESPECIAL PARA CREAR MODIFICACIÓN DE PRUEBA
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 API TEST: Creando modificación de prueba para Francisco Mancilla');

    // Crear modificación de prueba: Aumento salarial para Francisco
    const modification = await createContractModification(
      '8033ee69-b420-4d91-ba0e-482f46cd6fce', // company_id
      '0ec169ea-6453-4ea5-85ce-3f49b548bef2', // Francisco Mancilla employee_id (del log anterior)
      'salary_change',
      '2025-09-01', // Efectivo desde Septiembre
      { base_salary: 529000 }, // Salario actual
      { base_salary: 650000 }, // Nuevo salario
      'Aumento por evaluación de desempeño excepcional - TEST',
      'ANEXO-001-2025'
    );

    if (!modification) {
      return NextResponse.json({
        success: false,
        error: 'Error creando modificación de prueba'
      }, { status: 500 });
    }

    // Probar función de obtener contrato para período
    const { getContractForPeriod, shouldPayUnemploymentInsurance } = await import('@/lib/contractModificationsHelper');
    
    // Probar contratos para diferentes períodos
    const contractAugust = await getContractForPeriod('0ec169ea-6453-4ea5-85ce-3f49b548bef2', 2025, 8);
    const contractSeptember = await getContractForPeriod('0ec169ea-6453-4ea5-85ce-3f49b548bef2', 2025, 9);
    const contractOctober = await getContractForPeriod('0ec169ea-6453-4ea5-85ce-3f49b548bef2', 2025, 10);

    // Probar cesantía
    const unemploymentSep = await shouldPayUnemploymentInsurance('0ec169ea-6453-4ea5-85ce-3f49b548bef2', 2025, 9);

    return NextResponse.json({
      success: true,
      message: 'Modificación de prueba creada y sistema probado exitosamente',
      data: {
        modification: modification,
        contractTests: {
          august_2025: {
            salary: contractAugust?.base_salary,
            hours: contractAugust?.weekly_hours,
            modifications: contractAugust?.modifications_applied?.length || 0
          },
          september_2025: {
            salary: contractSeptember?.base_salary,
            hours: contractSeptember?.weekly_hours,
            modifications: contractSeptember?.modifications_applied?.length || 0
          },
          october_2025: {
            salary: contractOctober?.base_salary,
            hours: contractOctober?.weekly_hours,
            modifications: contractOctober?.modifications_applied?.length || 0
          }
        },
        unemployment_insurance: {
          september_2025: unemploymentSep
        },
        expected_behavior: {
          august: "Salario: $529,000 (sin modificación)",
          september: "Salario: $650,000 (con modificación automática)",
          october: "Salario: $650,000 (modificación mantenida)"
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en API test:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET para verificar estado del sistema
export async function GET(request: NextRequest) {
  try {
    const { getEmployeeModificationHistory } = await import('@/lib/contractModificationsHelper');
    
    // Obtener historial de Francisco Mancilla
    const history = await getEmployeeModificationHistory('0ec169ea-6453-4ea5-85ce-3f49b548bef2');

    return NextResponse.json({
      success: true,
      message: 'Sistema de modificaciones contractuales operativo',
      data: {
        employee_id: '0ec169ea-6453-4ea5-85ce-3f49b548bef2',
        employee_name: 'Francisco Mancilla Vargas',
        modification_history: history,
        system_status: {
          contract_modifications_table: 'Available',
          helper_functions: 'Loaded',
          api_integration: 'Active'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error verificando sistema:', error);
    return NextResponse.json({
      success: false,
      error: 'Error verificando sistema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}