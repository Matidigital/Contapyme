import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/databaseSimple';

// Tipos TypeScript para el libro diario
interface JournalEntry {
  id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  reference?: string;
  entry_type: 'manual' | 'f29' | 'rcv' | 'fixed_asset' | 'automatic';
  source_type?: string;
  source_id?: string;
  source_period?: string;
  status: 'draft' | 'approved' | 'posted' | 'cancelled';
  total_debit: number;
  total_credit: number;
  lines?: JournalEntryLine[];
  created_at: string;
  updated_at: string;
}

interface JournalEntryLine {
  id?: string;
  account_code: string;
  account_name: string;
  line_number: number;
  debit_amount: number;
  credit_amount: number;
  line_description?: string;
  reference?: string;
  cost_center?: string;
  analytical_account?: string;
}

interface CreateJournalEntryRequest {
  entry_date: string;
  description: string;
  reference?: string;
  entry_type: string;
  source_type?: string;
  source_id?: string;
  source_period?: string;
  lines: JournalEntryLine[];
}

// GET - Obtener libro diario con filtros
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const company_id = searchParams.get('company_id') || 'demo-company';
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const entry_type = searchParams.get('entry_type');
    const status = searchParams.get('status');
    const include_lines = searchParams.get('include_lines') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    console.log('🔍 GET /api/accounting/journal - Params:', {
      company_id, date_from, date_to, entry_type, status, include_lines, page, limit
    });

    const supabase = getDatabaseConnection();

    // Construir query base
    let query = supabase
      .from('journal_entries')
      .select(`
        id,
        entry_number,
        entry_date,
        description,
        reference,
        entry_type,
        source_type,
        source_id,
        source_period,
        status,
        total_debit,
        total_credit,
        created_at,
        updated_at
        ${include_lines ? `, journal_entry_lines (
          id,
          account_code,
          account_name,
          line_number,
          debit_amount,
          credit_amount,
          line_description,
          reference,
          cost_center,
          analytical_account
        )` : ''}
      `)
      .eq('company_id', company_id);

    // Aplicar filtros
    if (date_from) {
      query = query.gte('entry_date', date_from);
    }
    if (date_to) {
      query = query.lte('entry_date', date_to);
    }
    if (entry_type) {
      query = query.eq('entry_type', entry_type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Ordenar y paginar
    query = query
      .order('entry_date', { ascending: false })
      .order('entry_number', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: entries, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo asientos:', error);
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo asientos del libro diario'
      }, { status: 500 });
    }

    // Obtener estadísticas generales (con fallback si falla la función)
    let stats = {
      total_entries: 0,
      total_debit: 0,
      total_credit: 0,
      entries_by_type: {},
      entries_by_status: {},
      monthly_trend: []
    };

    try {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_journal_statistics', {
          p_company_id: company_id
        });

      if (statsError) {
        console.warn('⚠️ Error obteniendo estadísticas avanzadas, usando básicas:', statsError);
        
        // Fallback: obtener estadísticas básicas directamente
        const { data: basicStats, error: basicError } = await supabase
          .from('journal_entries')
          .select(`
            id,
            total_debit,
            total_credit,
            entry_type,
            status
          `)
          .eq('company_id', company_id);

        if (!basicError && basicStats) {
          stats = {
            total_entries: basicStats.length,
            total_debit: basicStats.reduce((sum, entry) => sum + (entry.total_debit || 0), 0),
            total_credit: basicStats.reduce((sum, entry) => sum + (entry.total_credit || 0), 0),
            entries_by_type: basicStats.reduce((acc, entry) => {
              acc[entry.entry_type] = (acc[entry.entry_type] || 0) + 1;
              return acc;
            }, {}),
            entries_by_status: basicStats.reduce((acc, entry) => {
              acc[entry.status] = (acc[entry.status] || 0) + 1;
              return acc;
            }, {}),
            monthly_trend: []
          };
        }
      } else {
        stats = statsData?.[0] || stats;
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo estadísticas, usando valores por defecto:', error);
    }

    console.log('✅ Asientos obtenidos:', entries?.length || 0);
    console.log('📊 Estadísticas:', stats);

    return NextResponse.json({
      success: true,
      data: {
        entries: entries || [],
        pagination: {
          page,
          limit,
          total: stats.total_entries || 0,
          has_more: (offset + limit) < (stats.total_entries || 0)
        },
        statistics: stats
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/accounting/journal:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Crear nuevo asiento contable
export async function POST(request: NextRequest) {
  try {
    const body: CreateJournalEntryRequest = await request.json();
    const company_id = 'demo-company'; // TODO: obtener de sesión

    console.log('📝 POST /api/accounting/journal - Creating entry:', body.description);

    // Validar datos básicos
    if (!body.entry_date || !body.description || !body.lines || body.lines.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: entry_date, description, lines'
      }, { status: 400 });
    }

    // Validar balance (debe = haber)
    const total_debit = body.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
    const total_credit = body.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);

    if (Math.abs(total_debit - total_credit) > 0.01) { // Tolerancia de 1 centavo por redondeo
      return NextResponse.json({
        success: false,
        error: `Asiento desbalanceado: Debe ${total_debit} ≠ Haber ${total_credit}`
      }, { status: 400 });
    }

    // Validar que cada línea tenga solo debe O haber (no ambos)
    for (const line of body.lines) {
      const hasDebit = (line.debit_amount || 0) > 0;
      const hasCredit = (line.credit_amount || 0) > 0;
      
      if (hasDebit && hasCredit) {
        return NextResponse.json({
          success: false,
          error: `Línea ${line.line_number}: No puede tener debe y haber simultáneamente`
        }, { status: 400 });
      }
      
      if (!hasDebit && !hasCredit) {
        return NextResponse.json({
          success: false,
          error: `Línea ${line.line_number}: Debe tener monto en debe o haber`
        }, { status: 400 });
      }
    }

    const supabase = getDatabaseConnection();

    // Crear asiento principal
    const { data: entryData, error: entryError } = await supabase
      .from('journal_entries')
      .insert({
        company_id,
        entry_date: body.entry_date,
        description: body.description,
        reference: body.reference,
        entry_type: body.entry_type,
        source_type: body.source_type,
        source_id: body.source_id,
        source_period: body.source_period,
        status: 'draft',
        total_debit,
        total_credit,
        created_by: 'user', // TODO: obtener de sesión
      })
      .select()
      .single();

    if (entryError) {
      console.error('❌ Error creando asiento:', entryError);
      return NextResponse.json({
        success: false,
        error: 'Error creando asiento contable'
      }, { status: 500 });
    }

    // Crear líneas del asiento
    const linesData = body.lines.map(line => ({
      journal_entry_id: entryData.id,
      account_code: line.account_code,
      account_name: line.account_name,
      line_number: line.line_number,
      debit_amount: line.debit_amount || 0,
      credit_amount: line.credit_amount || 0,
      line_description: line.line_description,
      reference: line.reference,
      cost_center: line.cost_center,
      analytical_account: line.analytical_account,
    }));

    const { data: linesInserted, error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(linesData)
      .select();

    if (linesError) {
      console.error('❌ Error creando líneas:', linesError);
      
      // Rollback: eliminar asiento principal
      await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryData.id);

      return NextResponse.json({
        success: false,
        error: 'Error creando líneas del asiento'
      }, { status: 500 });
    }

    console.log('✅ Asiento creado exitosamente:', entryData.id);

    // Obtener asiento completo con líneas
    const { data: completeEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select(`
        *,
        journal_entry_lines (*)
      `)
      .eq('id', entryData.id)
      .single();

    return NextResponse.json({
      success: true,
      data: completeEntry,
      message: 'Asiento contable creado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en POST /api/accounting/journal:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// PUT - Actualizar asiento contable
export async function PUT(request: NextRequest) {
  try {  
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID del asiento es requerido'
      }, { status: 400 });
    }

    console.log('📝 PUT /api/accounting/journal - Updating entry:', id);

    const supabase = getDatabaseConnection();

    // Verificar que el asiento existe y no esté posteado
    const { data: existingEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json({
        success: false,
        error: 'Asiento no encontrado'
      }, { status: 404 });
    }

    if (existingEntry.status === 'posted') {
      return NextResponse.json({
        success: false,
        error: 'No se puede modificar un asiento ya contabilizado'
      }, { status: 400 });
    }

    // Actualizar asiento
    const { data: updatedEntry, error: updateError } = await supabase
      .from('journal_entries')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        updated_by: 'user' // TODO: obtener de sesión
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando asiento:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Error actualizando asiento'
      }, { status: 500 });
    }

    console.log('✅ Asiento actualizado:', id);

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'Asiento actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en PUT /api/accounting/journal:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// DELETE - Eliminar asiento contable  
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID del asiento es requerido'
      }, { status: 400 });
    }

    console.log('🗑️ DELETE /api/accounting/journal - Deleting entry:', id);

    const supabase = getDatabaseConnection();

    // Verificar que el asiento existe y no esté posteado
    const { data: existingEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json({
        success: false,
        error: 'Asiento no encontrado'
      }, { status: 404 });
    }

    if (existingEntry.status === 'posted') {
      return NextResponse.json({
        success: false,
        error: 'No se puede eliminar un asiento ya contabilizado'
      }, { status: 400 });
    }

    // Eliminar asiento (las líneas se eliminan automáticamente por CASCADE)
    const { error: deleteError } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error eliminando asiento:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Error eliminando asiento'
      }, { status: 500 });
    }

    console.log('✅ Asiento eliminado:', id);

    return NextResponse.json({
      success: true,
      message: 'Asiento eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en DELETE /api/accounting/journal:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}