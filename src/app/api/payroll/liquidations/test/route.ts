import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'API de liquidaciones funcionando correctamente',
      timestamp: new Date().toISOString(),
      env_check: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error en API test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'POST endpoint funcionando',
      received_data: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error en POST test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}