import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos demo para libro de remuneraciones (fallback)
const demoPayrollBooks = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
    period: '2025-08',
    book_number: 1,
    company_name: 'Empresa Demo ContaPyme',
    company_rut: '12.345.678-9',
    generation_date: new Date('2025-08-05T10:30:00Z').toISOString(),
    status: 'draft' as const,
    total_employees: 5,
    total_haberes: 4500000,
    total_descuentos: 900000,
    total_liquido: 3600000,
    payroll_book_details: [
      {
        employee_rut: '12.345.678-9',
        apellido_paterno: 'González',
        apellido_materno: 'Silva',
        nombres: 'Juan Carlos',
        cargo: 'Desarrollador Senior',
        area: 'Tecnología'
      },
      {
        employee_rut: '87.654.321-0',
        apellido_paterno: 'Martínez',
        apellido_materno: 'López',
        nombres: 'María Elena',
        cargo: 'Contadora',
        area: 'Administración'
      },
      {
        employee_rut: '11.222.333-4',
        apellido_paterno: 'Rodriguez',
        apellido_materno: 'Pérez',
        nombres: 'Carlos Alberto',
        cargo: 'Gerente Comercial',
        area: 'Ventas'
      }
    ]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
    period: '2025-07',
    book_number: 2,
    company_name: 'Empresa Demo ContaPyme',
    company_rut: '12.345.678-9',
    generation_date: new Date('2025-07-05T10:30:00Z').toISOString(),
    status: 'approved' as const,
    total_employees: 5,
    total_haberes: 4200000,
    total_descuentos: 840000,
    total_liquido: 3360000,
    payroll_book_details: [
      {
        employee_rut: '12.345.678-9',
        apellido_paterno: 'González',
        apellido_materno: 'Silva',
        nombres: 'Juan Carlos',
        cargo: 'Desarrollador Senior',
        area: 'Tecnología'
      },
      {
        employee_rut: '87.654.321-0',
        apellido_paterno: 'Martínez',
        apellido_materno: 'López',
        nombres: 'María Elena',
        cargo: 'Contadora',
        area: 'Administración'
      }
    ]
  }
];

// GET - Obtener libros de remuneraciones
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');
    const period = searchParams.get('period');
    const format = searchParams.get('format') || 'json';
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    console.log('🔍 API libro remuneraciones - company:', companyId, 'period:', period, 'format:', format);

    // ✅ USAR DATOS REALES DE SUPABASE
    let query = supabase
      .from('payroll_books')
      .select(`
        id,
        period,
        book_number,
        company_name,
        company_rut,
        generation_date,
        status,
        total_employees,
        total_haberes,
        total_descuentos,
        total_liquido,
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
      .order('generation_date', { ascending: false });

    if (period) {
      query = query.eq('period', period);
    }

    const { data: books, error: booksError } = await query;

    // Si no hay libros reales, usar datos demo como fallback
    if (booksError || !books || books.length === 0) {
      console.log('📋 Usando datos demo como fallback');
      let demoBooks = demoPayrollBooks.filter(book => book.company_id === companyId);
      
      if (period) {
        demoBooks = demoBooks.filter(book => book.period === period);
      }

      // Si se solicita formato CSV con datos demo
      if (format === 'csv' && demoBooks.length > 0) {
        const book = demoBooks[0];
        const csvContent = generateCSV(book);
        
        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="libro_remuneraciones_${book.period}.csv"`
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: demoBooks,
        count: demoBooks.length,
        source: 'demo'
      });
    }

    // Si se solicita formato CSV con datos reales
    if (format === 'csv' && books.length > 0) {
      const book = books[0];
      const csvContent = await generateRealCSV(book, companyId);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="libro_remuneraciones_${book.period}.csv"`
        }
      });
    }

    console.log('✅ Libros reales obtenidos:', books.length);

    return NextResponse.json({
      success: true,
      data: books,
      count: books.length,
      source: 'database'
    });
  } catch (error) {
    console.error('Error en GET /api/payroll/libro-remuneraciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Generar nuevo libro de remuneraciones CON DATOS REALES
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔍 API POST libro remuneraciones - datos:', JSON.stringify(body, null, 2));
    
    if (!body.company_id || !body.period || !body.company_name || !body.company_rut) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: company_id, period, company_name, company_rut' },
        { status: 400 }
      );
    }

    const { company_id, period, company_name, company_rut } = body;
    const [year, month] = period.split('-');
    
    // ✅ Verificar si ya existe un libro para este período y eliminarlo si existe
    const { data: existingBooks, error: existingError } = await supabase
      .from('payroll_books')
      .select('id')
      .eq('company_id', company_id)
      .eq('period', period);
    
    if (!existingError && existingBooks && existingBooks.length > 0) {
      const existingBook = existingBooks[0];
      console.log('📋 Libro existente encontrado, eliminando para reemplazar:', existingBook.id);
      
      // Eliminar detalles del libro existente primero
      const { error: deleteDetailsError } = await supabase
        .from('payroll_book_details')
        .delete()
        .eq('payroll_book_id', existingBook.id);
      
      if (deleteDetailsError) {
        console.error('Error eliminando detalles del libro:', deleteDetailsError);
      }
      
      // Eliminar el libro existente
      const { error: deleteBookError } = await supabase
        .from('payroll_books')
        .delete()
        .eq('id', existingBook.id);
        
      if (deleteBookError) {
        console.error('Error eliminando libro:', deleteBookError);
      } else {
        console.log('✅ Libro existente eliminado, procediendo a crear nuevo');
      }
    }

    // ✅ OBTENER LIQUIDACIONES REALES DEL PERÍODO (consulta simplificada)
    console.log('🔍 Buscando liquidaciones para:', { company_id, year: parseInt(year), month: parseInt(month) });
    
    const { data: liquidations, error: liquidationsError } = await supabase
      .from('payroll_liquidations')
      .select(`
        id,
        employee_id,
        period_year,
        period_month,
        days_worked,
        base_salary,
        total_gross_income,
        total_deductions,
        net_salary,
        afp_amount,
        health_amount,
        unemployment_amount,
        income_tax_amount,
        family_allowance,
        food_allowance,
        transport_allowance,
        employees (
          id,
          rut,
          first_name,
          last_name,
          middle_name
        )
      `)
      .eq('company_id', company_id)
      .eq('period_year', parseInt(year))
      .eq('period_month', parseInt(month));

    if (liquidationsError) {
      console.error('Error obteniendo liquidaciones:', liquidationsError);
      return NextResponse.json(
        { error: 'Error al obtener liquidaciones del período' },
        { status: 500 }
      );
    }

    if (!liquidations || liquidations.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron liquidaciones para este período. Debe generar liquidaciones primero.' },
        { status: 404 }
      );
    }

    // ✅ Obtener siguiente número de libro
    const { data: lastBook } = await supabase
      .from('payroll_books')
      .select('book_number')
      .eq('company_id', company_id)
      .order('book_number', { ascending: false })
      .limit(1);

    const bookNumber = (lastBook && lastBook[0]?.book_number || 0) + 1;

    // ✅ Calcular totales reales
    const totalEmployees = liquidations.length;
    const totalHaberes = liquidations.reduce((sum, liq) => sum + (liq.total_gross_income || 0), 0);
    const totalDescuentos = liquidations.reduce((sum, liq) => sum + (liq.total_deductions || 0), 0);
    const totalLiquido = liquidations.reduce((sum, liq) => sum + (liq.net_salary || 0), 0);

    // ✅ Crear libro en la base de datos
    const { data: newBook, error: bookError } = await supabase
      .from('payroll_books')
      .insert({
        company_id,
        period,
        book_number: bookNumber,
        company_name,
        company_rut,
        generated_by: company_id, // TODO: usar user ID real
        status: 'draft',
        total_employees: totalEmployees,
        total_haberes: totalHaberes,
        total_descuentos: totalDescuentos,
        total_liquido: totalLiquido
      })
      .select()
      .single();

    if (bookError) {
      console.error('Error creando libro:', bookError);
      return NextResponse.json(
        { error: 'Error al crear libro de remuneraciones' },
        { status: 500 }
      );
    }

    // ✅ Crear detalles por empleado con datos REALES
    const bookDetails = liquidations.map(liquidation => {
      const employee = liquidation.employees;
      
      return {
        payroll_book_id: newBook.id,
        employee_id: liquidation.employee_id,
        employee_rut: employee?.rut || 'N/A',
        // ✅ MAPEO CORREGIDO PARA NORMATIVA CHILENA
        apellido_paterno: employee?.last_name || '',                                    // Apellido paterno
        apellido_materno: '',                                                          // TODO: Agregar campo apellido_materno a tabla employees
        nombres: `${employee?.first_name || ''} ${employee?.middle_name || ''}`.trim(), // Primer nombre + segundo nombre
        cargo: 'Empleado', // Valor por defecto ya que no tenemos contratos
        area: 'General', // Valor por defecto ya que no tenemos contratos  
        centro_costo: 'GENERAL',
        dias_trabajados: liquidation.days_worked || 30,
        horas_semanales: 45, // Valor por defecto
        horas_no_trabajadas: 0,
        base_imp_prevision: liquidation.total_gross_income || 0,
        base_imp_cesantia: liquidation.total_gross_income || 0,
        sueldo_base: liquidation.base_salary || 0,
        colacion: liquidation.food_allowance || 0,
        movilizacion: liquidation.transport_allowance || 0,
        asignacion_familiar: liquidation.family_allowance || 0,
        total_haberes: liquidation.total_gross_income || 0,
        prevision_afp: liquidation.afp_amount || 0,
        salud: liquidation.health_amount || 0,
        cesantia: liquidation.unemployment_amount || 0, // ✅ INCLUYE CESANTÍA 0.6%
        impuesto_unico: liquidation.income_tax_amount || 0,
        total_descuentos: liquidation.total_deductions || 0,
        sueldo_liquido: liquidation.net_salary || 0
      };
    });

    const { error: detailsError } = await supabase
      .from('payroll_book_details')
      .insert(bookDetails);

    if (detailsError) {
      console.error('Error creando detalles:', detailsError);
      return NextResponse.json(
        { error: 'Error al crear detalles del libro' },
        { status: 500 }
      );
    }

    console.log(`✅ Libro de remuneraciones REAL generado: ${newBook.id} con ${totalEmployees} empleados`);
    
    const wasReplaced = !existingError && existingBooks && existingBooks.length > 0;
    const message = wasReplaced 
      ? `Libro de remuneraciones reemplazado exitosamente con ${totalEmployees} empleados`
      : `Libro de remuneraciones generado exitosamente con ${totalEmployees} empleados`;
    
    return NextResponse.json({
      success: true,
      data: {
        ...newBook,
        payroll_book_details: bookDetails.slice(0, 3).map(detail => ({
          employee_rut: detail.employee_rut,
          apellido_paterno: detail.apellido_paterno,
          apellido_materno: detail.apellido_materno,
          nombres: detail.nombres,
          cargo: detail.cargo,
          area: detail.area
        }))
      },
      message,
      replaced: wasReplaced
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error en POST /api/payroll/libro-remuneraciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función auxiliar para generar CSV
function generateCSV(book: any): string {
  const headers = [
    'RUT', 'AP PATERNO', 'AP MATERNO', 'NOMBRES', 'CARGO', 'AREA', 'CENTRO COSTO',
    'DÍAS TRABAJADOS', 'HORAS SEMANALES', 'HORAS NO TRABAJADAS',
    'BASE IMP. PREVISIÓN', 'BASE IMP. CESANTÍA', 'SUELDO BASE',
    'APORTE ASISTENCIA', 'HORAS EXTRAS', 'ASIGNACIÓN FAMILIAR',
    'ASIGNACION DE ANTIGUEDAD', 'ASIGNACION DE PERDIDA DE CAJA',
    'ASIGNACION DE TRAMO', 'ASIGNACIÓN DE ZONA',
    'ASIGNACION RESPONSABILIDAD DIRECTIVA', 'BONO COMPENSATORIO',
    'BONO DE ASESORIA CENTRO DE ALUMNO', 'BONO DE RESPONSABILIDAD',
    'BONO LEUMAG', 'BONO NOCTURNO', 'BONO POR CARGO', 'BONO POR DESEMPEÑO',
    'B.R.P', 'B.R.P MENCION', 'COLACIÓN', 'GRATIFICACION MENSUAL',
    'LEY 19464', 'MOVILIZACIÓN', 'OTROS HABERES IMPONIBLES Y TRIBUTABLES',
    'PLANILLA SUPLEMENTARIA', 'TOTAL HABERES',
    'PREVIS', 'APV', 'SALUD', 'SALUD VOLUNTARIA', 'CESANTÍA', 'IMPUESTO',
    'CUENTA_2', 'SOBREGIRO DESC.', 'ACCIONES COOPEUCH', 'AGRUPACION ALUEN',
    'AHORRO COOPEUCH', 'APORTE JORNADAS', 'COMITE SOLIDARIDAD',
    'CREDITO COOPEUCH', 'CUENTA 2 PESOS', 'CUOTA SINDICAL',
    'DESCUENTO OPTICA', 'FALP', 'MUTUAL DE SEGUROS', 'PRÉSTAMO DE EMPRESA',
    'PROTEGER', 'RETENCION 3% PRESTAMO SOLIDARIO', 'SEGURO COMPLEMENTARIO',
    'CRÉDITO PERSONAL CAJA LOS ANDES', 'LEASING (AHORRO) CAJA LOS ANDES',
    'SEGURO DE VIDA CAJA LOS ANDES', 'TOTAL DESCUENTOS', 'SUELDO LÍQUIDO', 'SOBREGIRO'
  ];

  // Encabezados del libro
  const bookHeaders = [
    `Libro: Remuneraciones${';'.repeat(headers.length - 1)}`,
    `Empresa: ${book.company_name} (${book.company_rut})${';'.repeat(headers.length - 1)}`,
    `Periodo: ${formatPeriod(book.period)}${';'.repeat(headers.length - 1)}`,
    `Fecha Generación: ${formatDate(book.generation_date)}${';'.repeat(headers.length - 1)}`,
    ';'.repeat(headers.length - 1),
    headers.join(';')
  ];

  // Datos de empleados (demo con valores simulados)
  const employeeRows = book.payroll_book_details.map((detail: any, index: number) => {
    const baseAmount = (book.total_haberes / book.total_employees);
    const deductionAmount = (book.total_descuentos / book.total_employees);
    
    return [
      detail.employee_rut,
      detail.apellido_paterno,
      detail.apellido_materno || '',
      detail.nombres,
      detail.cargo || '',
      detail.area || '',
      'GENERAL', // centro_costo
      '30', // dias_trabajados
      '45', // horas_semanales
      '0', // horas_no_trabajadas
      baseAmount.toFixed(0), // base_imp_prevision
      baseAmount.toFixed(0), // base_imp_cesantia
      (baseAmount * 0.8).toFixed(0), // sueldo_base
      '0', // aporte_asistencia
      (baseAmount * 0.1).toFixed(0), // horas_extras
      '15000', // asignacion_familiar
      '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', // bonos
      '20000', // colacion
      (baseAmount * 0.1).toFixed(0), // gratificacion_mensual
      '0', '15000', '0', '0', // otros haberes
      baseAmount.toFixed(0), // total_haberes
      (deductionAmount * 0.4).toFixed(0), // prevision_afp
      '0', // apv
      (deductionAmount * 0.3).toFixed(0), // salud
      '0', '0', // salud_voluntaria, cesantia
      (deductionAmount * 0.3).toFixed(0), // impuesto_unico
      '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', // otros descuentos
      deductionAmount.toFixed(0), // total_descuentos
      (baseAmount - deductionAmount).toFixed(0), // sueldo_liquido
      '0' // sobregiro
    ].join(';');
  });

  return [
    ...bookHeaders,
    ...employeeRows
  ].join('\n');
}

// Funciones auxiliares para formato
function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} a las ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

// ✅ Función para generar CSV con DATOS REALES de Supabase
async function generateRealCSV(book: any, companyId: string): Promise<string> {
  // Obtener detalles completos del libro
  const { data: bookDetails, error } = await supabase
    .from('payroll_book_details')
    .select('*')
    .eq('payroll_book_id', book.id)
    .order('apellido_paterno', { ascending: true });

  if (error || !bookDetails || bookDetails.length === 0) {
    // Fallback a datos demo si hay error
    return generateCSV(book);
  }

  const headers = [
    'RUT', 'AP PATERNO', 'AP MATERNO', 'NOMBRES', 'CARGO', 'AREA', 'CENTRO COSTO',
    'DÍAS TRABAJADOS', 'HORAS SEMANALES', 'HORAS NO TRABAJADAS',
    'BASE IMP. PREVISIÓN', 'BASE IMP. CESANTÍA', 'SUELDO BASE',
    'APORTE ASISTENCIA', 'HORAS EXTRAS', 'ASIGNACIÓN FAMILIAR',
    'ASIGNACION DE ANTIGUEDAD', 'ASIGNACION DE PERDIDA DE CAJA',
    'ASIGNACION DE TRAMO', 'ASIGNACIÓN DE ZONA',
    'ASIGNACION RESPONSABILIDAD DIRECTIVA', 'BONO COMPENSATORIO',
    'BONO DE ASESORIA CENTRO DE ALUMNO', 'BONO DE RESPONSABILIDAD',
    'BONO LEUMAG', 'BONO NOCTURNO', 'BONO POR CARGO', 'BONO POR DESEMPEÑO',
    'B.R.P', 'B.R.P MENCION', 'COLACIÓN', 'GRATIFICACION MENSUAL',
    'LEY 19464', 'MOVILIZACIÓN', 'OTROS HABERES IMPONIBLES Y TRIBUTABLES',
    'PLANILLA SUPLEMENTARIA', 'TOTAL HABERES',
    'PREVIS', 'APV', 'SALUD', 'SALUD VOLUNTARIA', 'CESANTÍA', 'IMPUESTO',
    'CUENTA_2', 'SOBREGIRO DESC.', 'ACCIONES COOPEUCH', 'AGRUPACION ALUEN',
    'AHORRO COOPEUCH', 'APORTE JORNADAS', 'COMITE SOLIDARIDAD',
    'CREDITO COOPEUCH', 'CUENTA 2 PESOS', 'CUOTA SINDICAL',
    'DESCUENTO OPTICA', 'FALP', 'MUTUAL DE SEGUROS', 'PRÉSTAMO DE EMPRESA',
    'PROTEGER', 'RETENCION 3% PRESTAMO SOLIDARIO', 'SEGURO COMPLEMENTARIO',
    'CRÉDITO PERSONAL CAJA LOS ANDES', 'LEASING (AHORRO) CAJA LOS ANDES',
    'SEGURO DE VIDA CAJA LOS ANDES', 'TOTAL DESCUENTOS', 'SUELDO LÍQUIDO', 'SOBREGIRO'
  ];

  // Encabezados del libro
  const bookHeaders = [
    `Libro: Remuneraciones${';'.repeat(headers.length - 1)}`,
    `Empresa: ${book.company_name} (${book.company_rut})${';'.repeat(headers.length - 1)}`,
    `Periodo: ${formatPeriod(book.period)}${';'.repeat(headers.length - 1)}`,
    `Fecha Generación: ${formatDate(book.generation_date)}${';'.repeat(headers.length - 1)}`,
    `Total Empleados: ${book.total_employees}${';'.repeat(headers.length - 1)}`,
    `Total Haberes: $${book.total_haberes?.toLocaleString('es-CL')}${';'.repeat(headers.length - 1)}`,
    `Total Descuentos: $${book.total_descuentos?.toLocaleString('es-CL')}${';'.repeat(headers.length - 1)}`,
    `Total Líquido: $${book.total_liquido?.toLocaleString('es-CL')}${';'.repeat(headers.length - 1)}`,
    ';'.repeat(headers.length - 1),
    headers.join(';')
  ];

  // ✅ Datos REALES de empleados desde la base de datos
  const employeeRows = bookDetails.map((detail: any) => {
    return [
      detail.employee_rut || '',
      detail.apellido_paterno || '',
      detail.apellido_materno || '',
      detail.nombres || '',
      detail.cargo || '',
      detail.area || '',
      detail.centro_costo || 'GENERAL',
      detail.dias_trabajados || 30,
      detail.horas_semanales || 45,
      detail.horas_no_trabajadas || 0,
      (detail.base_imp_prevision || 0).toFixed(0),
      (detail.base_imp_cesantia || 0).toFixed(0),
      (detail.sueldo_base || 0).toFixed(0),
      (detail.aporte_asistencia || 0).toFixed(0),
      (detail.horas_extras || 0).toFixed(0),
      (detail.asignacion_familiar || 0).toFixed(0),
      (detail.asignacion_antiguedad || 0).toFixed(0),
      (detail.asignacion_perdida_caja || 0).toFixed(0),
      (detail.asignacion_tramo || 0).toFixed(0),
      (detail.asignacion_zona || 0).toFixed(0),
      (detail.asignacion_responsabilidad_directiva || 0).toFixed(0),
      (detail.bono_compensatorio || 0).toFixed(0),
      (detail.bono_asesoria_centro_alumno || 0).toFixed(0),
      (detail.bono_responsabilidad || 0).toFixed(0),
      (detail.bono_leumag || 0).toFixed(0),
      (detail.bono_nocturno || 0).toFixed(0),
      (detail.bono_cargo || 0).toFixed(0),
      (detail.bono_desempeno || 0).toFixed(0),
      (detail.brp || 0).toFixed(0),
      (detail.brp_mencion || 0).toFixed(0),
      (detail.colacion || 0).toFixed(0),
      (detail.gratificacion_mensual || 0).toFixed(0),
      (detail.ley_19464 || 0).toFixed(0),
      (detail.movilizacion || 0).toFixed(0),
      (detail.otros_haberes_imponibles || 0).toFixed(0),
      (detail.planilla_suplementaria || 0).toFixed(0),
      (detail.total_haberes || 0).toFixed(0),
      (detail.prevision_afp || 0).toFixed(0),
      (detail.apv || 0).toFixed(0),
      (detail.salud || 0).toFixed(0),
      (detail.salud_voluntaria || 0).toFixed(0),
      (detail.cesantia || 0).toFixed(0), // ✅ CESANTÍA REAL 0.6%
      (detail.impuesto_unico || 0).toFixed(0),
      (detail.cuenta_2 || 0).toFixed(0),
      (detail.sobregiro_desc || 0).toFixed(0),
      (detail.acciones_coopeuch || 0).toFixed(0),
      (detail.agrupacion_aluen || 0).toFixed(0),
      (detail.ahorro_coopeuch || 0).toFixed(0),
      (detail.aporte_jornadas || 0).toFixed(0),
      (detail.comite_solidaridad || 0).toFixed(0),
      (detail.credito_coopeuch || 0).toFixed(0),
      (detail.cuenta_2_pesos || 0).toFixed(0),
      (detail.cuota_sindical || 0).toFixed(0),
      (detail.descuento_optica || 0).toFixed(0),
      (detail.falp || 0).toFixed(0),
      (detail.mutual_seguros || 0).toFixed(0),
      (detail.prestamo_empresa || 0).toFixed(0),
      (detail.proteger || 0).toFixed(0),
      (detail.retencion_3_prestamo_solidario || 0).toFixed(0),
      (detail.seguro_complementario || 0).toFixed(0),
      (detail.credito_personal_caja_andes || 0).toFixed(0),
      (detail.leasing_ahorro_caja_andes || 0).toFixed(0),
      (detail.seguro_vida_caja_andes || 0).toFixed(0),
      (detail.total_descuentos || 0).toFixed(0),
      (detail.sueldo_liquido || 0).toFixed(0),
      (detail.sobregiro || 0).toFixed(0)
    ].join(';');
  });

  return [
    ...bookHeaders,
    ...employeeRows
  ].join('\n');
}