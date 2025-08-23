-- Script CORREGIDO para eliminar SIS de descuentos del trabajador
-- Usando RUTs sin formato (solo números y guión final)

-- Guillermo Barría Uribe - RUT: 182089478 
UPDATE payroll_liquidations 
SET 
    total_deductions = 117250,  -- 129000 - 11750 (SIS)
    net_salary = 507750,        -- 496000 + 11750 (SIS)
    updated_at = NOW()
WHERE employee_id IN (
    SELECT id FROM employees WHERE rut LIKE '%18208947%'
) AND period_year = 2025 AND period_month = 8;

-- MIGUEL RODRIGUEZ CABRERA - RUT: 182824151
UPDATE payroll_liquidations 
SET 
    total_deductions = 120216,  -- 132647 - 12431 (SIS)
    net_salary = 541034,        -- 528603 + 12431 (SIS)
    updated_at = NOW()
WHERE employee_id IN (
    SELECT id FROM employees WHERE rut LIKE '%18282415%'
) AND period_year = 2025 AND period_month = 8;

-- FRANCISCO MANCILLA VARGAS - RUT: 172380980
UPDATE payroll_liquidations 
SET 
    total_deductions = 137515,  -- 152297 - 14782 (SIS)
    net_salary = 648735,        -- 633953 + 14782 (SIS)
    updated_at = NOW()
WHERE employee_id IN (
    SELECT id FROM employees WHERE rut LIKE '%17238098%'
) AND period_year = 2025 AND period_month = 8;

-- Mati Riquelme - RUT: 182094420
UPDATE payroll_liquidations 
SET 
    total_deductions = 687750,  -- 832687 - 144937 (SIS)
    net_salary = 7021646,       -- 6876709 + 144937 (SIS)
    updated_at = NOW()
WHERE employee_id IN (
    SELECT id FROM employees WHERE rut LIKE '%18209442%'
) AND period_year = 2025 AND period_month = 8;

-- Verificar cambios con formato de RUT más específico
SELECT 
    e.rut,
    e.first_name || ' ' || e.last_name as nombre,
    pl.total_gross_income as haberes,
    pl.total_deductions as descuentos_nuevos,
    pl.net_salary as liquido_nuevo,
    pl.updated_at
FROM payroll_liquidations pl
JOIN employees e ON pl.employee_id = e.id
WHERE pl.period_year = 2025 AND pl.period_month = 8
ORDER BY e.rut;