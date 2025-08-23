import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Verificar si las columnas existen intentando hacer un select
    const { data, error } = await supabase
      .from('employment_contracts')
      .select('id, afp_name, health_institution, isapre_plan, afp_auto_detected, previred_source')
      .limit(1);

    if (error) {
      console.error('Error checking columns:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      });
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: `Found ${data?.length || 0} AFP columns in employment_contracts table`
    });

  } catch (error) {
    console.error('Error in check-columns:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}