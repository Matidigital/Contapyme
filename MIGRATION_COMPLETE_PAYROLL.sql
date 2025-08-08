-- ==========================================
-- MIGRACIÓN COMPLETA MÓDULO PAYROLL
-- Ejecutar en SQL Editor de Supabase
-- ==========================================

-- 1. VERIFICAR ESTADO ACTUAL
SELECT 'VERIFICANDO TABLAS EXISTENTES...' as step;

SELECT 
    table_name,
    table_schema 
FROM information_schema.tables 
WHERE table_name IN ('companies', 'payroll_settings', 'payroll_settings_log')
    AND table_schema = 'public';

-- 2. CREAR TABLA COMPANIES SI NO EXISTE
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    rut VARCHAR(12),
    business_type VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INSERTAR COMPANY DE PRUEBA SI NO EXISTE
INSERT INTO companies (id, name, rut, business_type) 
VALUES (
    '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID,
    'ContaPyme Demo',
    '12.345.678-9',
    'Servicios Contables'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- 4. CREAR TABLAS PAYROLL_SETTINGS
CREATE TABLE IF NOT EXISTS payroll_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    last_previred_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id)
);

CREATE TABLE IF NOT EXISTS payroll_settings_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    changed_fields TEXT[] NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_payroll_settings_company ON payroll_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_settings_log_company ON payroll_settings_log(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_settings_log_created ON payroll_settings_log(created_at DESC);

-- 6. CREAR FUNCIÓN PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_payroll_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. CREAR TRIGGER
DROP TRIGGER IF EXISTS update_payroll_settings_updated_at ON payroll_settings;
CREATE TRIGGER update_payroll_settings_updated_at
    BEFORE UPDATE ON payroll_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_settings_updated_at();

-- 8. DESACTIVAR RLS TEMPORALMENTE PARA PRUEBAS
ALTER TABLE payroll_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_settings_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- 9. INSERTAR CONFIGURACIÓN DEFAULT
INSERT INTO payroll_settings (company_id, settings) 
VALUES (
    '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID,
    '{
        "afp_configs": [
            {"id": "afp-capital", "name": "AFP Capital", "code": "CAPITAL", "commission_percentage": 1.44, "sis_percentage": 1.15, "active": true},
            {"id": "afp-cuprum", "name": "AFP Cuprum", "code": "CUPRUM", "commission_percentage": 1.48, "sis_percentage": 1.15, "active": true},
            {"id": "afp-habitat", "name": "AFP Hábitat", "code": "HABITAT", "commission_percentage": 1.27, "sis_percentage": 1.15, "active": true},
            {"id": "afp-planvital", "name": "AFP PlanVital", "code": "PLANVITAL", "commission_percentage": 1.16, "sis_percentage": 1.15, "active": true},
            {"id": "afp-provida", "name": "AFP ProVida", "code": "PROVIDA", "commission_percentage": 1.69, "sis_percentage": 1.15, "active": true},
            {"id": "afp-modelo", "name": "AFP Modelo", "code": "MODELO", "commission_percentage": 0.58, "sis_percentage": 1.15, "active": true},
            {"id": "afp-uno", "name": "AFP Uno", "code": "UNO", "commission_percentage": 0.69, "sis_percentage": 1.15, "active": true}
        ],
        "health_configs": [
            {"id": "fonasa", "name": "FONASA", "code": "FONASA", "plan_percentage": 7.0, "active": true},
            {"id": "banmedica", "name": "Banmédica", "code": "BANMEDICA", "plan_percentage": 8.5, "active": true},
            {"id": "consalud", "name": "Consalud", "code": "CONSALUD", "plan_percentage": 8.2, "active": true},
            {"id": "cruz-blanca", "name": "Cruz Blanca", "code": "CRUZ_BLANCA", "plan_percentage": 8.8, "active": true},
            {"id": "vida-tres", "name": "Vida Tres", "code": "VIDA_TRES", "plan_percentage": 8.3, "active": true},
            {"id": "colmena", "name": "Colmena Golden Cross", "code": "COLMENA", "plan_percentage": 8.6, "active": true}
        ],
        "income_limits": {
            "uf_limit": 83.4,
            "minimum_wage": 500000,
            "family_allowance_limit": 1000000
        },
        "family_allowances": {
            "tramo_a": 13596,
            "tramo_b": 8397,
            "tramo_c": 2798
        },
        "contributions": {
            "unemployment_insurance_fixed": 3.0,
            "unemployment_insurance_indefinite": 0.6,
            "social_security_percentage": 10.0
        },
        "company_info": {
            "mutual_code": "ACHS",
            "caja_compensacion_code": ""
        }
    }'::JSONB
)
ON CONFLICT (company_id) DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- 10. VERIFICACIÓN FINAL
SELECT 'VERIFICACIÓN FINAL...' as step;

-- Verificar que las tablas se crearon
SELECT 
    table_name,
    table_schema 
FROM information_schema.tables 
WHERE table_name IN ('companies', 'payroll_settings', 'payroll_settings_log')
    AND table_schema = 'public';

-- Verificar que los datos se insertaron
SELECT 
    company_id,
    jsonb_array_length(settings->'afp_configs') as afp_count,
    jsonb_array_length(settings->'health_configs') as health_count,
    created_at
FROM payroll_settings 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

-- Mostrar configuración AFP para verificar
SELECT 
    jsonb_pretty(settings->'afp_configs') as afp_configs
FROM payroll_settings 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

SELECT '🎉 MIGRACIÓN COMPLETA - LISTO PARA USAR' as result;