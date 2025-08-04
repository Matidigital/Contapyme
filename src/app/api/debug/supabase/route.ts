import { NextResponse } from 'next/server';
import { databaseSimple } from '@/lib/databaseSimple';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Debug información básica
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabase_url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      service_key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabase_url_preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
    };

    // Test conexión básica
    const { data: connectionTest, error: connectionError } = await databaseSimple.query(
      'SELECT current_timestamp as server_time, version() as pg_version'
    );

    // Test si tabla existe
    const { data: tableExists, error: tableError } = await databaseSimple.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'fixed_assets'
      ) as table_exists;
    `);

    // Test conteo de registros si tabla existe
    let recordCount = null;
    let recordError = null;
    if (tableExists?.[0]?.table_exists) {
      const { data: countData, error: countErr } = await databaseSimple.query(
        'SELECT COUNT(*) as total FROM fixed_assets'
      );
      recordCount = countData?.[0]?.total;
      recordError = countErr;
    }

    return NextResponse.json({
      debug_info: debugInfo,
      connection_test: {
        success: !connectionError,
        data: connectionTest,
        error: connectionError?.message
      },
      table_check: {
        exists: tableExists?.[0]?.table_exists || false,
        error: tableError?.message
      },
      record_count: {
        total: recordCount,
        error: recordError?.message
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}