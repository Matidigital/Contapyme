import { NextRequest, NextResponse } from 'next/server';
import { parseF29Debug } from '@/lib/f29DebugParser';

export async function POST(request: NextRequest) {
  console.log('🔍 F29 DEBUG API: Iniciando depuración...');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log(`📄 Archivo recibido: ${file.name} (${file.size} bytes)`);
    
    const debugResult = await parseF29Debug(file);
    
    console.log('✅ Debug completado');
    
    return NextResponse.json({
      success: true,
      debug: debugResult,
      message: 'Debug completo - revisa la consola para detalles'
    });
    
  } catch (error) {
    console.error('❌ Error en debug API:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}