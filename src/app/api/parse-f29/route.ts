import { NextRequest, NextResponse } from 'next/server';
import { parseF29RealStructure } from '@/lib/f29RealStructureParser';
import { parseF29Diagnostic } from '@/lib/f29DiagnosticParser';
import { parseF29Innovative } from '@/lib/f29InnovativeParser';
import { parseF29Simple } from '@/lib/f29SimpleParser';

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
    
    // ESTRATEGIA NUEVA: Parser especializado para estructura real del F29
    console.log('🎯 Intentando con parser de estructura real...');
    const realResult = await parseF29RealStructure(file);
    
    if (realResult.confidence >= 70) {
      console.log(`✅ Parser real exitoso: confidence ${realResult.confidence}`);
      return NextResponse.json({
        success: true,
        data: realResult,
        method: 'real-structure',
        confidence: realResult.confidence,
        debugInfo: realResult.debugInfo
      });
    }
    
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