import { NextRequest, NextResponse } from 'next/server';
import { parseF29RealStructure } from '@/lib/f29RealStructureParser';
import { parseF29Diagnostic } from '@/lib/f29DiagnosticParser';
import { parseF29Innovative } from '@/lib/f29InnovativeParser';
import { parseF29Simple } from '@/lib/f29SimpleParser';
import { parseF29Debug } from '@/lib/f29DebugParser';

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
    
    // MODO DEBUG TEMPORAL: Ver exactamente qué está pasando
    console.log('🔍 EJECUTANDO DEBUG TEMPORAL...');
    const debugResult = await parseF29Debug(file);
    
    // También ejecutar el parser real para comparar
    console.log('🎯 Ejecutando parser real para comparar...');
    const realResult = await parseF29RealStructure(file);
    
    return NextResponse.json({
      success: true,
      debug: debugResult,
      realParser: realResult,
      message: 'Ejecutando en modo debug - revisa los logs'
    });
    
    // Si el parser real no funciona bien, probar con el innovador
    console.log('🔄 Parser real insuficiente, probando innovador...');
    const innovativeResult = await parseF29Innovative(file);
    
    if (innovativeResult.confidence >= 50) {
      console.log(`✅ Parser innovador exitoso: confidence ${innovativeResult.confidence}`);
      return NextResponse.json({
        success: true,
        data: innovativeResult,
        method: 'innovative',
        confidence: innovativeResult.confidence,
        debugInfo: innovativeResult.extractionDetails
      });
    }
    
    // Si ambos fallan, usar diagnóstico para análisis
    console.log('🔍 Parsers principales fallaron, ejecutando diagnóstico...');
    const diagnosticResult = await parseF29Diagnostic(file);
    
    console.log(`📊 Resultado diagnóstico: confidence ${diagnosticResult.confidence}`);
    
    return NextResponse.json({
      success: true,
      data: diagnosticResult,
      method: 'diagnostic',
      confidence: diagnosticResult.confidence,
      debugInfo: diagnosticResult.debugInfo,
      warning: 'Resultado de diagnóstico - calidad de extracción limitada'
    });
    
  } catch (error) {
    console.error('❌ Error parsing F29:', error);
    return NextResponse.json({ 
      error: 'Failed to parse F29',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}