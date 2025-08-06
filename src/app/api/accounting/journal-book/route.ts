import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Obtener libro diario consolidado
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // YYYY-MM
    const start_date = searchParams.get('start_date'); // YYYY-MM-DD
    const end_date = searchParams.get('end_date'); // YYYY-MM-DD
    const reference_type = searchParams.get('reference_type'); // COMPRA, VENTA, REMUNERACION, ACTIVO_FIJO
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔍 API Journal Book - GET:', { 
      period, start_date, end_date, reference_type, limit, offset 
    });

    // Query base para el libro diario
    let query = supabase
      .from('journal_book')
      .select(`
        jbid,
        date,
        debit,
        credit,
        description,
        document_number,
        reference_type,
        reference_id,
        status,
        created_at
      `)
      .eq('status', 'active')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtro por período (YYYY-MM)
    if (period) {
      const [year, month] = period.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;
      
      query = query
        .gte('date', startDate)
        .lte('date', endDate);
    }

    // Filtro por rango específico de fechas
    if (start_date && end_date) {
      query = query
        .gte('date', start_date)
        .lte('date', end_date);
    }

    // Filtro por tipo de referencia
    if (reference_type) {
      query = query.eq('reference_type', reference_type);
    }

    const { data: entries, error, count } = await query;

    if (error) {
      console.error('Error fetching journal entries:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener asientos del libro diario' },
        { status: 500 }
      );
    }

    // Obtener estadísticas del período
    let statsQuery = supabase
      .from('journal_book')
      .select('debit, credit, reference_type, date')
      .eq('status', 'active');

    if (period) {
      const [year, month] = period.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;
      
      statsQuery = statsQuery
        .gte('date', startDate)
        .lte('date', endDate);
    }

    if (start_date && end_date) {
      statsQuery = statsQuery
        .gte('date', start_date)
        .lte('date', end_date);
    }

    const { data: statsData, error: statsError } = await statsQuery;

    if (statsError) {
      console.warn('Error fetching stats:', statsError);
    }

    // Calcular estadísticas
    const stats = statsData?.reduce(
      (acc, entry) => {
        acc.total_debit += entry.debit || 0;
        acc.total_credit += entry.credit || 0;
        acc.total_entries += 1;

        // Conteo por tipo de referencia
        const type = entry.reference_type || 'MANUAL';
        if (!acc.by_type[type]) {
          acc.by_type[type] = { count: 0, debit: 0, credit: 0 };
        }
        acc.by_type[type].count += 1;
        acc.by_type[type].debit += entry.debit || 0;
        acc.by_type[type].credit += entry.credit || 0;

        return acc;
      },
      { 
        total_debit: 0, 
        total_credit: 0, 
        total_entries: 0,
        by_type: {} as Record<string, { count: number; debit: number; credit: number }>
      }
    ) || { 
      total_debit: 0, 
      total_credit: 0, 
      total_entries: 0,
      by_type: {}
    };

    console.log(`✅ Libro diario: ${entries?.length || 0} asientos`);

    return NextResponse.json({
      success: true,
      data: {
        entries: entries || [],
        stats,
        pagination: {
          limit,
          offset,
          total: count || 0,
          has_more: (count || 0) > offset + limit
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/accounting/journal-book:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear asiento manual en el libro diario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 API Journal Book - POST:', body);

    const {
      date,
      debit,
      credit,
      description,
      document_number = null,
      reference_type = 'MANUAL',
      reference_id = null
    } = body;

    // Validaciones
    if (!date || !description) {
      return NextResponse.json(
        { success: false, error: 'date y description son requeridos' },
        { status: 400 }
      );
    }

    if (!debit || !credit || debit !== credit) {
      return NextResponse.json(
        { success: false, error: 'debit y credit deben ser iguales y mayores a 0' },
        { status: 400 }
      );
    }

    if (debit <= 0 || credit <= 0) {
      return NextResponse.json(
        { success: false, error: 'debit y credit deben ser mayores a 0' },
        { status: 400 }
      );
    }

    // Generar ID único
    const timestamp = Date.now();
    const jbid = `JB${timestamp}`;

    // Crear asiento en journal_book
    const { data: journalEntry, error } = await supabase
      .from('journal_book')
      .insert({
        jbid,
        date,
        debit,
        credit,
        description,
        document_number,
        reference_type,
        reference_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating journal entry:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear asiento en libro diario' },
        { status: 500 }
      );
    }

    console.log(`✅ Asiento creado en libro diario: ${jbid} por $${debit.toLocaleString('es-CL')}`);

    return NextResponse.json({
      success: true,
      data: journalEntry,
      message: `Asiento manual ${jbid} creado exitosamente`
    });

  } catch (error) {
    console.error('Error in POST /api/accounting/journal-book:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar asiento existente (solo manuales)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 API Journal Book - PUT:', body);

    const { jbid, date, debit, credit, description, document_number } = body;

    if (!jbid) {
      return NextResponse.json(
        { success: false, error: 'jbid es requerido' },
        { status: 400 }
      );
    }

    // Solo permitir editar asientos manuales
    const { data: existingEntry, error: fetchError } = await supabase
      .from('journal_book')
      .select('reference_type, status')
      .eq('jbid', jbid)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'Asiento no encontrado' },
        { status: 404 }
      );
    }

    if (existingEntry.reference_type !== 'MANUAL') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden editar asientos manuales' },
        { status: 400 }
      );
    }

    if (existingEntry.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'No se puede editar un asiento inactivo' },
        { status: 400 }
      );
    }

    // Validar balance si se actualizan los montos
    if ((debit && credit) && debit !== credit) {
      return NextResponse.json(
        { success: false, error: 'debit y credit deben ser iguales' },
        { status: 400 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    if (date) updateData.date = date;
    if (debit && credit) {
      updateData.debit = debit;
      updateData.credit = credit;
    }
    if (description) updateData.description = description;
    if (document_number !== undefined) updateData.document_number = document_number;

    const { data: updatedEntry, error } = await supabase
      .from('journal_book')
      .update(updateData)
      .eq('jbid', jbid)
      .select()
      .single();

    if (error) {
      console.error('Error updating journal entry:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar asiento' },
        { status: 500 }
      );
    }

    console.log(`✅ Asiento actualizado: ${jbid}`);

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'Asiento actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error in PUT /api/accounting/journal-book:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Marcar asiento como revertido (solo manuales)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jbid = searchParams.get('jbid');

    if (!jbid) {
      return NextResponse.json(
        { success: false, error: 'jbid es requerido' },
        { status: 400 }
      );
    }

    console.log('🔍 API Journal Book - DELETE:', jbid);

    // Solo permitir eliminar asientos manuales
    const { data: existingEntry, error: fetchError } = await supabase
      .from('journal_book')
      .select('reference_type, status')
      .eq('jbid', jbid)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'Asiento no encontrado' },
        { status: 404 }
      );
    }

    if (existingEntry.reference_type !== 'MANUAL') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden eliminar asientos manuales' },
        { status: 400 }
      );
    }

    // Marcar como revertido en lugar de eliminar (auditoría)
    const { data: revertedEntry, error } = await supabase
      .from('journal_book')
      .update({ status: 'reversed' })
      .eq('jbid', jbid)
      .select()
      .single();

    if (error) {
      console.error('Error reversing journal entry:', error);
      return NextResponse.json(
        { success: false, error: 'Error al revertir asiento' },
        { status: 500 }
      );
    }

    console.log(`✅ Asiento revertido: ${jbid}`);

    return NextResponse.json({
      success: true,
      data: revertedEntry,
      message: 'Asiento revertido exitosamente'
    });

  } catch (error) {
    console.error('Error in DELETE /api/accounting/journal-book:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}