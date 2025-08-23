import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id1 = 'ae683d69-33ee-470d-979d-ed71e5aabcb1';
    const id2 = '05514355-4ef0-4ed6-8444-6b6002a7bc15';

    console.log(`🔍 Buscando liquidaciones ${id1} y ${id2}...`);

    // Buscar ambas liquidaciones sin filtro de company
    const { data: liquidations, error } = await supabase
      .from('payroll_liquidations')
      .select(`
        *,
        employees (
          rut,
          first_name,
          last_name,
          company_id
        )
      `)
      .in('id', [id1, id2]);

    if (error) {
      console.error('❌ Error buscando liquidaciones:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

    console.log('✅ Liquidaciones encontradas:', liquidations?.length || 0);
    console.log('📊 Datos:', JSON.stringify(liquidations, null, 2));

    return NextResponse.json({
      success: true,
      data: liquidations || [],
      message: `Encontradas ${liquidations?.length || 0} liquidaciones`
    });

  } catch (error) {
    console.error('❌ Error en debug find-liquidations:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}