import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

    console.log(`🔍 Verificando configuración payroll_settings para company ${companyId}...`);

    // Buscar configuración en BD
    const { data: settings, error } = await supabase
      .from('payroll_settings')
      .select('*')
      .eq('company_id', companyId);

    if (error) {
      console.error('❌ Error buscando settings:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

    console.log('✅ Settings encontrados:', JSON.stringify(settings, null, 2));

    return NextResponse.json({
      success: true,
      data: settings || [],
      message: `Encontrados ${settings?.length || 0} registros de configuración`
    });

  } catch (error) {
    console.error('❌ Error en debug check-settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}