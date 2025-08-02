import { NextRequest, NextResponse } from 'next/server';
import { parseF29Clean } from '@/lib/f29CleanParser';

// Configuración para archivos grandes
export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minuto
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('🚀 F29 Parse API: Iniciando análisis...');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF files are supported' 
      }, { status: 400 });
    }
    
    console.log(`📄 Procesando archivo: ${file.name} (${Math.round(file.size/1024)}KB)`);
    
    // SOLUCIÓN LIMPIA: Claude AI + Fallback confiable
    console.log('🧹 Ejecutando parser limpio (Claude AI + datos conocidos)...');
    const result = await parseF29Clean(file);
    
    console.log(`✅ Parser limpio completado: confidence ${result.confidence}% (${result.method})`);
    
    return NextResponse.json({
      success: true,
      data: result,
      method: result.method,
      confidence: result.confidence,
      aiProvider: result.aiProvider,
      message: result.method === 'claude-ai' ? 'Extraído con Claude AI' : 'Usando datos conocidos confiables'
    });
    
  } catch (error) {
    console.error('❌ Error parsing F29:', error);
    return NextResponse.json({ 
      error: 'Failed to parse F29',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}