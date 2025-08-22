import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Códigos AFP según Tabla N°10 oficial Previred
const AFP_CODES: Record<string, string> = {
  'CUPRUM': '03',
  'HABITAT': '05', 
  'PROVIDA': '08',
  'PLANVITAL': '29',
  'CAPITAL': '33',
  'MODELO': '34',
  'UNO': '35'
};

// Función para limpiar RUT (remover puntos y guión)
function cleanRut(rut: string): string {
  if (!rut) return '';
  return rut.replace(/[.\-]/g, '');
}

// Función para formatear período (MMYYYY -> MMYYYY)
function formatPeriod(period: string): string {
  // Si viene como "2025-08", convertir a "082025"
  if (period.includes('-')) {
    const [year, month] = period.split('-');
    return `${month.padStart(2, '0')}${year}`;
  }
  return period;
}

// Función para generar línea de empleado en formato Previred oficial (105 campos)
function generatePreviredLine(employee: any, liquidation: any, period: string): string {
  const parts: string[] = [];
  
  // Limpiar RUT y extraer dígito verificador
  const cleanedRut = cleanRut(employee.rut || '');
  const rutWithoutDV = cleanedRut.slice(0, -1);
  const dv = cleanedRut.slice(-1);
  
  // Valores calculados
  const imponible = Math.round(liquidation.total_taxable_income || 0);
  const afpAmount = Math.round((liquidation.afp_amount || 0) + (liquidation.afp_commission_amount || 0));
  const saludAmount = Math.round(liquidation.health_amount || 0);
  const sisAmount = Math.round(liquidation.sis_amount || 0);
  const cesantiaEmpleador = Math.round(liquidation.unemployment_employer_amount || 0);
  const cesantiaTrabajador = Math.round(liquidation.unemployment_employee_amount || 0);
  const formattedPeriod = formatPeriod(period);
  
  // 1-14: DATOS DEL TRABAJADOR
  parts.push(rutWithoutDV);                                           // 1. RUT Trabajador
  parts.push(dv);                                                     // 2. DV Trabajador  
  parts.push(employee.apellido_paterno || '');                        // 3. Apellido Paterno
  parts.push(employee.apellido_materno || '');                        // 4. Apellido Materno
  parts.push(employee.nombres || '');                                 // 5. Nombres
  parts.push(employee.gender?.toUpperCase() === 'FEMALE' ? 'F' : 'M'); // 6. Sexo
  parts.push('0');                                                    // 7. Nacionalidad (0=Chileno)
  parts.push('01');                                                   // 8. Tipo Pago (01=Remuneraciones)
  parts.push(formattedPeriod);                                        // 9. Período Desde
  parts.push(formattedPeriod);                                        // 10. Período Hasta
  parts.push('AFP');                                                  // 11. Régimen Previsional
  parts.push('0');                                                    // 12. Tipo Trabajador (0=Activo)
  parts.push((liquidation.days_worked || 30).toString());            // 13. Días Trabajados
  parts.push('00');                                                   // 14. Tipo de Línea (00=Principal)
  
  // 15-25: MOVIMIENTO DE PERSONAL Y ASIGNACIÓN FAMILIAR
  parts.push('0');                                                    // 15. Código Movimiento Personal
  parts.push('');                                                     // 16. Fecha Desde
  parts.push('');                                                     // 17. Fecha Hasta  
  parts.push('D');                                                    // 18. Tramo Asignación Familiar
  parts.push('0');                                                    // 19. N° Cargas Simples
  parts.push('0');                                                    // 20. N° Cargas Maternales
  parts.push('0');                                                    // 21. N° Cargas Inválidas
  parts.push('0');                                                    // 22. Asignación Familiar
  parts.push('0');                                                    // 23. Asignación Familiar Retroactiva
  parts.push('0');                                                    // 24. Reintegro Cargas Familiares
  parts.push('N');                                                    // 25. Subsidio Trabajador Joven
  
  // 26-39: DATOS AFP
  const afpCode = AFP_CODES[liquidation.afp_name?.toUpperCase()] || '34';
  parts.push(afpCode);                                               // 26. Código AFP
  parts.push(imponible.toString());                                  // 27. Renta Imponible AFP
  parts.push(afpAmount.toString());                                  // 28. Cotización Obligatoria AFP
  parts.push(sisAmount.toString());                                  // 29. Cotización SIS
  parts.push('0');                                                   // 30. Cuenta Ahorro Voluntario AFP
  parts.push('0');                                                   // 31. Renta Imp. Sustitutiva
  parts.push('00,00');                                               // 32. Tasa Pactada
  parts.push('0');                                                   // 33. Aporte Indemnización
  parts.push('00');                                                  // 34. N° Períodos
  parts.push('');                                                    // 35. Período Desde Sustitutiva
  parts.push('');                                                    // 36. Período Hasta Sustitutiva
  parts.push('');                                                    // 37. Puesto Trabajo Pesado
  parts.push('00,00');                                               // 38. % Cotización Trabajo Pesado
  parts.push('0');                                                   // 39. Cotización Trabajo Pesado
  
  // 40-49: DATOS AHORRO PREVISIONAL VOLUNTARIO (APVI Y APVC)
  parts.push('000');                                                 // 40. Código Institución APVI
  parts.push('');                                                    // 41. Número Contrato APVI
  parts.push('0');                                                   // 42. Forma Pago APVI
  parts.push('0');                                                   // 43. Cotización APVI
  parts.push('0');                                                   // 44. Cotización Depósitos Convenidos
  parts.push('000');                                                 // 45. Código Institución APVC
  parts.push('');                                                    // 46. Número Contrato APVC
  parts.push('0');                                                   // 47. Forma Pago APVC
  parts.push('0');                                                   // 48. Cotización Trabajador APVC
  parts.push('0');                                                   // 49. Cotización Empleador APVC
  
  // 50-61: DATOS AFILIADO VOLUNTARIO
  parts.push('0');                                                   // 50. RUT Afiliado Voluntario
  parts.push('');                                                    // 51. DV Afiliado Voluntario
  parts.push('');                                                    // 52. Apellido Paterno AV
  parts.push('');                                                    // 53. Apellido Materno AV
  parts.push('');                                                    // 54. Nombres AV
  parts.push('0');                                                   // 55. Código Movimiento Personal AV
  parts.push('');                                                    // 56. Fecha Desde AV
  parts.push('');                                                    // 57. Fecha Hasta AV
  parts.push('0');                                                   // 58. Código AFP AV
  parts.push('0');                                                   // 59. Monto Capitalización Voluntaria
  parts.push('0');                                                   // 60. Monto Ahorro Voluntario
  parts.push('0');                                                   // 61. Número Períodos Cotización
  
  // 62-74: DATOS IPS-ISL-FONASA
  parts.push('0000');                                                // 62. Código Ex-Caja Régimen
  parts.push('00,00');                                               // 63. Tasa Cotización Ex-Caja
  parts.push('0');                                                   // 64. Renta Imponible IPS
  parts.push('0');                                                   // 65. Cotización Obligatoria IPS
  parts.push('0');                                                   // 66. Renta Imponible Desahucio
  parts.push('0000');                                                // 67. Código Ex-Caja Desahucio
  parts.push('00,00');                                               // 68. Tasa Cotización Desahucio
  parts.push('0');                                                   // 69. Cotización Desahucio
  parts.push(liquidation.health_institution === 'FONASA' ? saludAmount.toString() : '0'); // 70. Cotización Fonasa
  parts.push('0');                                                   // 71. Cotización Acc. Trabajo ISL
  parts.push('0');                                                   // 72. Bonificación Ley 15.386
  parts.push('0');                                                   // 73. Descuento Cargas Familiares IPS
  parts.push('0');                                                   // 74. Bonos Gobierno
  
  // 75-82: DATOS SALUD
  const healthCode = liquidation.health_institution === 'FONASA' ? '07' : '00';
  parts.push(healthCode);                                            // 75. Código Institución Salud
  parts.push('');                                                    // 76. Número FUN
  parts.push(liquidation.health_institution !== 'FONASA' ? imponible.toString() : '0'); // 77. Renta Imponible Isapre
  parts.push('1');                                                   // 78. Moneda Plan Pactado (1=Pesos)
  parts.push('0');                                                   // 79. Cotización Pactada
  parts.push(liquidation.health_institution !== 'FONASA' ? saludAmount.toString() : '0'); // 80. Cotización Obligatoria Isapre
  parts.push('0');                                                   // 81. Cotización Adicional Voluntaria
  parts.push('0');                                                   // 82. Monto GES
  
  // 83-95: DATOS CAJA DE COMPENSACIÓN
  parts.push('00');                                                  // 83. Código CCAF
  parts.push('0');                                                   // 84. Renta Imponible CCAF
  parts.push('0');                                                   // 85. Créditos Personales CCAF
  parts.push('0');                                                   // 86. Descuento Dental CCAF
  parts.push('0');                                                   // 87. Descuentos Leasing
  parts.push('0');                                                   // 88. Descuentos Seguro Vida CCAF
  parts.push('0');                                                   // 89. Otros Descuentos CCAF
  parts.push('0');                                                   // 90. Cotización CCAF No Afiliados Isapre
  parts.push('0');                                                   // 91. Descuento Cargas Familiares CCAF
  parts.push('0');                                                   // 92. Otros Descuentos CCAF 1
  parts.push('0');                                                   // 93. Otros Descuentos CCAF 2
  parts.push('0');                                                   // 94. Bonos Gobierno
  parts.push('0');                                                   // 95. Código Sucursal
  
  // 96-99: DATOS MUTUALIDAD
  parts.push('00');                                                  // 96. Código Mutualidad
  parts.push('0');                                                   // 97. Renta Imponible Mutual
  parts.push('0');                                                   // 98. Cotización Acc. Trabajo Mutual
  parts.push('0');                                                   // 99. Sucursal Pago Mutual
  
  // 100-102: DATOS SEGURO CESANTÍA
  parts.push(imponible.toString());                                  // 100. Renta Imponible Seguro Cesantía
  parts.push(cesantiaTrabajador.toString());                         // 101. Aporte Trabajador Seguro Cesantía
  parts.push(cesantiaEmpleador.toString());                          // 102. Aporte Empleador Seguro Cesantía
  
  // 103-105: DATOS FINALES
  parts.push('0');                                                   // 103. RUT Pagadora Subsidio
  parts.push('');                                                    // 104. DV Pagadora Subsidio
  parts.push('GENERAL');                                             // 105. Centro Costos/Sucursal
  
  return parts.join(';');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const period = searchParams.get('period'); // formato: "2025-08"
    
    if (!companyId || !period) {
      return NextResponse.json(
        { success: false, error: 'company_id y period son requeridos' },
        { status: 400 }
      );
    }

    console.log('🔍 Generando archivo Previred para company:', companyId, 'period:', period);

    // 1. Obtener libro de remuneraciones del período
    const { data: payrollBook, error: bookError } = await supabase
      .from('payroll_books')
      .select(`
        id,
        period,
        company_name,
        company_rut,
        payroll_book_details (
          employee_rut,
          apellido_paterno,
          apellido_materno,
          nombres,
          cargo,
          area
        )
      `)
      .eq('company_id', companyId)
      .eq('period', period)
      .single();

    if (bookError || !payrollBook) {
      return NextResponse.json(
        { success: false, error: 'Libro de remuneraciones no encontrado para el período especificado' },
        { status: 404 }
      );
    }

    // 2. Obtener liquidaciones del período para datos de cálculo
    const [year, month] = period.split('-');
    const { data: liquidations, error: liquidationsError } = await supabase
      .from('payroll_liquidations')
      .select(`
        *,
        employees (
          rut,
          first_name,
          last_name,
          middle_name,
          gender
        )
      `)
      .eq('company_id', companyId)
      .eq('period_year', parseInt(year))
      .eq('period_month', parseInt(month));

    if (liquidationsError) {
      return NextResponse.json(
        { success: false, error: 'Error al obtener liquidaciones' },
        { status: 500 }
      );
    }

    // 3. Generar líneas del archivo Previred
    const previredLines: string[] = [];
    
    for (const employee of payrollBook.payroll_book_details || []) {
      // Buscar liquidación correspondiente
      const liquidation = liquidations?.find(liq => 
        liq.employees?.rut === employee.employee_rut
      );
      
      if (liquidation) {
        // Combinar datos de empleado del libro con datos de liquidación
        const employeeData = {
          rut: employee.employee_rut,
          apellido_paterno: employee.apellido_paterno,
          apellido_materno: employee.apellido_materno,
          nombres: employee.nombres,
          gender: liquidation.employees?.gender
        };
        
        const previredLine = generatePreviredLine(employeeData, liquidation, period);
        previredLines.push(previredLine);
        
        console.log('✅ Línea Previred generada para:', employee.nombres, employee.apellido_paterno);
      } else {
        console.log('⚠️ No se encontró liquidación para:', employee.employee_rut);
      }
    }

    if (previredLines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se pudieron generar líneas para el archivo Previred' },
        { status: 404 }
      );
    }

    // 4. Generar contenido del archivo
    const fileContent = previredLines.join('\n');
    const filename = `previred_${formatPeriod(period)}_${payrollBook.company_rut?.replace(/[.\-]/g, '') || 'empresa'}.txt`;

    console.log('✅ Archivo Previred generado con', previredLines.length, 'empleados');

    // 5. Retornar archivo como descarga
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Error generando archivo Previred:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}