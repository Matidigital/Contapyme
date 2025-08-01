// ==========================================
// API PARA GENERAR DATOS DE DEMOSTRACIÓN
// Crea datos F29 de ejemplo para mostrar el análisis
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { generateDemoDataAdapter } from '@/lib/databaseAdapter';

export async function POST(request: NextRequest) {
  try {
    console.log('🎭 Generando datos de demostración F29...');

    const result = await generateDemoDataAdapter();

    return NextResponse.json({
      success: true,
      message: `🎉 Datos de demostración generados exitosamente`,
      summary: result,
      next_steps: [
        '📊 Ve a /accounting/f29-comparative para ver el análisis',
        '🎯 Los datos incluyen 12 meses de 2024 con tendencia creciente',
        '📈 Patrón estacional realista con diciembre alto',
        '💡 Confidence scores entre 85-100% para demostrar calidad'
      ]
    });

  } catch (error) {
    console.error('💥 Error generando datos demo:', error);
    return NextResponse.json(
      { 
        error: 'Error generando datos de demostración',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}