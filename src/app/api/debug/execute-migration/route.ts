import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Ejecutando migración de campos AFP...');

    // Ejecutar cada ALTER TABLE por separado para evitar problemas
    const migrations = [
      "ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS afp_name VARCHAR(50) DEFAULT 'MODELO'",
      "ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS health_institution VARCHAR(50) DEFAULT 'FONASA'",
      "ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS isapre_plan VARCHAR(100)",
      "ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS afp_auto_detected BOOLEAN DEFAULT false",
      "ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS previred_source VARCHAR(20) DEFAULT 'manual'"
    ];

    const results = [];

    for (const migration of migrations) {
      try {
        console.log(`🔧 Ejecutando: ${migration}`);
        
        // Usar una consulta raw
        const { data, error } = await supabase.rpc('exec_sql', { sql: migration });
        
        if (error) {
          console.error(`❌ Error en migración: ${migration}`, error);
          results.push({ sql: migration, success: false, error: error.message });
        } else {
          console.log(`✅ Migración exitosa: ${migration}`);
          results.push({ sql: migration, success: true, data });
        }
      } catch (err) {
        console.error(`❌ Excepción en migración: ${migration}`, err);
        results.push({ sql: migration, success: false, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migraciones ejecutadas',
      results: results
    });

  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}