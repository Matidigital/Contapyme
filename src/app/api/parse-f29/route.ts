import { NextRequest, NextResponse } from 'next/server';
import { parseF29 } from '@/lib/f29Parser';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('🚀 F29 API: Implementación desde cero iniciada...');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'Only PDF files supported' 
      }, { status: 400 });
    }
    
    console.log(`📄 Archivo: ${file.name} (${Math.round(file.size/1024)}KB)`);
    
    // UNA SOLA FUNCIÓN - SIN COMPLICACIONES
    const result = await parseF29(file);
    
    console.log(`✅ Completado: ${result.confidence}% confidence (${result.method})`);
    
    return NextResponse.json({
      success: true,
      data: result,
      method: result.method,
      confidence: result.confidence
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    
    // En lugar de devolver datos falsos, devolver error claro
    return NextResponse.json({
      success: false,
      error: 'No se pudieron extraer datos del PDF. Verifica que el archivo sea un F29 válido.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}