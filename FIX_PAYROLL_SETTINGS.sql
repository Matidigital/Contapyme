-- ==========================================
-- FIX: PAYROLL SETTINGS PARA LIQUIDACIONES
-- Ejecutar en Supabase Dashboard > SQL Editor  
-- ==========================================

-- Crear configuración previsional para ContaPyme Demo Enterprise
INSERT INTO payroll_settings (
    company_id,
    settings,
    created_at,
    updated_at
) VALUES (
    '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID,
    '{
        "afp_configs": [
            {
                "code": "HABITAT",
                "commission_percentage": 1.27,
                "sis_percentage": 1.88
            },
            {
                "code": "PROVIDA", 
                "commission_percentage": 1.45,
                "sis_percentage": 1.88
            },
            {
                "code": "MODELO",
                "commission_percentage": 0.77,
                "sis_percentage": 1.88
            },
            {
                "code": "CAPITAL",
                "commission_percentage": 1.44,
                "sis_percentage": 1.88
            },
            {
                "code": "CUPRUM",
                "commission_percentage": 1.44,
                "sis_percentage": 1.88
            },
            {
                "code": "PLANVITAL",
                "commission_percentage": 1.16,
                "sis_percentage": 1.88
            },
            {
                "code": "UNO",
                "commission_percentage": 0.69,
                "sis_percentage": 1.88
            }
        ],
        "family_allowances": {
            "tramo_a": 15000,
            "tramo_b": 10000,
            "tramo_c": 5000
        },
        "income_limits": {
            "uf_limit": 84.6,
            "minimum_wage": 529000,
            "family_allowance_limit": 470148
        },
        "tax_settings": {
            "uf_value": 39179,
            "utm_value": 68923,
            "max_deduction_percentage": 45.0
        },
        "company_specific": {
            "default_afp": "HABITAT",
            "default_health": "FONASA",
            "auto_calculate_gratification": true,
            "include_family_allowance": true
        }
    }'::JSONB,
    NOW(),
    NOW()
) ON CONFLICT (company_id) DO UPDATE SET
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Verificar que se creó correctamente
SELECT 
    '✅ Configuración previsional creada' as status,
    company_id,
    (settings->>'company_specific')::TEXT as configuracion_empresa,
    (SELECT COUNT(*) FROM jsonb_array_elements(settings->'afp_configs')) as afp_configuradas
FROM payroll_settings 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

-- Mostrar AFP configuradas
SELECT 
    'AFP Configuradas:' as info,
    jsonb_array_elements(settings->'afp_configs')->>'code' as afp_code,
    (jsonb_array_elements(settings->'afp_configs')->>'commission_percentage')::DECIMAL as comision_porcentaje
FROM payroll_settings 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;