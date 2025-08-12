import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Endpoint temporal para crear las tablas de libro de remuneraciones
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creando tablas de libro de remuneraciones...');

    // Crear tabla payroll_books directamente
    const { error: booksTableError } = await supabase
      .from('payroll_books')
      .select('id')
      .limit(1);

    // Si la tabla no existe, la consulta fallará
    if (booksTableError && booksTableError.message.includes('does not exist')) {
      // Crear tablas usando SQL directo 
      const createTablesSQL = `
        CREATE TABLE payroll_books (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL,
          period VARCHAR(7) NOT NULL,
          book_number INTEGER NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          company_rut VARCHAR(20) NOT NULL,
          generation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          generated_by UUID,
          status VARCHAR(20) DEFAULT 'draft',
          total_employees INTEGER NOT NULL DEFAULT 0,
          total_haberes DECIMAL(12,2) DEFAULT 0,
          total_descuentos DECIMAL(12,2) DEFAULT 0,
          total_liquido DECIMAL(12,2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(company_id, period)
        );

        CREATE TABLE payroll_book_details (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          payroll_book_id UUID NOT NULL REFERENCES payroll_books(id) ON DELETE CASCADE,
          employee_id UUID NOT NULL,
          employee_rut VARCHAR(20) NOT NULL,
          apellido_paterno VARCHAR(100),
          apellido_materno VARCHAR(100),
          nombres VARCHAR(100),
          cargo VARCHAR(100),
          area VARCHAR(100),
          centro_costo VARCHAR(100) DEFAULT 'GENERAL',
          dias_trabajados INTEGER DEFAULT 30,
          horas_semanales INTEGER DEFAULT 45,
          horas_no_trabajadas INTEGER DEFAULT 0,
          base_imp_prevision DECIMAL(12,2) DEFAULT 0,
          base_imp_cesantia DECIMAL(12,2) DEFAULT 0,
          sueldo_base DECIMAL(12,2) DEFAULT 0,
          total_haberes DECIMAL(12,2) DEFAULT 0,
          prevision_afp DECIMAL(12,2) DEFAULT 0,
          salud DECIMAL(12,2) DEFAULT 0,
          cesantia DECIMAL(12,2) DEFAULT 0,
          impuesto_unico DECIMAL(12,2) DEFAULT 0,
          total_descuentos DECIMAL(12,2) DEFAULT 0,
          sueldo_liquido DECIMAL(12,2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      return NextResponse.json({
        success: false,
        message: 'Las tablas no existen. Usa el SQL Editor de Supabase para ejecutar el siguiente SQL:',
        sql: createTablesSQL
      });
    }

    console.log('✅ Tablas de libro de remuneraciones ya existen');

    return NextResponse.json({
      success: true,
      message: 'Tablas de libro de remuneraciones verificadas'
    });

  } catch (error) {
    console.error('Error en setup de tablas:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error
    }, { status: 500 });
  }
}