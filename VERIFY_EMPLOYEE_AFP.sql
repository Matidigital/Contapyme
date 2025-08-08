-- ==========================================
-- VERIFICAR AFP CONFIGURADAS POR EMPLEADO
-- Ejecutar en SQL Editor de Supabase
-- ==========================================

-- 1. VER AFP CONFIGURADAS POR EMPLEADO
SELECT 'EMPLEADOS Y SUS AFP CONFIGURADAS:' as info;
SELECT 
    e.first_name,
    e.last_name,
    e.rut,
    pc.afp_code,
    pc.health_institution_code,
    pc.family_allowances
FROM employees e
LEFT JOIN payroll_config pc ON e.id = pc.employee_id
WHERE e.company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID
ORDER BY e.first_name;

-- 2. VER CONFIGURACIÓN AFP GLOBAL DE LA EMPRESA
SELECT 'CONFIGURACIÓN AFP GLOBAL:' as info;
SELECT 
    ps.afp_configs,
    ps.created_at
FROM payroll_settings ps
WHERE ps.company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID;

-- 3. VER LIQUIDACIONES GUARDADAS Y SUS COMISIONES AFP
SELECT 'LIQUIDACIONES GUARDADAS CON COMISIONES AFP:' as info;
SELECT 
    e.first_name,
    e.last_name,
    pl.period_year,
    pl.period_month,
    pl.afp_percentage,
    pl.afp_commission_percentage,
    pl.afp_amount,
    pl.afp_commission_amount,
    pl.base_salary
FROM payroll_liquidations pl
JOIN employees e ON pl.employee_id = e.id
WHERE pl.company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID
ORDER BY pl.created_at DESC
LIMIT 5;

SELECT '✅ VERIFICACIÓN AFP COMPLETA' as resultado;