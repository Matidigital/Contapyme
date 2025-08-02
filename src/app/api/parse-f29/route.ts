import { NextRequest, NextResponse } from 'next/server';
import { parseF29DirectExtraction } from '@/lib/f29DirectExtractionParser';
import { parseF29WithAI } from '@/lib/f29AIParser';
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
    
    // ESTRATEGIA DIRECTA: Parser optimizado basado en valores conocidos
    console.log('🎯 Ejecutando parser de extracción directa...');
    const directResult = await parseF29DirectExtraction(file);
    
    if (directResult.confidence >= 70) {
      console.log(`✅ Parser directo exitoso: confidence ${directResult.confidence}`);
      return NextResponse.json({
        success: true,
        data: directResult,
        method: 'direct-extraction',
        confidence: directResult.confidence
      });
    }
    
    // Si falla, intentar con IA
    console.log('🤖 Parser directo insuficiente, probando con IA...');
    const aiResult = await parseF29WithAI(file);
    
    if (aiResult.confidence >= 80) {
      console.log(`✅ Parser IA exitoso: confidence ${aiResult.confidence} (${aiResult.aiProvider})`);
      return NextResponse.json({
        success: true,
        data: aiResult,
        method: 'ai-extraction',
        confidence: aiResult.confidence,
        aiProvider: aiResult.aiProvider
      });
    }
    
    // Si IA no está disponible o falla, intentar con parser real
    console.log('🔄 IA insuficiente, probando real structure...');
    const realResult = await parseF29RealStructure(file);
    
    if (realResult.confidence >= 50) {
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