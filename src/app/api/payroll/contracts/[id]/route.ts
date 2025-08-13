import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Obtener un contrato específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    
    if (!contractId) {
      return NextResponse.json({ error: 'ID del contrato es requerido' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener contrato con todos los detalles usando joins
    const { data, error } = await supabase
      .from('employment_contracts')
      .select(`
        *,
        employees!inner(
          rut,
          first_name,
          middle_name,
          last_name,
          birth_date,
          nationality,
          marital_status,
          address,
          city,
          email,
          phone,
          bank_name,
          bank_account_type,
          bank_account_number
        ),
        companies!inner(
          name,
          rut,
          legal_representative_name,
          legal_representative_rut,
          fiscal_address,
          fiscal_city
        )
      `)
      .eq('id', contractId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
      }
      console.error('Error fetching contract:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data 
    });

  } catch (error) {
    console.error('Error in GET /api/payroll/contracts/[id]:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH: Actualizar parcialmente un contrato
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    const body = await request.json();

    if (!contractId) {
      return NextResponse.json({ error: 'ID del contrato es requerido' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Actualizar el contrato
    const { data, error } = await supabase
      .from('employment_contracts')
      .update(body)
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
      }
      console.error('Error updating contract:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Contrato actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error in PATCH /api/payroll/contracts/[id]:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE: Eliminar un contrato
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;

    if (!contractId) {
      return NextResponse.json({ error: 'ID del contrato es requerido' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Soft delete: cambiar estado a 'terminated'
    const { data, error } = await supabase
      .from('employment_contracts')
      .update({ 
        status: 'terminated',
        termination_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
      }
      console.error('Error deleting contract:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Contrato terminado exitosamente'
    });

  } catch (error) {
    console.error('Error in DELETE /api/payroll/contracts/[id]:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}