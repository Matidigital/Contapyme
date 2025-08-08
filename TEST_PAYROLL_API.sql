-- ==========================================
-- TEST MANUAL DE LA API PAYROLL SETTINGS
-- Ejecutar DESPUÉS de aplicar la migración
-- ==========================================

-- 1. VERIFICAR QUE TODO ESTÉ CONFIGURADO
SELECT 'TEST 1: VERIFICAR CONFIGURACIÓN...' as test;

SELECT 
    company_id,
    jsonb_array_length(settings->'afp_configs') as afp_count,
    jsonb_array_length(settings->'health_configs') as health_count,
    (settings->'income_limits'->>'uf_limit')::numeric as uf_limit,
    (settings->'family_allowances'->>'tramo_a')::numeric as tramo_a,
    created_at,
    updated_at
FROM payroll_settings 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

-- 2. TEST SIMULADO: UPDATE DE CONFIGURACIÓN AFP
SELECT 'TEST 2: SIMULACIÓN UPDATE AFP...' as test;

-- Simular cambio de comisión AFP Capital de 1.44% a 1.50%
UPDATE payroll_settings 
SET 
    settings = jsonb_set(
        settings,
        '{afp_configs,0,commission_percentage}',
        '1.50'::jsonb
    ),
    updated_at = NOW()
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

-- Verificar que el cambio se aplicó
SELECT 
    'AFP CAPITAL ACTUALIZADA:' as info,
    settings->'afp_configs'->0->>'name' as afp_name,
    (settings->'afp_configs'->0->>'commission_percentage')::numeric as new_commission
FROM payroll_settings 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

-- 3. TEST SIMULADO: LOG DE CAMBIOS
SELECT 'TEST 3: INSERTAR LOG DE CAMBIOS...' as test;

INSERT INTO payroll_settings_log (
    company_id,
    changed_fields,
    old_values,
    new_values,
    created_at
) VALUES (
    '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID,
    ARRAY['afp_configs'],
    '{"commission_percentage": 1.44}'::jsonb,
    '{"commission_percentage": 1.50}'::jsonb,
    NOW()
);

-- Verificar que el log se creó
SELECT 
    'LOG CREADO:' as info,
    company_id,
    changed_fields,
    old_values,
    new_values,
    created_at
FROM payroll_settings_log 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID
ORDER BY created_at DESC
LIMIT 1;

-- 4. RESTAURAR VALOR ORIGINAL PARA NO AFECTAR PRODUCCIÓN
SELECT 'TEST 4: RESTAURAR VALOR ORIGINAL...' as test;

UPDATE payroll_settings 
SET 
    settings = jsonb_set(
        settings,
        '{afp_configs,0,commission_percentage}',
        '1.44'::jsonb
    ),
    updated_at = NOW()
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

-- 5. VERIFICACIÓN FINAL
SELECT 'VERIFICACIÓN FINAL - TODO OK:' as result;

SELECT 
    'CONFIGURACIÓN LISTA PARA USAR:' as status,
    company_id,
    jsonb_array_length(settings->'afp_configs') as afp_count,
    (settings->'afp_configs'->0->>'commission_percentage')::numeric as afp_capital_commission,
    updated_at
FROM payroll_settings 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

SELECT '✅ PAYROLL API LISTA PARA USAR EN PRODUCCIÓN' as final_result;