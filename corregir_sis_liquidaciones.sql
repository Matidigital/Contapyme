-- Script para corregir liquidaciones: eliminar SIS de descuentos del trabajador
-- SIS debe ser costo patronal, no descuento del empleado

-- Guillermo Barría Uribe - RUT: 18.208.947-8
UPDATE payroll_liquidations 
SET 
    total_deductions = 117250,  -- 129000 - 11750 (SIS)
    net_salary = 507750,        -- 496000 + 11750 (SIS)
    updated_at = NOW()
WHERE employee_id IN (
    SELECT id FROM employees WHERE rut = '18.208.947-8'
) AND period_year = 2025 AND period_month = 8;

-- MIGUEL RODRIGUEZ CABRERA - RUT: 18.282.415-1  
UPDATE payroll_liquidations 
SET 
    total_deductions = 120216,  -- 132647 - 12431 (SIS)
    net_salary = 541034,        -- 528603 + 12431 (SIS)
    updated_at = NOW()
WHERE employee_id IN (
    SELECT id FROM employees WHERE rut = '18.282.415-1'
) AND period_year = 2025 AND period_month = 8;

-- FRANCISCO MANCILLA VARGAS - RUT: 17.238.098-0
UPDATE payroll_liquidations 
SET 
    total_deductions = 137515,  -- 152297 - 14782 (SIS)
    net_salary = 648735,        -- 633953 + 14782 (SIS)
    updated_at = NOW()
WHERE employee_id IN (
    SELECT id FROM employees WHERE rut = '17.238.098-0'
) AND period_year = 2025 AND period_month = 8;

-- Mati Riquelme - RUT: 18.209.442-0
UPDATE payroll_liquidations 
SET 
    total_deductions = 687750,  -- 832687 - 144937 (SIS)
    net_salary = 7021646,       -- 6876709 + 144937 (SIS)
    updated_at = NOW()
WHERE employee_id IN (
    SELECT id FROM employees WHERE rut = '18.209.442-0'
) AND period_year = 2025 AND period_month = 8;

-- Verificar cambios
SELECT 
    e.rut,
    e.first_name || ' ' || e.last_name as nombre,
    pl.total_gross_income as haberes,
    pl.total_deductions as descuentos,
    pl.net_salary as liquido,
    pl.updated_at
FROM payroll_liquidations pl
JOIN employees e ON pl.employee_id = e.id
WHERE pl.period_year = 2025 AND pl.period_month = 8
ORDER BY e.rut;