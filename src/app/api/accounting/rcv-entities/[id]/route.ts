import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Obtener entidad RCV específica por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: 'company_id es requerido'
      }, { status: 400 });
    }

    const { data: entity, error } = await supabase
      .from('rcv_entities')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Entidad no encontrada'
        }, { status: 404 });
      }
      
      console.error('Error fetching RCV entity:', error);
      return NextResponse.json({
        success: false,
        error: 'Error al obtener entidad'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: entity
    });

  } catch (error) {
    console.error('Error in GET /api/accounting/rcv-entities/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// DELETE - Eliminar entidad RCV
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: 'company_id es requerido'
      }, { status: 400 });
    }

    // Verificar que la entidad existe y pertenece a la empresa
    const { data: existingEntity, error: fetchError } = await supabase
      .from('rcv_entities')
      .select('id, entity_name')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Entidad no encontrada'
        }, { status: 404 });
      }
      
      console.error('Error fetching entity for deletion:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Error al verificar entidad'
      }, { status: 500 });
    }

    // TODO: Verificar si la entidad está siendo utilizada en registros RCV existentes
    // antes de permitir la eliminación física

    const { error: deleteError } = await supabase
      .from('rcv_entities')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (deleteError) {
      console.error('Error deleting RCV entity:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar entidad'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Entidad ${existingEntity.entity_name} eliminada exitosamente`
    });

  } catch (error) {
    console.error('Error in DELETE /api/accounting/rcv-entities/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// PATCH - Actualización parcial (por ejemplo, activar/desactivar)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: 'company_id es requerido'
      }, { status: 400 });
    }

    // Preparar datos para actualización parcial
    const updateData: any = {};
    
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.default_tax_rate !== undefined) updateData.default_tax_rate = body.default_tax_rate;
    if (body.is_tax_exempt !== undefined) updateData.is_tax_exempt = body.is_tax_exempt;

    const { data: updatedEntity, error } = await supabase
      .from('rcv_entities')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating RCV entity:', error);
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar entidad'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedEntity,
      message: 'Entidad actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error in PATCH /api/accounting/rcv-entities/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}