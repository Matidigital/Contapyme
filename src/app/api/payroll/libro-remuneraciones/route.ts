import { NextRequest, NextResponse } from 'next/server';

// Datos demo para libro de remuneraciones
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

    console.log('🔍 API libro remuneraciones DEMO - company:', companyId, 'period:', period, 'format:', format);

    // Filtrar libros por company_id y period si se especifica
    let books = demoPayrollBooks.filter(book => book.company_id === companyId);
    
    if (period) {
      books = books.filter(book => book.period === period);
    }

    // Si se solicita formato CSV
    if (format === 'csv' && books.length > 0) {
      const book = books[0];
      const csvContent = generateCSV(book);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="libro_remuneraciones_${book.period}.csv"`
        }
      });
    }

    console.log('✅ Libros demo obtenidos:', books.length);

    return NextResponse.json({
      success: true,
      data: books,
      count: books.length
    });
  } catch (error) {
    console.error('Error en GET /api/payroll/libro-remuneraciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Generar nuevo libro de remuneraciones (simulado)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔍 API POST libro remuneraciones DEMO - datos:', JSON.stringify(body, null, 2));
    
    if (!body.company_id || !body.period || !body.company_name || !body.company_rut) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: company_id, period, company_name, company_rut' },
        { status: 400 }
      );
    }
    
    // Verificar si ya existe un libro para este período
    const existingBook = demoPayrollBooks.find(book => 
      book.company_id === body.company_id && book.period === body.period
    );
    
    if (existingBook) {
      return NextResponse.json(
        { error: 'Ya existe un libro de remuneraciones para este período' },
        { status: 409 }
      );
    }
    
    // Simular generación de nuevo libro
    const newBook = {
      id: `550e8400-e29b-41d4-a716-${Date.now()}`,
      company_id: body.company_id,
      period: body.period,
      book_number: demoPayrollBooks.length + 1,
      company_name: body.company_name,
      company_rut: body.company_rut,
      generation_date: new Date().toISOString(),
      status: 'draft' as const,
      total_employees: 5,
      total_haberes: Math.floor(Math.random() * 1000000) + 4000000, // Entre 4M y 5M
      total_descuentos: Math.floor(Math.random() * 200000) + 800000, // Entre 800k y 1M
      total_liquido: 0, // Se calculará después
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
    };
    
    // Calcular líquido
    newBook.total_liquido = newBook.total_haberes - newBook.total_descuentos;
    
    // Agregar al array demo
    demoPayrollBooks.unshift(newBook);
    
    console.log('✅ Libro de remuneraciones DEMO generado:', newBook.id);
    
    return NextResponse.json({
      success: true,
      data: newBook,
      message: 'Libro de remuneraciones generado exitosamente (DEMO)'
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