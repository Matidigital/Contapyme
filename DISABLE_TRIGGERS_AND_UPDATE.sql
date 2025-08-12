-- =====================================================
-- DESACTIVAR TRIGGERS Y ACTUALIZAR LIQUIDACIÓN
-- =====================================================

-- 1. VER QUÉ TRIGGERS EXISTEN
SELECT 
    tgname as trigger_name,
    tgtype,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'payroll_liquidations'::regclass;

-- 2. DESACTIVAR TEMPORALMENTE LOS TRIGGERS
ALTER TABLE payroll_liquidations DISABLE TRIGGER ALL;

-- 3. AHORA SÍ ACTUALIZAR CON VALORES CORRECTOS
UPDATE payroll_liquidations
SET 
    -- Haberes Imponibles = 529000 + 10000 + 134750 = 673750
    total_taxable_income = 673750,
    
    -- Haberes No Imponibles = 1000
    total_non_taxable_income = 1000,
    
    -- Total Haberes = 673750 + 1000 = 674750
    total_gross_income = 674750,
    
    -- Recalcular líquido si es necesario
    net_salary = 674750 - total_deductions
    
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- 4. VERIFICAR QUE SE ACTUALIZÓ CORRECTAMENTE
SELECT 
    id,
    '=== VALORES CORREGIDOS ===' as info,
    total_taxable_income as "Total Imponible (debe ser 673750)",
    total_non_taxable_income as "Total No Imponible (debe ser 1000)",
    total_gross_income as "Total Haberes (debe ser 674750)",
    net_salary as "Líquido a Pagar",
    '=== DETALLE ===' as detalle,
    base_salary as "Sueldo Base",
    bonuses as "Bonos",
    legal_gratification_art50 as "Gratificación Art 50",
    food_allowance as "Colación"
FROM payroll_liquidations
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- 5. REACTIVAR LOS TRIGGERS
ALTER TABLE payroll_liquidations ENABLE TRIGGER ALL;

-- 6. VERIFICAR QUE LOS VALORES SIGUEN CORRECTOS DESPUÉS DE REACTIVAR TRIGGERS
SELECT 
    'DESPUÉS DE REACTIVAR TRIGGERS' as estado,
    total_taxable_income,
    total_gross_income
FROM payroll_liquidations
WHERE id = 'a2ce069b-fb18-409f-9a90-1c78eba1ba51';

-- =====================================================
-- SI LOS VALORES VUELVEN A CAMBIAR DESPUÉS DE REACTIVAR
-- LOS TRIGGERS, ENTONCES HAY UN TRIGGER MAL CONFIGURADO
-- =====================================================

-- 7. OPCIONAL: Si hay un trigger problemático, podemos ver su definición
SELECT 
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'payroll_liquidations'::regclass;