import { NextRequest, NextResponse } from 'next/server';
import { parseRCV } from '@/lib/rcvParser';

export async function POST(request: NextRequest) {
  console.log('🚀 API RCV: Iniciando procesamiento...');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('❌ No se recibió archivo');
      return NextResponse.json({
        success: false,
        error: 'No se recibió ningún archivo'
      }, { status: 400 });
    }
    
    // Validar que sea un archivo CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      console.error('❌ Archivo no es CSV:', file.name);
      return NextResponse.json({
        success: false,
        error: 'El archivo debe ser un CSV (.csv)'
      }, { status: 400 });
    }
    
    // Validar tamaño del archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ Archivo muy grande:', file.size);
      return NextResponse.json({
        success: false,
        error: 'El archivo es muy grande. Máximo 10MB.'
      }, { status: 400 });
    }
    
    console.log(`📄 Procesando archivo RCV: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    // Procesar archivo RCV
    const result = await parseRCV(file);
    
    console.log('✅ Archivo RCV procesado exitosamente');
    console.log(`📊 Transacciones: ${result.totalTransacciones}, Proveedores: ${result.proveedoresPrincipales.length}`);
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `RCV procesado: ${result.totalTransacciones} transacciones de ${result.proveedoresPrincipales.length} proveedores`
    });
    
  } catch (error) {
    console.error('❌ Error procesando RCV:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error procesando archivo RCV'
    }, { status: 500 });
  }
}