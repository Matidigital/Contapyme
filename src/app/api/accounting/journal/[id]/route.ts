import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/accounting/journal/[id]
 * Obtiene un asiento contable con todas sus líneas de detalle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entryId = params.id;
    
    if (!entryId) {
      return NextResponse.json(
        { success: false, error: 'ID del asiento es requerido' },
        { status: 400 }
      );
    }

    console.log(`📖 Fetching journal entry details for ID: ${entryId}`);

    // Obtener el asiento principal
    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (entryError || !entry) {
      console.error('❌ Error fetching journal entry:', entryError);
      return NextResponse.json(
        { success: false, error: 'Asiento no encontrado' },
        { status: 404 }
      );
    }

    // Obtener las líneas del asiento
    const { data: lines, error: linesError } = await supabase
      .from('journal_entry_lines')
      .select('*')
      .eq('journal_entry_id', entryId)
      .order('line_number', { ascending: true });

    if (linesError) {
      console.error('❌ Error fetching journal lines:', linesError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener líneas del asiento' },
        { status: 500 }
      );
    }

    // Calcular totales
    const totals = (lines || []).reduce(
      (acc, line) => ({
        debit: acc.debit + (line.debit_amount || 0),
        credit: acc.credit + (line.credit_amount || 0)
      }),
      { debit: 0, credit: 0 }
    );

    // Formatear la respuesta
    const response = {
      ...entry,
      lines: lines || [],
      totals,
      line_count: lines?.length || 0
    };

    console.log(`✅ Found ${lines?.length || 0} lines for entry ${entryId}`);

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Error in journal entry detail API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/accounting/journal/[id]
 * Actualiza un asiento contable y sus líneas
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entryId = params.id;
    const body = await request.json();
    
    if (!entryId) {
      return NextResponse.json(
        { success: false, error: 'ID del asiento es requerido' },
        { status: 400 }
      );
    }

    console.log(`📝 Updating journal entry: ${entryId}`);

    // Verificar que el asiento existe
    const { data: existingEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (fetchError || !existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Asiento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que no esté contabilizado (posted)
    if (existingEntry.status === 'posted') {
      return NextResponse.json(
        { success: false, error: 'No se puede modificar un asiento ya contabilizado' },
        { status: 400 }
      );
    }

    // Validar líneas
    if (!body.lines || body.lines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El asiento debe tener al menos una línea' },
        { status: 400 }
      );
    }

    // Validar balance
    const totalDebit = body.lines.reduce((sum: number, line: any) => sum + (line.debit_amount || 0), 0);
    const totalCredit = body.lines.reduce((sum: number, line: any) => sum + (line.credit_amount || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { success: false, error: `Asiento desbalanceado: Debe ${totalDebit} ≠ Haber ${totalCredit}` },
        { status: 400 }
      );
    }

    // Eliminar líneas existentes
    const { error: deleteError } = await supabase
      .from('journal_entry_lines')
      .delete()
      .eq('journal_entry_id', entryId);

    if (deleteError) {
      console.error('❌ Error deleting existing lines:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Error eliminando líneas existentes' },
        { status: 500 }
      );
    }

    // Crear nuevas líneas
    const newLines = body.lines.map((line: any, index: number) => ({
      journal_entry_id: entryId,
      account_code: line.account_code,
      account_name: line.account_name,
      line_number: line.line_number || index + 1,
      debit_amount: line.debit_amount || 0,
      credit_amount: line.credit_amount || 0,
      line_description: line.line_description || '',
      reference: line.reference || '',
      cost_center: line.cost_center || '',
      analytical_account: line.analytical_account || ''
    }));

    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(newLines);

    if (linesError) {
      console.error('❌ Error inserting new lines:', linesError);
      return NextResponse.json(
        { success: false, error: 'Error creando nuevas líneas' },
        { status: 500 }
      );
    }

    // Actualizar asiento principal
    const { data: updatedEntry, error: updateError } = await supabase
      .from('journal_entries')
      .update({
        description: body.description || existingEntry.description,
        total_debit: totalDebit,
        total_credit: totalCredit,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating entry:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error actualizando asiento' },
        { status: 500 }
      );
    }

    console.log(`✅ Journal entry updated successfully: ${entryId}`);

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'Asiento actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error in PUT journal entry:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}