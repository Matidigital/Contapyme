import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/accounting/configuration/centralized
 * Obtiene las configuraciones centralizadas de cuentas por empresa
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'company_id es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔍 Loading centralized configs for company: ${companyId}`);

    const { data, error } = await supabase
      .from('centralized_account_config')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading centralized configs:', error);
      return NextResponse.json(
        { success: false, error: 'Error cargando configuraciones' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('❌ Error obteniendo configuraciones centralizadas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounting/configuration/centralized
 * Crea o actualiza una configuración centralizada
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_id,
      id,
      module_name,
      transaction_type,
      display_name,
      tax_account_code,
      tax_account_name,
      revenue_account_code,
      revenue_account_name,
      asset_account_code,
      asset_account_name,
      is_active = true
    } = body;

    if (!company_id || !module_name || !transaction_type || !display_name) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    console.log(`💾 ${id ? 'Updating' : 'Creating'} centralized config for company: ${company_id}`);

    const configData = {
      company_id,
      module_name,
      transaction_type,
      display_name,
      tax_account_code,
      tax_account_name,
      revenue_account_code,
      revenue_account_name,
      asset_account_code,
      asset_account_name,
      is_active,
      updated_at: new Date().toISOString()
    };

    let result;

    if (id) {
      // Actualizar configuración existente
      const { data, error } = await supabase
        .from('centralized_account_config')
        .update(configData)
        .eq('id', id)
        .eq('company_id', company_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Crear nueva configuración
      const { data, error } = await supabase
        .from('centralized_account_config')
        .insert({
          ...configData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Configuración ${id ? 'actualizada' : 'creada'} exitosamente`
    });

  } catch (error) {
    console.error('❌ Error guardando configuración centralizada:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}