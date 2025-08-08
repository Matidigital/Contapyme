-- ==========================================
-- VERIFICAR QUE LA COMPANY EXISTE CON EL ID CORRECTO
-- Ejecutar en SQL Editor de Supabase
-- ==========================================

-- 1. VERIFICAR COMPANY ACTUAL
SELECT 'COMPANIES EXISTENTES:' as info;
SELECT id, name, rut, created_at FROM companies ORDER BY created_at DESC;

-- 2. VERIFICAR PAYROLL_SETTINGS ASOCIADOS
SELECT 'PAYROLL_SETTINGS ASOCIADOS:' as info;
SELECT 
    ps.company_id,
    c.name as company_name,
    jsonb_array_length(ps.settings->'afp_configs') as afp_count,
    ps.created_at
FROM payroll_settings ps
JOIN companies c ON ps.company_id = c.id
ORDER BY ps.created_at DESC;

-- 3. TEST DE LA API CON EL ID CORRECTO
SELECT 'TEST API - CONFIGURACIÓN AFP:' as info;
SELECT 
    company_id,
    jsonb_pretty(settings->'afp_configs'->0) as afp_capital_config
FROM payroll_settings 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

-- 4. SI LA COMPANY NO TIENE EL ID CORRECTO, ACTUALIZAR
-- (Solo ejecutar si es necesario)

/*
UPDATE companies 
SET id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID
WHERE name = 'ContaPyme Demo';

UPDATE payroll_settings 
SET company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID
WHERE company_id IN (
    SELECT id FROM companies WHERE name = 'ContaPyme Demo'
);
*/

SELECT '✅ VERIFICACIÓN COMPLETA' as resultado;