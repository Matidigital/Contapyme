import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Códigos AFP según Previred
const AFP_CODES: Record<string, string> = {
  'MODELO': '34',
  'UNO': '05', 
  'CAPITAL': '03',
  'CUPRUM': '08',
  'HABITAT': '32',
  'PLANVITAL': '29',
  'PROVIDA': '02'
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

// Función para generar línea de empleado en formato Previred según ejemplo real
function generatePreviredLine(employee: any, liquidation: any, period: string): string {
  const parts: string[] = [];
  
  // 1-2. RUT sin puntos ni guión + dígito verificador
  const cleanedRut = cleanRut(employee.rut || '');
  const rutWithoutDV = cleanedRut.slice(0, -1); 
  const dv = cleanedRut.slice(-1);
  parts.push(rutWithoutDV, dv);
  
  // 3. Apellido paterno
  parts.push(employee.apellido_paterno || '');
  
  // 4. Apellido materno  
  parts.push(employee.apellido_materno || '');
  
  // 5. Nombres
  parts.push(employee.nombres || '');
  
  // 6. Sexo (M o F)
  parts.push(employee.gender?.toUpperCase() === 'FEMALE' ? 'F' : 'M');
  
  // 7-8. Fijos: 0;1
  parts.push('0', '1');
  
  // 9-10. Período repetido (MMYYYY)
  const formattedPeriod = formatPeriod(period);
  parts.push(formattedPeriod, formattedPeriod);
  
  // 11. AFP literal
  parts.push('AFP');
  
  // 12. Fijo: 0
  parts.push('0');
  
  // 13. Días trabajados
  parts.push((liquidation.days_worked || 30).toString());
  
  // 14-15. Fijos: 0;0
  parts.push('0', '0');
  
  // 16-18. Campos vacíos
  parts.push('', '', '');
  
  // 19. FONASA plan (D por defecto según ejemplo)
  parts.push(liquidation.health_plan || 'D');
  
  // 20-25. Fijos: 0;0;0;0;0;0
  parts.push('0', '0', '0', '0', '0', '0');
  
  // 26. Fijo: N
  parts.push('N');
  
  // 27. Código AFP numérico (34 = MODELO según ejemplo)
  const afpCode = AFP_CODES[liquidation.afp_name?.toUpperCase()] || '34';
  parts.push(afpCode);
  
  // 28. Imponible (sin decimales)
  const imponible = Math.round(liquidation.total_taxable_income || 0);
  parts.push(imponible.toString());
  
  // 29. AFP total (sin decimales)
  const afpAmount = Math.round((liquidation.afp_amount || 0) + (liquidation.afp_commission_amount || 0));
  parts.push(afpAmount.toString());
  
  // 30. Salud (sin decimales)
  const saludAmount = Math.round(liquidation.health_amount || 0);
  parts.push(saludAmount.toString());
  
  // 31-32. Campos adicionales (según formato)
  parts.push('', '0');
  
  // 33-110. Completar estructura según ejemplo (total ~110 campos)
  // Basado en el ejemplo: muchos campos en 0, algunos con valores específicos
  const remainingFields = [
    '0','0','0','0','','','','','0','0','','','','','0','0','','','','','0','0','0','','','','','0','','','0','0','0','0','0','0',
    imponible.toString(),'0','0','0','0','0',(Math.round(liquidation.health_amount || 0) + 10000).toString(),'0','0','0','0','7','','0','1','0','0','0','0','1',
    imponible.toString(),'0','0','0','0','0',(Math.round(liquidation.income_tax_amount || 0)).toString(),'0','0','0','0','0','3',
    imponible.toString(),(Math.round(liquidation.health_amount || 0)).toString(),'0',imponible.toString(),
    (Math.round((liquidation.afp_amount || 0) + (liquidation.afp_commission_amount || 0))).toString(),
    (Math.round(liquidation.health_amount || 0) * 2).toString(),'0','','0'
  ];
  
  parts.push(...remainingFields);
  
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