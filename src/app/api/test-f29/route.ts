import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('🧪 TEST F29 API iniciado...');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided',
        debug: 'FormData no contiene archivo'
      }, { status: 400 });
    }
    
    console.log(`📄 Archivo recibido: ${file.name} (${file.size} bytes)`);
    
    // Test simple: devolver datos de prueba
    const testResult = {
      rut: '12.345.678-9',
      folio: 'TEST-123456',
      periodo: '202408',
      razonSocial: 'EMPRESA TEST SA',
      codigo511: 1000,
      codigo538: 2000,
      codigo563: 5000,
      codigo062: 300,
      codigo077: 100,
      codigo151: 50,
      comprasNetas: 10526,
      ivaDeterminado: 1000,
      totalAPagar: 1400,
      margenBruto: 4474,
      confidence: 85,
      method: 'test-api-working'
    };
    
    console.log('✅ Test API funcionando correctamente');
    
    return NextResponse.json({
      success: true,
      data: testResult,
      debug: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en test API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error en test API',
      details: error instanceof Error ? error.message : 'Unknown',
      debug: 'Error en procesamiento'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Test F29 API funcionando',
    timestamp: new Date().toISOString()
  });
}