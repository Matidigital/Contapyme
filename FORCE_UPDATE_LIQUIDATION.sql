-- =====================================================
-- FORZAR ACTUALIZACIÓN DE LIQUIDACIÓN
-- =====================================================

-- 1. PRIMERO VERIFICAR QUE LA LIQUIDACIÓN EXISTE
SELECT COUNT(*) as existe_liquidacion 
FROM payroll_liquidations 
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- 2. VER TODOS LOS VALORES ACTUALES
SELECT 
    id,
    base_salary,
    overtime_amount,
    bonuses,
    commissions,
    gratification,
    legal_gratification_art50,
    food_allowance,
    transport_allowance,
    family_allowance,
    total_taxable_income,
    total_non_taxable_income,
    total_gross_income,
    total_deductions,
    net_salary
FROM payroll_liquidations
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- 3. FORZAR ACTUALIZACIÓN - MÉTODO 1: UPDATE DIRECTO
BEGIN;

UPDATE payroll_liquidations
SET 
    total_taxable_income = 673750,
    total_non_taxable_income = 1000,
    total_gross_income = 674750
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- Verificar cuántas filas se actualizaron
SELECT 
    id,
    total_taxable_income,
    total_non_taxable_income,
    total_gross_income
FROM payroll_liquidations
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

COMMIT;

-- 4. SI NO FUNCIONA, MÉTODO 2: RECALCULAR BASADO EN CAMPOS EXISTENTES
UPDATE payroll_liquidations AS pl
SET 
    total_taxable_income = COALESCE(pl.base_salary, 0) + 
                           COALESCE(pl.overtime_amount, 0) + 
                           COALESCE(pl.bonuses, 0) + 
                           COALESCE(pl.commissions, 0) + 
                           COALESCE(pl.gratification, 0) + 
                           COALESCE(pl.legal_gratification_art50, 0),
    
    total_non_taxable_income = COALESCE(pl.food_allowance, 0) + 
                               COALESCE(pl.transport_allowance, 0) + 
                               COALESCE(pl.family_allowance, 0),
    
    total_gross_income = COALESCE(pl.base_salary, 0) + 
                        COALESCE(pl.overtime_amount, 0) + 
                        COALESCE(pl.bonuses, 0) + 
                        COALESCE(pl.commissions, 0) + 
                        COALESCE(pl.gratification, 0) + 
                        COALESCE(pl.legal_gratification_art50, 0) +
                        COALESCE(pl.food_allowance, 0) + 
                        COALESCE(pl.transport_allowance, 0) + 
                        COALESCE(pl.family_allowance, 0)
WHERE pl.id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- 5. VERIFICACIÓN FINAL
SELECT 
    'VALORES FINALES' as resultado,
    id,
    base_salary as "Sueldo Base",
    bonuses as "Bonos",
    legal_gratification_art50 as "Grat Art 50",
    '---' as separador1,
    total_taxable_income as "Total Imponible (debe ser 673750)",
    '---' as separador2,
    food_allowance as "Colación",
    total_non_taxable_income as "Total No Imponible (debe ser 1000)",
    '---' as separador3,
    total_gross_income as "TOTAL HABERES (debe ser 674750)"
FROM payroll_liquidations
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- 6. VERIFICAR SI HAY TRIGGERS O CONSTRAINTS QUE ESTÉN INTERFIRIENDO
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'payroll_liquidations';

-- 7. SI NADA FUNCIONA, CREAR UNA NUEVA LIQUIDACIÓN CORRECTA
-- (descomentar si es necesario)
/*
INSERT INTO payroll_liquidations (
    id,
    company_id,
    employee_id,
    period_year,
    period_month,
    days_worked,
    base_salary,
    bonuses,
    legal_gratification_art50,
    food_allowance,
    total_taxable_income,
    total_non_taxable_income,
    total_gross_income,
    -- agregar otros campos necesarios
)
SELECT 
    'a2ce069b-fb18-409f-9a90-1c78eba1ba51-FIXED',
    company_id,
    employee_id,
    period_year,
    period_month,
    days_worked,
    base_salary,
    bonuses,
    legal_gratification_art50,
    food_allowance,
    673750, -- total_taxable_income correcto
    1000,   -- total_non_taxable_income correcto
    674750, -- total_gross_income correcto
FROM payroll_liquidations
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';
*/