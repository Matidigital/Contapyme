import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Actualizando gratificación legal Art. 50 para empleado específico...');

    const body = await request.json();
    const { employee_id, legal_gratification_type } = body;

    if (!employee_id) {
      return NextResponse.json({
        success: false,
        error: 'employee_id es requerido'
      });
    }

    console.log(`🔍 Actualizando empleado ${employee_id} con gratificación: ${legal_gratification_type}`);

    // Actualizar o crear configuración previsional con gratificación
    const { data, error } = await supabase
      .from('payroll_config')
      .update({
        legal_gratification_type: legal_gratification_type || 'article_50',
        updated_at: new Date().toISOString()
      })
      .eq('employee_id', employee_id)
      .select();

    if (error) {
      console.error('❌ Error actualizando gratificación:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      });
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No se encontró configuración payroll, creando nueva...');
      
      // Si no existe, crear nueva configuración
      const { data: newData, error: createError } = await supabase
        .from('payroll_config')
        .insert({
          employee_id: employee_id,
          afp_code: 'PLANVITAL',
          health_institution_code: 'FONASA',
          family_allowances: 0,
          legal_gratification_type: legal_gratification_type || 'article_50',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (createError) {
        console.error('❌ Error creando configuración:', createError);
        return NextResponse.json({
          success: false,
          error: createError.message
        });
      }

      console.log('✅ Nueva configuración creada:', newData);
      return NextResponse.json({
        success: true,
        message: 'Configuración de gratificación creada exitosamente',
        data: newData
      });
    }

    console.log('✅ Configuración actualizada exitosamente:', data);

    return NextResponse.json({
      success: true,
      message: 'Gratificación legal actualizada exitosamente',
      data: data
    });

  } catch (error) {
    console.error('❌ Error actualizando gratificación:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}