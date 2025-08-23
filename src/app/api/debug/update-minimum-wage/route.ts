import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

    console.log(`🔧 Actualizando sueldo mínimo a $529,000 en payroll_settings...`);

    // Obtener configuración actual
    const { data: currentSettings, error: selectError } = await supabase
      .from('payroll_settings')
      .select('settings')
      .eq('company_id', companyId)
      .single();

    if (selectError) {
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo configuración actual',
        details: selectError.message
      });
    }

    // Actualizar el minimum_wage en el objeto settings
    const updatedSettings = {
      ...currentSettings.settings,
      income_limits: {
        ...currentSettings.settings.income_limits,
        minimum_wage: 529000 // CORREGIDO: $529,000 oficial Previred
      }
    };

    // Actualizar en base de datos
    const { data, error } = await supabase
      .from('payroll_settings')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .select();

    if (error) {
      console.error('❌ Error actualizando configuración:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

    console.log('✅ Sueldo mínimo actualizado a $529,000');

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Sueldo mínimo actualizado a $529,000 - Tope gratificación ahora será $209,396'
    });

  } catch (error) {
    console.error('❌ Error en update-minimum-wage:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}