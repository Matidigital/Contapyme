import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔧 ENDPOINT DE DIAGNÓSTICO - VARIABLES DE ENTORNO
 * Para verificar qué variables está viendo Netlify
 */
export async function GET(request: NextRequest) {
  try {
    const envVars = {
      // Variables Supabase
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NO_CONFIGURADA',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
        `CONFIGURADA (${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...)` : 
        'NO_CONFIGURADA',
      
      // Variables de aplicación
      NEXT_PUBLIC_COMPANY_ID: process.env.NEXT_PUBLIC_COMPANY_ID || 'NO_CONFIGURADA',
      NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'NO_CONFIGURADA',
      
      // Información del entorno
      NETLIFY: process.env.NETLIFY ? 'SÍ' : 'NO',
      NODE_ENV: process.env.NODE_ENV || 'NO_CONFIGURADA',
      VERCEL: process.env.VERCEL ? 'SÍ' : 'NO',
      
      // Timestamp
      timestamp: new Date().toISOString(),
      
      // Headers útiles para debugging
      userAgent: request.headers.get('user-agent'),
      host: request.headers.get('host')
    };

    console.log('🔍 DIAGNÓSTICO ENV VARS:', envVars);

    return NextResponse.json({
      success: true,
      environment: envVars,
      message: 'Variables de entorno obtenidas correctamente',
      recommendations: {
        supabase_url: envVars.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co') ? '✅ OK' : '❌ REVISAR',
        service_key: envVars.SUPABASE_SERVICE_ROLE_KEY.includes('CONFIGURADA') ? '✅ OK' : '❌ CONFIGURAR EN NETLIFY',
        company_id: envVars.NEXT_PUBLIC_COMPANY_ID.length > 10 ? '✅ OK' : '❌ REVISAR',
        platform: envVars.NETLIFY === 'SÍ' ? '✅ Netlify detectado' : '⚠️ No detectado como Netlify'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error en diagnóstico de variables',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * 🧪 TEST SUPABASE CONNECTION
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Variables de Supabase no configuradas',
        missing: {
          url: !supabaseUrl,
          serviceKey: !supabaseServiceKey
        }
      }, { status: 400 });
    }

    // Test básico: hacer un ping a Supabase
    const testUrl = `${supabaseUrl}/rest/v1/`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      supabaseTest: {
        url: supabaseUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      },
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error testing Supabase connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}