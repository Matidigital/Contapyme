// ==========================================
// BASE DE DATOS SQLITE - ALTERNATIVA SIMPLE
// No requiere PostgreSQL - funciona inmediatamente
// ==========================================

import { Database } from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db: any = null;

export async function getDatabase() {
  if (db) return db;

  try {
    // Usar SQLite en el directorio del proyecto
    const dbPath = path.join(process.cwd(), 'database', 'contapyme.sqlite');
    
    db = await open({
      filename: dbPath,
      driver: Database
    });

    console.log('✅ Base de datos SQLite conectada:', dbPath);
    
    // Inicializar tablas si no existen
    await initializeTables();
    
    return db;
  } catch (error) {
    console.error('❌ Error conectando a base de datos:', error);
    throw error;
  }
}

async function initializeTables() {
  if (!db) return;

  try {
    // Crear tablas F29
    await db.exec(`
      CREATE TABLE IF NOT EXISTS f29_forms (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        user_id TEXT DEFAULT 'demo-user',
        company_id TEXT DEFAULT 'demo-company',
        
        -- Metadatos del archivo
        period TEXT NOT NULL,
        upload_date TEXT DEFAULT (datetime('now')),
        file_name TEXT,
        file_size INTEGER,
        
        -- Información básica extraída
        rut TEXT,
        folio TEXT,
        year INTEGER,
        month INTEGER,
        
        -- Datos extraídos (JSON)
        raw_data TEXT DEFAULT '{}',
        calculated_data TEXT DEFAULT '{}',
        
        -- Métricas principales
        ventas_netas REAL DEFAULT 0,
        compras_netas REAL DEFAULT 0,
        iva_debito REAL DEFAULT 0,
        iva_credito REAL DEFAULT 0,
        iva_determinado REAL DEFAULT 0,
        ppm REAL DEFAULT 0,
        remanente REAL DEFAULT 0,
        total_a_pagar REAL DEFAULT 0,
        margen_bruto REAL DEFAULT 0,
        
        -- Códigos específicos F29
        codigo_538 REAL DEFAULT 0,
        codigo_511 REAL DEFAULT 0,
        codigo_563 REAL DEFAULT 0,
        codigo_062 REAL DEFAULT 0,
        codigo_077 REAL DEFAULT 0,
        
        -- Validación y confianza
        confidence_score INTEGER DEFAULT 0,
        validation_status TEXT DEFAULT 'pending',
        validation_errors TEXT DEFAULT '[]',
        
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        
        UNIQUE(company_id, period)
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS f29_comparative_analysis (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        company_id TEXT NOT NULL,
        
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        
        analysis_data TEXT DEFAULT '{}',
        
        total_periods INTEGER DEFAULT 0,
        avg_monthly_sales REAL DEFAULT 0,
        growth_rate REAL DEFAULT 0,
        best_month TEXT,
        worst_month TEXT,
        
        insights TEXT DEFAULT '[]',
        trends TEXT DEFAULT '{}',
        seasonality TEXT DEFAULT '{}',
        anomalies TEXT DEFAULT '[]',
        
        analysis_version TEXT DEFAULT '1.0',
        generated_at TEXT DEFAULT (datetime('now')),
        expires_at TEXT DEFAULT (datetime('now', '+7 days')),
        
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        
        UNIQUE(company_id, period_start, period_end)
      );
    `);

    // Crear índices
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_f29_company_period ON f29_forms(company_id, period);
      CREATE INDEX IF NOT EXISTS idx_f29_period ON f29_forms(period);
      CREATE INDEX IF NOT EXISTS idx_f29_upload_date ON f29_forms(upload_date DESC);
      CREATE INDEX IF NOT EXISTS idx_f29_analysis_company ON f29_comparative_analysis(company_id);
    `);

    console.log('✅ Tablas SQLite inicializadas correctamente');

  } catch (error) {
    console.error('❌ Error inicializando tablas:', error);
    throw error;
  }
}

// Funciones de utilidad para compatibilidad con Supabase
export async function insertF29Form(data: any) {
  const db = await getDatabase();
  
  try {
    const result = await db.run(`
      INSERT INTO f29_forms (
        company_id, user_id, period, file_name, file_size, rut, folio,
        raw_data, calculated_data, ventas_netas, compras_netas, iva_debito,
        iva_credito, iva_determinado, ppm, remanente, margen_bruto,
        codigo_538, codigo_511, codigo_563, codigo_062, codigo_077,
        confidence_score, validation_status, year, month
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.company_id, data.user_id, data.period, data.file_name, data.file_size,
      data.rut, data.folio, JSON.stringify(data.raw_data), JSON.stringify(data.calculated_data),
      data.ventas_netas, data.compras_netas, data.iva_debito, data.iva_credito,
      data.iva_determinado, data.ppm, data.remanente, data.margen_bruto,
      data.codigo_538, data.codigo_511, data.codigo_563, data.codigo_062, data.codigo_077,
      data.confidence_score, data.validation_status, data.year, data.month
    ]);

    return { data: [{ id: result.lastID }], error: null };
  } catch (error) {
    console.error('❌ Error insertando F29:', error);
    return { data: null, error };
  }
}

export async function getF29Forms(companyId: string, limit = 24) {
  const db = await getDatabase();
  
  try {
    const forms = await db.all(`
      SELECT * FROM f29_forms 
      WHERE company_id = ? 
      ORDER BY period ASC 
      LIMIT ?
    `, [companyId, limit]);

    // Parsear JSON fields
    const formsWithParsedData = forms.map(form => ({
      ...form,
      raw_data: JSON.parse(form.raw_data || '{}'),
      calculated_data: JSON.parse(form.calculated_data || '{}'),
      validation_errors: JSON.parse(form.validation_errors || '[]')
    }));

    return { data: formsWithParsedData, error: null };
  } catch (error) {
    console.error('❌ Error obteniendo F29s:', error);
    return { data: null, error };
  }
}

export async function upsertAnalysis(data: any) {
  const db = await getDatabase();
  
  try {
    await db.run(`
      INSERT OR REPLACE INTO f29_comparative_analysis (
        company_id, period_start, period_end, analysis_data, total_periods,
        avg_monthly_sales, growth_rate, best_month, worst_month, insights,
        trends, seasonality, anomalies, generated_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.company_id, data.period_start, data.period_end, JSON.stringify(data.analysis_data),
      data.total_periods, data.avg_monthly_sales, data.growth_rate, data.best_month,
      data.worst_month, JSON.stringify(data.insights), JSON.stringify(data.trends),
      JSON.stringify(data.seasonality), JSON.stringify(data.anomalies),
      data.generated_at, data.expires_at
    ]);

    return { error: null };
  } catch (error) {
    console.error('❌ Error guardando análisis:', error);
    return { error };
  }
}