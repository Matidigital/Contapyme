-- MIGRACIÓN CRÍTICA: Configuración Previsional
-- Este script debe ejecutarse MANUALMENTE en la SQL Editor de Supabase
-- URL: https://supabase.com/dashboard/project/[PROJECT_ID]/sql

-- 1. VERIFICAR SI LAS TABLAS EXISTEN
SELECT 
    table_name,
    table_schema 
FROM information_schema.tables 
WHERE table_name IN ('payroll_settings', 'payroll_settings_log')
    AND table_schema = 'public';

-- 2. SI NO EXISTEN, EJECUTAR ESTA MIGRACIÓN:

-- Tabla de configuración previsional por empresa
CREATE TABLE IF NOT EXISTS payroll_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    settings JSONB NOT NULL DEFAULT '{}',
    last_previred_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id)
);

-- Tabla de log de cambios en configuración previsional
CREATE TABLE IF NOT EXISTS payroll_settings_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    company_id UUID NOT NULL REFERENCES companies(id),
    changed_fields TEXT[] NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_payroll_settings_company ON payroll_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_settings_log_company ON payroll_settings_log(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_settings_log_created ON payroll_settings_log(created_at DESC);

-- DESACTIVAR RLS temporalmente para pruebas (IMPORTANTE: REACTIVAR EN PRODUCCIÓN)
-- ALTER TABLE payroll_settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE payroll_settings_log DISABLE ROW LEVEL SECURITY;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_payroll_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payroll_settings_updated_at
    BEFORE UPDATE ON payroll_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_settings_updated_at();

-- 3. VERIFICAR QUE LAS TABLAS SE CREARON CORRECTAMENTE
SELECT 
    table_name,
    table_schema 
FROM information_schema.tables 
WHERE table_name IN ('payroll_settings', 'payroll_settings_log')
    AND table_schema = 'public';

-- 4. PROBAR LA INSERCIÓN DE DATOS DE PRUEBA
-- (Usar el UUID real de la empresa)
INSERT INTO payroll_settings (company_id, settings) 
VALUES (
    '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID,
    '{
        "afp_configs": [
            {"id": "afp-capital", "name": "AFP Capital", "code": "CAPITAL", "commission_percentage": 1.44, "sis_percentage": 1.15, "active": true}
        ],
        "health_configs": [
            {"id": "fonasa", "name": "FONASA", "code": "FONASA", "plan_percentage": 7.0, "active": true}
        ]
    }'::JSONB
)
ON CONFLICT (company_id) DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- 5. VERIFICAR QUE SE INSERTARON LOS DATOS
SELECT company_id, settings FROM payroll_settings WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

-- INSTRUCCIONES:
-- 1. Ejecutar este script en SQL Editor de Supabase
-- 2. Verificar que no hay errores
-- 3. Probar la URL: https://funny-elf-4be477.netlify.app/payroll/settings
-- 4. Si funciona, reactivar RLS (comentarios arriba)